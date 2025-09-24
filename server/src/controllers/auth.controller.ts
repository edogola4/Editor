import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { sequelize } from '../config/database.js';
import { generateTokens, setTokenCookies } from '../utils/jwt.js';
import { CustomError } from '../utils/errors.js';
import passport from 'passport';

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

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError('Validation failed', 400, { errors: errors.array() });
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
    const userResponse = user.toJSON();
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

export const login = async (req: Request, res: Response) => {
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
    const userResponse = user.toJSON();
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

export const githubAuthCallback = (req: Request, res: Response) => {
  passport.authenticate('github', { session: false }, (err: any, user: any) => {
    if (err || !user) {
      return res.redirect(`/login?error=${encodeURIComponent('GitHub authentication failed')}`);
    }

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Set HTTP-only cookies
    setTokenCookies(res, tokens);

    // Redirect to frontend with tokens in URL (for client-side handling)
    res.redirect(
      `${process.env.FRONTEND_URL}/oauth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  })(req, res);
};
