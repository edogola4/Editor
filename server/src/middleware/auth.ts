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

// Authentication middleware - JWT token verification
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get token from Authorization header or cookies
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      email: string;
      role: string;
      type: string;
    };

    // Check if it's an access token
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
      });
    }

    // Get user from database
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
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
