import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { sequelize } from '../config/database.js';
import User from '../models/User.js';
import { generateTokens, setTokenCookies, verifyToken } from '../utils/jwt.js';
import { CustomError } from '../utils/errors.js';
import passport from 'passport';

// Initialize User model with Sequelize
const UserModel = User(sequelize);

interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export const register = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { username, email, password } = req.body as RegisterBody;

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new CustomError('Email already in use', 400);
    }

    // Create new user
    const user = await UserModel.create({
      username,
      email,
      password,
      role: 'user',
      isVerified: false,
    });

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

    res.status(201).json({
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
    throw new CustomError('Registration failed', 500, error);
  }
};

export const login = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
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
