import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth/AuthService';
import { getTestRedisClient } from '../tests/setup';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export const authenticate = (authService: AuthService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = await authService.verifyToken(token);
      
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.user = {
        id: decoded.id,
        email: decoded.email
      };

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const socketAuth = (authService: AuthService) => {
  return async (socket: any, next: (err?: Error) => void) => {
    try {
      const token = socket.handshake.auth.token || 
                   (socket.handshake.headers.authorization || '').split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = await authService.verifyToken(token);
      if (!decoded) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.user = {
        id: decoded.id,
        email: decoded.email
      };

      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication error'));
    }
  };
};
