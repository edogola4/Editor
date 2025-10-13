import { User, UserRole, UserStatus } from '../models/User';
import { Session } from '../models/Session.js';
import { getSequelize } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Op, FindOptions, Model } from 'sequelize';
import crypto from 'crypto';
import logger from '../utils/logger.js';

// Define the User model type with custom methods
type UserModel = typeof User & {
  findOneWithPassword: (options: any) => Promise<InstanceType<typeof User> | null>;
};

// Extend Express types
declare global {
  namespace Express {
    interface User extends InstanceType<typeof User> {}
  }
}

// Add the findOneWithPassword method to the User model
const userModel = User as UserModel;
userModel.findOneWithPassword = async function(options: any) {
  try {
    options = { 
      ...options, 
      attributes: { 
        include: ['password'] 
      } 
    };
    const result = await User.findOne(options);
    return result as InstanceType<typeof User> | null;
  } catch (error) {
    console.error('Error in findOneWithPassword:', error);
    throw error;
  }
};

interface DeviceInfo {
  userAgent: string;
  platform: string;
  browser: string;
  os: string;
  ip: string;
  fingerprint?: string;
}

interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

class AuthService {
  private static instance: AuthService;

  private constructor() {
    // Models will be accessed directly from sequelize when needed
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async getSequelizeInstance() {
    return await getSequelize();
  }

  private get User() {
    return this.getSequelizeInstance().then(seq => seq.models.User);
  }

  private get Session() {
    return this.getSequelizeInstance().then(seq => seq.models.Session);
  }

  /**
   * Register a new user
   */
  public async registerUser(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }): Promise<{ user: UserInstance; token: string }> {
    // Check if user already exists
    const UserModel1 = await this.User;
    const existingUser = await UserModel1.findOne({
      where: {
        [Op.or]: [
          { email: userData.email },
          { username: userData.username }
        ]
      }
    });

    if (existingUser) {
      throw new Error('Email or username already in use');
    }

    // Create new user - let the model's beforeCreate hook handle password hashing
    const UserModel2 = await this.User;
    const user = await UserModel2.create({
      username: userData.username,
      email: userData.email,
      password: userData.password, // Will be hashed by the model hook
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'user',
      status: 'active' as UserStatus,
    });

    // Generate auth token
    const token = uuidv4();
    const hashedToken = await bcrypt.hash(token, 10);

    // Create session
    const SessionModel1 = await this.Session;
    await SessionModel1.create({
      userId: user.id,
      token: hashedToken,
      deviceInfo: {
        userAgent: 'unknown',
        platform: 'unknown',
        browser: 'unknown',
        os: 'unknown',
        ip: 'unknown',
      },
      locationInfo: {
        country: 'unknown',
        region: 'unknown',
        city: 'unknown',
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      lastActiveAt: new Date(),
      isActive: true
    });
    
    return { user, token };
  }

  /**
   * Login user with email and password
   */
  public async login(credentials: {
    email: string;
    password: string;
    deviceInfo?: DeviceInfo;
    ipAddress?: string;
  }): Promise<{ user: InstanceType<typeof User>; token: string }> {
    const { email, password, deviceInfo, ipAddress } = credentials;

    try {
      logger.info(`Login attempt for email: ${email}`);
      
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Find user by email with password included
      const UserModelLogin = await this.User;
      const user = await UserModelLogin.findOne({
        where: { 
          email: email.toLowerCase().trim(),
          status: UserStatus.ACTIVE 
        },
        attributes: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'status']
      });

      if (!user) {
        logger.warn(`Login failed: User not found or inactive for email: ${email}`);
        throw new Error('Invalid email or password');
      }

      logger.debug(`User found: ${user.id}`);

      // Check if password is correct
      let isMatch = false;
      
      // First try bcrypt compare
      if (password && user.password) {
        isMatch = await bcrypt.compare(password, user.password);
      }
      
      // If bcrypt compare fails, try direct comparison (for backwards compatibility)
      if (!isMatch && password === user.password) {
        isMatch = true;
        
        // If direct match worked, upgrade the password hash
        if (isMatch) {
          logger.info(`Upgrading password hash for user: ${user.id}`);
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(password, salt);
          await user.save();
        }
      }
      
      if (!isMatch) {
        logger.warn(`Login failed: Invalid password for user: ${user.id}`);
        throw new Error('Invalid email or password');
      }

      logger.debug(`Password verified for user: ${user.id}`);
      
      // Generate JWT token
      const token = await this.generateAuthToken(user);
      logger.debug(`Generated token for user: ${user.id}`);

      // Create session
      if (this.createSession) {
        try {
          await this.createSession({
            userId: user.id,
            token,
            deviceInfo: deviceInfo || {
              userAgent: 'unknown',
              platform: 'unknown',
              browser: 'unknown',
              os: 'unknown',
              ip: ipAddress || 'unknown'
            },
            ipAddress: ipAddress || 'unknown'
          });
          logger.info(`Session created for user: ${user.id}`);
        } catch (sessionError) {
          logger.error(`Failed to create session for user ${user.id}:`, sessionError);
          // Don't fail login if session creation fails
        }
      } else {
        logger.warn('createSession method not available');
      }

      logger.info(`Login successful for user: ${user.id}`);
      return { 
        user: user.toJSON() as InstanceType<typeof User>, 
        token 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      logger.error(`Login error for email ${email}:`, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Validate session token
   */
  public async validateToken(token: string): Promise<{ isValid: boolean; user?: UserInstance }> {
    const session = await (this.Session as any).findOne({
      where: {
        token,
        isActive: true,
        expiresAt: { [Op.gt]: new Date() }
      },
      include: [{
        model: this.User,
        as: 'user',
        attributes: { exclude: ['password'] }
      }] as FindOptions['include']
    });

    if (!session || !session.user) {
      return { isValid: false };
    }

    // Update last active time
    await session.update({ lastActiveAt: new Date() });

    return {
      isValid: true,
      user: session.user.get({ plain: true })
    };
  }

  /**
   * Logout user by invalidating the session
   */
  public async logout(token: string): Promise<boolean> {
    const result = await (this.Session as any).update(
      { isActive: false },
      { where: { token } }
    );
    return result[0] > 0;
  }

  /**
   * Invalidate all sessions for a user
   */
  public async invalidateAllSessions(userId: string): Promise<number> {
    const result = await (this.Session as any).update(
      { isActive: false },
      { where: { userId } }
    );
    return result[0];
  }

  /**
   * Change user password
   */
  public async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    // Invalidate all sessions
    await this.invalidateAllSessions(userId);

    return true;
  }

  /**
   * Request password reset
   */
  public async requestPasswordReset(email: string): Promise<{ resetToken: string }> {
    const user = await this.User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal that the email doesn't exist
      return { resetToken: '' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      resetToken,
      resetTokenExpiry
    });

    return { resetToken };
  }

  /**
   * Reset password with token
   */
  public async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await this.User.findOne({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired token');
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    });

    // Invalidate all sessions
    await this.invalidateAllSessions(user.id);

    return true;
  }

  /**
   * Verify email with token
   */
  public async verifyEmail(token: string): Promise<boolean> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await this.User.findOne({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    // Update user status
    await user.update({
      status: UserStatus.ACTIVE,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
      emailVerified: true
    });

    return true;
  }

  /**
   * Resend verification email
   */
  public async resendVerificationEmail(email: string): Promise<{ success: boolean }> {
    const user = await this.User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal that the email doesn't exist
      return { success: true };
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new Error('Email is already verified');
    }

    // Generate new verification token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: expiresAt
    });

    // TODO: Send verification email with the token

    return { success: true };
  }
}


export default AuthService;
