import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { initializeDatabase } from "../config/database.js";
import { CustomError } from "../utils/errors.js";
import { config } from "../config/config.js";
import { Sequelize } from "sequelize";

// Initialize database and get User model
let _sequelize: Sequelize;
let _User: () => any;

const initializeAuth = async () => {
  if (!_sequelize) {
    _sequelize = await initializeDatabase();
    _User = () => _sequelize.models.User as any;
  }
  return { User: _User };
};

// Create a function to get the User model
export const getUserModel = async () => {
  if (!_User) {
    await initializeAuth();
  }
  return _User!();
};

// Define UserInstance type
type UserInstance = {
  id: string;
  role: string;
  [key: string]: any; // Add other user properties as needed
};

// Extend the Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: UserInstance;
    }
  }
}

interface AuthenticatedRequest extends Request {
  cookies: {
    token?: string;
    [key: string]: string | undefined;
  };
  token?: string;
  user?: UserInstance;
}

// Authentication middleware - JWT token verification
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    let token = authReq.headers.authorization?.replace('Bearer ', '');

    if (!token && authReq.cookies?.token) {
      token = authReq.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!config.jwt?.secret) {
      throw new Error('JWT secret not configured');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as {
        id: string;
        role: string;
        type?: string;
      };

      // Check if it's an access token if type is provided
      if (decoded.type && decoded.type !== 'access') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token type',
        });
      }

      // Get user from database
      const User = await getUserModel();
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Attach user to request object
      authReq.user = user;
      next();
    } catch (error: unknown) {
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
      } else {
        // For any other errors, pass to the error handler
        next(error);
      }
    }
  } catch (error) {
    next(error);
  }
};

// Role-based access control middleware
export const authorize = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        return res.status(401).json({ 
          success: false,
          message: 'Authentication required' 
        });
      }

      // Check if user has required role
      if (!roles.includes(authReq.user.role)) {
        return res.status(403).json({ 
          success: false,
          message: 'Insufficient permissions' 
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Socket.IO authentication middleware
export const socketAuthenticate = (socket: any, next: (err?: Error) => void) => {
  (async () => {
    try {
      if (!config.jwt?.secret) {
        return next(new Error('JWT secret not configured'));
      }

      // Get token from cookies or headers
      const token = socket.handshake.auth?.token || 
                   socket.handshake.query?.token ||
                   (socket.handshake.headers.authorization || '').replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as { 
        id: string;
        role: string;
        type?: string;
      };

      // Check if it's an access token if type is provided
      if (decoded.type && decoded.type !== 'access') {
        return next(new Error('Invalid token type'));
      }

      // Get user from database
      const User = await getUserModel();
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user to socket object
      socket.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        next(new Error('Authentication error: Token expired'));
      } else if (error instanceof jwt.JsonWebTokenError) {
        next(new Error('Authentication error: Invalid token'));
      } else if (error instanceof Error) {
        next(error);
      } else {
        next(new Error('Authentication error'));
      }
    }
  })();
};
