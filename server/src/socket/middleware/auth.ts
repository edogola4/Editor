import jwt from 'jsonwebtoken';
import { CustomSocket } from '../types/events';
import { Socket } from 'socket.io';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticateSocket = (socket: CustomSocket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || 
                 socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    
    // Attach user data to the socket
    socket.data = {
      user: {
        id: decoded.userId,
        username: decoded.username,
        email: decoded.email,
      },
      lastActivity: Date.now(),
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      return next(new Error(`Authentication error: ${error.message}`));
    }
    next(new Error('Authentication error: Invalid token'));
  }
};

export const requireAuth = (socket: CustomSocket, next: (err?: Error) => void) => {
  if (!socket.data?.user) {
    return next(new Error('Authentication required'));
  }
  next();
};
