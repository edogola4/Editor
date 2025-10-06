import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { generateTokens, setTokenCookies, verifyToken } from '../utils/jwt.js';
import { CustomError } from '../utils/errors.js';
import passport from 'passport';
import { logger } from '../services/LoggingService.js';
import { UserRole } from '../models/EnhancedUser.js';
import AuthService from '../services/AuthService.js';
import { checkRole } from '../middleware/rbac.middleware.js';

interface LoginBody {
  email: string;
  password: string;
}

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw CustomError.badRequest('Validation failed', errors.array());
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Get AuthService instance
    const authService = AuthService.getInstance();

    // Register user using AuthService
    const { user, token } = await authService.registerUser({
      username,
      email,
      password,
      firstName,
      lastName,
    });

    // Set auth cookies
    setTokenCookies(res, {
      accessToken: token,
      refreshToken: token // Note: In a real app, you might want to generate a proper refresh token here
    });

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
    const decoded = verifyToken(refreshToken, true); // true indicates it's a refresh token
    
    // Get user from database
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      throw CustomError.unauthorized('User not found');
    }

    // Generate new tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
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
  console.log('Starting GitHub OAuth callback handler');
  console.log('Request URL:', req.originalUrl);
  console.log('Query params:', req.query);
  
  passport.authenticate('github', { 
    session: false,
    failureRedirect: `${process.env.CLIENT_URL ? process.env.CLIENT_URL : 'http://localhost:5173'}/login?error=github_auth_failed`
  }, async (err: Error, user: any, info: any) => {
    try {
      if (err || !user) {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const errorMessage = err?.message || 'GitHub authentication failed';
        return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(errorMessage)}`);
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(
        user.id,
        user.email,
      );

      // Set cookies
      setTokenCookies(res, accessToken, refreshToken);

      // Log the GitHub login
      await logger.security(
        `GitHub login: ${user.email}`,
        'AUTHENTICATION',
        req,
        { userId: user.id, provider: 'github' }
      );

      // Ensure CLIENT_URL is set
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      
      // Construct the redirect URL with tokens
      try {
        const redirectUrl = new URL('/auth/callback', clientUrl);
        redirectUrl.searchParams.append('accessToken', accessToken);
        redirectUrl.searchParams.append('refreshToken', refreshToken);
        
        console.log('Redirecting to:', redirectUrl.toString());
        return res.redirect(redirectUrl.toString());
      } catch (error) {
        console.error('Error constructing redirect URL:', error);
        // Fallback to a simple redirect with tokens in query params
        return res.redirect(`${clientUrl}/auth/callback?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`);
      }
    } catch (error) {
      next(error);
    }
  })(req, res, next);
};
