import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sequelize } from '../config/database.js';
import { generateTokens, setTokenCookies, verifyToken } from '../utils/jwt.js';
import { CustomError } from '../utils/errors.js';
import passport from 'passport';
import { logger } from '../services/LoggingService.js';
import { UserRole } from '../models/EnhancedUser.js';
import AuthService from '../services/AuthService.js';
import { checkRole } from '../middleware/rbac.middleware.js';
import { User as UserModel } from '../models/User.js';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError('Validation failed', 400, { errors: errors.array() });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Register user using AuthService
    const { user, token } = await AuthService.registerUser({
      username,
      email,
      password,
      firstName,
      lastName,
    });

    // Set auth cookies
    setTokenCookies(res, token);

    // Log the registration
    await logger.security(
      `New user registered: ${user.email}`,
      'AUTHENTICATION',
      req,
      { userId: user.id }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError('Validation failed', 400, { errors: errors.array() });
    }

    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    // Authenticate user using AuthService
    const { user, token } = await AuthService.login(
      email, 
      password, 
      { userAgent, ip: ipAddress }, 
      ipAddress
    );

    // Set auth cookies
    setTokenCookies(res, token);

    // Log the login
    await logger.security(
      `User logged in: ${user.email}`,
      'AUTHENTICATION',
      req,
      { userId: user.id, ipAddress }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    
    if (token) {
      await AuthService.logout(token);
    }

    // Clear cookies
    res.clearCookie('token');
    res.clearCookie('refreshToken');

    // Log the logout
    if (req.user) {
      await logger.security(
        `User logged out: ${req.user.email}`,
        'AUTHENTICATION',
        req,
        { userId: req.user.id }
      );
    }

    res.json({ success: true, message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      throw new CustomError('Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, 'refresh');
    
    // Get user from database
    const user = await AuthService.getUserById(decoded.userId);
    
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Set new cookies
    setTokenCookies(res, accessToken, newRefreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    next(error);
  }
};

// Password reset request
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new CustomError('Email is required', 400);
    }

    await AuthService.requestPasswordReset(email);
    
    // Log the password reset request
    await logger.security(
      `Password reset requested for: ${email}`,
      'AUTHENTICATION',
      req,
      { email }
    );

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

// Reset password with token
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    
    if (!token || !newPassword) {
      throw new CustomError('Token and new password are required', 400);
    }

    await AuthService.resetPassword(token, newPassword);
    
    // Log the password reset
    await logger.security(
      'Password reset successful',
      'AUTHENTICATION',
      req
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// Verify email with token
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    
    if (!token) {
      throw new CustomError('Verification token is required', 400);
    }

    await AuthService.verifyEmail(token);
    
    // Log the email verification
    await logger.security(
      'Email verified successfully',
      'AUTHENTICATION',
      req
    );

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in to your account.'
    });
  } catch (error) {
    next(error);
  }
};

