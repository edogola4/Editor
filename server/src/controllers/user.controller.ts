import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { sequelize } from '../config/database.js';
import { CustomError } from '../utils/errors.js';

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

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError('Validation failed', 400, { errors: errors.array() });
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
    const userResponse = user.toJSON();
    delete userResponse.password;

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
