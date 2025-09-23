import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sequelize } from '../config/database.js';
import UserModel, { UserInstance } from '../models/User.js';
import { CustomError } from '../utils/errors.js';
import config from '../config/config.js';

// Initialize the User model with the sequelize instance
const User = UserModel(sequelize);

// Extend the Express Request type to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: UserInstance;
    }
  }
}

// Extend the Express Request type to include the cookies property
interface AuthenticatedRequest extends Request {
  cookies: {
    token?: string;
    [key: string]: string | undefined;
  };
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header or cookie
    let token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;

    if (!token) {
      throw new CustomError('Authentication required', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string };

    // Find user by id from token
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new CustomError('Token expired', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new CustomError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

// Role-based access control middleware
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new CustomError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new CustomError(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }

    next();
  };
};

// Socket.IO authentication middleware
export const socketAuthenticate = (socket: any, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { id: string };
    socket.userId = decoded.id;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new Error('Authentication error: Token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new Error('Authentication error: Invalid token'));
    } else {
      next(new Error('Authentication error'));
    }
  }
};