// Resend verification email
export const resendVerificationEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new CustomError('Email is required', 400);
    }

    await AuthService.resendVerificationEmail(email);
    
    // Log the resend verification email
    await logger.security(
      `Verification email resent to: ${email}`,
      'AUTHENTICATION',
      req,
      { email }
    );

    res.json({
      success: true,
      message: 'If an account with that email exists, a new verification email has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new CustomError('Not authenticated', 401);
    }

    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new CustomError('Not authenticated', 401);
    }

    const { firstName, lastName, bio, company, location, website, timezone, preferredLanguage } = req.body;
    
    const updatedUser = await AuthService.updateUserProfile(req.user.id, {
      firstName,
      lastName,
      bio,
      company,
      location,
      website,
      timezone,
      preferredLanguage
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// Admin only: Get all users (paginated)
export const getAllUsers = [
  checkRole([UserRole.ADMIN, UserRole.OWNER]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const users = await AuthService.getAllUsers(Number(page), Number(limit));
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }
];

// Admin only: Update user role
export const updateUserRole = [
  checkRole([UserRole.ADMIN, UserRole.OWNER]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!userId || !role) {
        throw new CustomError('User ID and role are required', 400);
      }

      const updatedUser = await AuthService.updateUserRole(userId, role, req.user?.id);
      
      res.json({
        success: true,
        message: 'User role updated successfully',
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }
];

// Admin only: Deactivate user
export const deactivateUser = [
  checkRole([UserRole.ADMIN, UserRole.OWNER]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        throw new CustomError('User ID is required', 400);
      }

      await AuthService.deactivateUser(userId, req.user?.id);
      
      res.json({
        success: true,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
];

// GitHub OAuth handlers
export const githubAuth = passport.authenticate('github');

export const githubAuthCallback = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('github', { session: false }, async (err: Error, user: any, info: any) => {
    try {
      if (err || !user) {
        const errorMessage = err?.message || 'GitHub authentication failed';
        return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent(errorMessage)}`);
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Set cookies
      setTokenCookies(res, accessToken, refreshToken);

      // Log the GitHub login
      await logger.security(
        `GitHub login: ${user.email}`,
        'AUTHENTICATION',
        req,
        { userId: user.id, provider: 'github' }
      );

      // Redirect to success URL with tokens in query params (for clients that don't support cookies)
      res.redirect(
        `${process.env.CLIENT_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    } catch (error) {
      next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError('Validation failed', 400, { errors: errors.array() });
    }

    const { email, password } = req.body as LoginBody;

    // Find user by email
    const user = await UserModel.findOne({ where: { email } });

    if (!user) {
      throw new CustomError('Invalid credentials', 401);
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new CustomError('Invalid credentials', 401);
    }

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Set HTTP-only cookies
    setTokenCookies(res, tokens);

    // Return user data (without password)
    const userResponse: any = user.toJSON();
    delete userResponse.password;

    res.json({
      success: true,
      data: {
        user: userResponse,
        tokens,
      },
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Login failed', 500, error);
  }
};

export const logout = (req: Request, res: Response) => {
  // Clear the cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Successfully logged out',
  });
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new CustomError('Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, true);

    // Find user
    const user = await UserModel.findByPk(decoded.id);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Generate new tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Set new tokens in cookies
    setTokenCookies(res, tokens);

    res.json({
      success: true,
      data: {
        tokens,
      },
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Failed to refresh token', 500, error);
  }
};

// GitHub OAuth handlers
export const githubAuth = passport.authenticate('github');

// Password reset request
// This would typically send a password reset email with a token
export const forgotPassword = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await UserModel.findOne({ where: { email } });
    
    // For security, don't reveal if email exists or not
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }
    
    // Generate password reset token (implementation depends on your email service)
    // const resetToken = generatePasswordResetToken(user.id);
    // await sendPasswordResetEmail(user.email, resetToken);
    
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    throw new CustomError('Failed to process password reset request', 500);
  }
};

// Reset password with token
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    // Verify token and get user ID (implementation depends on your token system)
    // const userId = verifyPasswordResetToken(token);
    // if (!userId) {
    //   throw new CustomError('Invalid or expired token', 400);
    // }
    
    // Find user and update password
    // const user = await UserModel.findByPk(userId);
    // if (!user) {
    //   throw new CustomError('User not found', 404);
    // }
    
    // user.password = password;
    // await user.save();
    
    res.json({
      success: true,
      message: 'Password has been reset successfully.'
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Failed to reset password', 500, error);
  }
};

// Verify email with token
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    // Verify token and get user ID (implementation depends on your token system)
    // const userId = verifyEmailToken(token);
    // if (!userId) {
    //   throw new CustomError('Invalid or expired token', 400);
    // }
    
    // Update user's email verification status
    // await UserModel.update({ isVerified: true }, { where: { id: userId } });
    
    // Redirect to success page or return success response
    // res.redirect('/email-verified');
    res.json({
      success: true,
      message: 'Email verified successfully.'
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Failed to verify email', 500, error);
  }
};

// Resend verification email
export const resendVerificationEmail = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await UserModel.findOne({ where: { email } });
    
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a verification email has been sent.'
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified.'
      });
    }
    
    // Generate and send verification email
    // const verificationToken = generateEmailVerificationToken(user.id);
    // await sendVerificationEmail(user.email, verificationToken);
    
    res.json({
      success: true,
      message: 'If an account with that email exists, a verification email has been sent.'
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    throw new CustomError('Failed to resend verification email', 500);
  }
};

export const githubAuthCallback = (req: Request, res: Response): void => {
  passport.authenticate('github', { session: false, failureRedirect: '/login' }, (err: any, user: any, info: any) => {
    if (err || !user) {
      const errorMessage = err?.message || info?.message || 'GitHub authentication failed';
      console.error('GitHub OAuth error:', errorMessage);
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(errorMessage)}`
      );
    }

    try {
      // Generate tokens
      const tokens = generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // Set HTTP-only cookies for security
      setTokenCookies(res, tokens);

      // Create a simple HTML page that will send the tokens to the parent window
      // This is a workaround for the OAuth flow since we can't directly set cookies on the frontend
      const userData = JSON.stringify({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified || true,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || new Date().toISOString()
      });
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authenticating...</title>
            <script>
              // Send the tokens to the parent window
              window.opener.postMessage({
                type: 'OAUTH_SUCCESS',
                payload: {
                  accessToken: '${tokens.accessToken}',
                  refreshToken: '${tokens.refreshToken}',
                  user: ${userData}
                }
              }, '${process.env.FRONTEND_URL}');
              
              // Close the popup
              window.close();
            </script>
          </head>
          <body>
            <p>Authentication successful! You can close this window.</p>
            <script>
              // Fallback in case window.close() doesn't work
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `;
      
      res.send(html);
    } catch (error) {
      console.error('Error in GitHub OAuth callback:', error);
      res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Failed to complete authentication')}`
      );
    }
  })(req, res);
};
