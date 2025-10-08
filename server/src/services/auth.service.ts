import { UserRole, UserStatus } from '../models/User.js';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Op, FindOptions } from 'sequelize';
import crypto from 'crypto';
import type { UserInstance } from '../models/User.js';
import type { SessionInstance } from '../models/Session.js';
import db from '../models/index.js';

// Extend Express types
declare global {
  namespace Express {
    interface User extends UserInstance {}
  }
}

type SessionModel = typeof db.Session;
type UserModel = typeof db.User;

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
  private Session: SessionModel;
  private User: UserModel;
  
  private constructor() {
    // Use models from the central models/index.ts
    this.Session = db.Session;
    this.User = db.User;
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
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
    const existingUser = await this.User.findOne({
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
    const user = await this.User.create({
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
    await (this.Session as any).create({
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
      isActive: true,
    });

    return { user, token };
  }

  /**
   * Login user
   */
  public async login(credentials: {
    email: string;
    password: string;
    deviceInfo?: DeviceInfo;
    ipAddress?: string;
  }): Promise<{ user: UserInstance; token: string }> {
    const { email, password, deviceInfo, ipAddress } = credentials;

    // Find user by email
    const user = await this.User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if password is correct
    let isMatch = false;
    
    // First try direct comparison (in case password is already hashed)
    if (password === user.password) {
      isMatch = true;
    } 
    // If direct comparison fails, try bcrypt compare
    else if (password && user.password) {
      isMatch = await bcrypt.compare(password, user.password);
    }
    
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Generate auth token
    const token = uuidv4();
    const hashedToken = await bcrypt.hash(token, 10);

    // Create session
    await (this.Session as any).create({
      userId: user.id,
      token: hashedToken,
      deviceInfo: {
        userAgent: deviceInfo?.userAgent || 'unknown',
        platform: deviceInfo?.platform || 'unknown',
        browser: deviceInfo?.browser || 'unknown',
        os: deviceInfo?.os || 'unknown',
        ip: ipAddress || 'unknown',
      },
      locationInfo: {
        country: 'unknown',
        region: 'unknown',
        city: 'unknown',
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      lastActiveAt: new Date(),
      isActive: true,
    });

    return { user, token };
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
