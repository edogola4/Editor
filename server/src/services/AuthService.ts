import User, { UserRole, UserStatus } from '../models/User.js';
import Session from '../models/Session.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import crypto from 'crypto';

export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}

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
  }): Promise<{ user: any; token: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: userData.email },
          { username: userData.username }
        ]
      }
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Create new user
    const user = await User.create({
      ...userData,
      role: UserRole.USER,
      status: UserStatus.PENDING_VERIFICATION,
      emailNotifications: true,
    });

    // Generate auth token
    const token = await this.createSession(user.id);

    // TODO: Send verification email

    return { user: user.toJSON(), token };
  }

  /**
   * Authenticate user with email and password
   */
  public async login(email: string, password: string, deviceInfo: any, ipAddress: string): Promise<{ user: any; token: string }> {
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('Account is not active. Please check your email for verification.');
    }

    // Update user's last login and login count
    await user.update({
      lastLoginAt: new Date(),
      loginCount: (user.loginCount || 0) + 1
    });

    // Create new session
    const token = await this.createSession(user.id, deviceInfo, ipAddress);

    return { user: user.toJSON(), token };
  }

  /**
   * Create a new session for the user
   */
  public async createSession(
    userId: string, 
    deviceInfo?: any, 
    ipAddress?: string
  ): Promise<string> {
    const token = uuidv4();
    
    await Session.create({
      userId,
      token,
      deviceInfo: deviceInfo || {},
      locationInfo: { ip: ipAddress },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      lastActivity: new Date(),
      isActive: true,
    });

    return token;
  }

  /**
   * Verify session token
   */
  public async verifyToken(token: string): Promise<{ isValid: boolean; user?: any }> {
    const session = await Session.findOne({
      where: {
        token,
        isActive: true,
        expiresAt: { [Op.gt]: new Date() }
      },
      include: [
        { model: User, as: 'user' }
      ]
    });

    if (!session) {
      return { isValid: false };
    }

    // Update last activity
    await session.update({ lastActivity: new Date() });

    return {
      isValid: true,
      user: session.user?.toJSON()
    };
  }

  /**
   * Logout user by invalidating the session
   */
  public async logout(token: string): Promise<boolean> {
    const result = await Session.update(
      { isActive: false },
      { where: { token } }
    );

    return result[0] > 0;
  }

  /**
   * Invalidate all sessions for a user
   */
  public async invalidateAllSessions(userId: string): Promise<number> {
    const result = await Session.update(
      { isActive: false },
      { where: { userId } }
    );

    return result[0];
  }

  /**
   * Change user password
   */
  public async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    await user.update({ password: newPassword });
    
    // Invalidate all sessions for security
    await this.invalidateAllSessions(userId);

    return true;
  }

  /**
   * Request password reset
   */
  public async requestPasswordReset(email: string): Promise<{ resetToken: string }> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists or not
      return { resetToken: '' };
    }

    const { resetToken } = user.generatePasswordResetToken();
    await user.save();

    // TODO: Send password reset email
    
    return { resetToken };
  }

  /**
   * Reset password using reset token
   */
  public async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired token');
    }

    // Update password and clear reset token
    await user.update({
      password: newPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    });

    // Invalidate all sessions for security
    await this.invalidateAllSessions(user.id);

    return true;
  }

  /**
   * Verify email using verification token
   */
  public async verifyEmail(token: string): Promise<boolean> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { [Op.gt]: new Date() },
        isVerified: false
      }
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    // Mark email as verified
    await user.update({
      isVerified: true,
      status: UserStatus.ACTIVE,
      emailVerificationToken: null,
      emailVerificationExpires: null
    });

    return true;
  }

  /**
   * Resend verification email
   */
  public async resendVerificationEmail(email: string): Promise<{ success: boolean }> {
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Don't reveal if user exists or not
      return { success: true };
    }

    if (user.isVerified) {
      return { success: true };
    }

    // Generate new verification token
    const { token } = user.generateEmailVerificationToken();
    await user.save();

    // TODO: Send verification email
    
    return { success: true };
  }
}

export default AuthService.getInstance();
