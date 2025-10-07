import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { User } from '../models/User.js';

export interface AuthenticatedWebSocket extends WebSocket {
  user?: {
    id: string;
    email: string;
    name: string;
  };
  documentId?: string;
}

export const authenticateWebSocket = async (
  ws: AuthenticatedWebSocket,
  token: string | undefined,
  documentId: string
): Promise<boolean> => {
  if (!token) {
    ws.close(1008, 'Authentication token required');
    return false;
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    
    // Find user in database
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'email', 'name'],
    });

    if (!user) {
      ws.close(1008, 'User not found');
      return false;
    }

    // Attach user to WebSocket connection
    ws.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    // Attach document ID to WebSocket connection
    ws.documentId = documentId;

    return true;
  } catch (error) {
    console.error('WebSocket authentication error:', error);
    ws.close(1008, 'Invalid token');
    return false;
  }
};
