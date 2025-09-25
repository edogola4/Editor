import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sequelize } from "../config/database.js";
import UserModel, { UserInstance } from "../models/User.js";
import { CustomError } from "../utils/errors.js";
import { config } from "../config/config.js";

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

// Authentication middleware - Mock implementation for development
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // For development, we'll mock the authentication
    // In production, this would verify JWT tokens and check database

    // Mock user object
    req.user = {
      id: 'user_mock',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
      isVerified: true,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      password: 'hashed_password',
      // Add any other required properties
    } as any;

    next();
  } catch (error) {
    next(error);
  }
};

// Role-based access control middleware
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new CustomError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new CustomError(
          `User role ${req.user.role} is not authorized to access this route`,
          403,
        ),
      );
    }

    next();
  };
};

// Socket.IO authentication middleware
export const socketAuthenticate = (
  socket: any,
  next: (err?: Error) => void,
) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { id: string };
    socket.userId = decoded.id;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new Error("Authentication error: Token expired"));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new Error("Authentication error: Invalid token"));
    } else {
      next(new Error("Authentication error"));
    }
  }
};
