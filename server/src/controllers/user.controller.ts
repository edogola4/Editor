import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { sequelize } from '../config/database.js';
import User from '../models/User.js';
import { CustomError } from '../utils/errors.js';

// Initialize User model with Sequelize
const UserModel = User(sequelize);

interface UpdateProfileBody {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export const getProfile = async (req: Request, res: Response) => {
  try {
    // req.user is set by the auth middleware
    const user = await UserModel.findByPk(req.user!.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Failed to fetch profile', 500, error);
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { username, email, currentPassword, newPassword } = req.body as UpdateProfileBody;
    const userId = req.user!.id;

    // Find the user
    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Update username if provided
    if (username) {
      user.username = username;
    }

    // Update email if provided
    if (email && email !== user.email) {
      // Check if email is already in use
      const existingUser = await UserModel.findOne({ where: { email } });
      if (existingUser) {
        throw new CustomError('Email already in use', 400);
      }
      user.email = email;
    }

    // Update password if current and new passwords are provided
    if (currentPassword && newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        throw new CustomError('Current password is incorrect', 400);
      }
      user.password = newPassword;
    }

    await user.save();

    // Return updated user data (without password)
    const userResponse = user.toJSON() as any;
    if (userResponse.password) {
      delete userResponse.password;
    }

    res.json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Failed to update profile', 500, error);
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { theme, notifications } = req.body;
    const userId = req.user!.id;

    // Find the user
    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Update settings
    const settings = user.settings || {};
    if (theme) settings.theme = theme;
    if (notifications !== undefined) settings.notifications = notifications;

    // Save updated settings
    user.settings = settings;
    await user.save();

    res.json({
      success: true,
      data: { settings },
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Failed to update settings', 500, error);
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find user by ID
    const user = await UserModel.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Failed to fetch user', 500, error);
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Get users with pagination
    const { count, rows: users } = await UserModel.findAndCountAll({
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Failed to fetch users', 500, error);
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Find and delete the user
    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    await user.destroy();

    // Clear the cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Failed to delete account', 500, error);
  }
};
