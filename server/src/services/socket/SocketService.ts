import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { RedisAdapterService } from './RedisAdapterService';
import { User } from '../../types/user.types';
import { 
  UserSocket, 
  RoomInfo, 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  UserPresence
} from '../../types/socket.types';
import { logger } from '../../utils/logger';

export class SocketService {
  private static instance: SocketService;
  private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;
  private redisAdapter: RedisAdapterService;
  private rooms: Map<string, RoomInfo> = new Map();
  private userSockets: Map<string, UserSocket[]> = new Map(); // userId -> Socket[]
  private userPresence: Map<string, UserPresence> = new Map();
  private readonly MAX_USERS_PER_ROOM = 50;

  private constructor() {
    this.redisAdapter = RedisAdapterService.getInstance();
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public async initialize(httpServer: HttpServer, redisUrl: string): Promise<void> {
    try {
      // Initialize Redis adapter
      await this.redisAdapter.initialize(redisUrl);

      // Create Socket.IO server
      this.io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
        cors: {
          origin: process.env.CLIENT_URL || '*',
          methods: ['GET', 'POST'],
          credentials: true
        },
        pingTimeout: 10000,
        pingInterval: 5000,
        connectionStateRecovery: {
          maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
          skipMiddlewares: true
        }
      });

      // Attach Redis adapter
      this.redisAdapter.attachToServer(this.io);

      // Setup middleware
      this.setupMiddleware();

      // Setup event handlers
      this.setupEventHandlers();

      logger.info('Socket.IO server initialized');
    } catch (error) {
      logger.error('Failed to initialize Socket.IO server:', error);
      throw error;
    }
  }

  private setupMiddleware(): void {
    if (!this.io) return;

    // Authentication middleware
    this.io.use(async (socket: UserSocket, next) => {
      try {
        const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
        
        // In a real app, you would fetch the user from the database
        const user: User = {
          id: decoded.userId,
          username: `user-${decoded.userId.slice(0, 6)}`,
          email: '',
          role: 'user'
        };

        // Attach user to socket
        socket.user = user;
        
        // Track socket connection
        this.trackUserSocket(socket);
        
        next();
      } catch (error) {
        logger.error('Authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private trackUserSocket(socket: UserSocket): void {
    if (!socket.user) return;

    const userId = socket.user.id;
    
    // Initialize user's socket array if it doesn't exist
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    
    // Add socket to user's sockets
    this.userSockets.get(userId)?.push(socket);
    
    // Initialize or update presence
    this.updateUserPresence(userId, socket.id, 'online');
    
    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private updateUserPresence(userId: string, socketId: string, status: 'online' | 'away' | 'offline'): void {
    const presence: UserPresence = {
      userId,
      socketId,
      status,
      lastSeen: new Date()
    };
    
    this.userPresence.set(userId, presence);
    
    // Notify all connected sockets about the presence update
    this.io?.to(userId).emit('presence:update', userId, status);
  }

  private handleDisconnect(socket: UserSocket): void {
    if (!socket.user) return;

    const userId = socket.user.id;
    
    // Remove socket from user's sockets
    const userSockets = this.userSockets.get(userId) || [];
    const updatedSockets = userSockets.filter(s => s.id !== socket.id);
    
    if (updatedSockets.length === 0) {
      // No more sockets for this user, mark as offline
      this.userSockets.delete(userId);
      this.updateUserPresence(userId, socket.id, 'offline');
      
      // Leave all rooms
      if (socket.rooms) {
        socket.rooms.forEach(roomId => {
          if (roomId !== socket.id) { // Skip the default room
            this.leaveRoom(socket, roomId);
          }
        });
      }
    } else {
      this.userSockets.set(userId, updatedSockets);
    }
    
    logger.info(`Socket ${socket.id} disconnected. User ${userId} has ${updatedSockets.length} remaining connections.`);
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: UserSocket) => {
      if (!socket.user) {
        socket.disconnect(true);
        return;
      }

      const userId = socket.user.id;
      logger.info(`User ${userId} connected with socket ${socket.id}`);

      // Join user's personal room for direct messaging
      socket.join(userId);

      // Set up ping/pong for connection health
      let pongReceived = true;
      const pingInterval = setInterval(() => {
        if (!pongReceived) {
          logger.warn(`No pong received from user ${userId}, disconnecting...`);
          socket.disconnect();
          return;
        }
        
        pongReceived = false;
        socket.emit('ping', () => {
          pongReceived = true;
        });
      }, 30000); // 30 seconds

      // Clean up on disconnect
      socket.on('disconnect', () => {
        clearInterval(pingInterval);
      });

      // Room management
      socket.on('room:join', async (roomId, callback) => {
        try {
          await this.joinRoom(socket, roomId);
          callback({ success: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to join room';
          callback({ success: false, message });
        }
      });

      socket.on('room:leave', (callback) => {
        try {
          if (socket.roomId) {
            this.leaveRoom(socket, socket.roomId);
            callback({ success: true });
          } else {
            throw new Error('Not in a room');
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to leave room';
          callback({ success: false, message });
        }
      });

      // Message handling
      socket.on('chat:message', (message, callback) => {
        if (!socket.roomId) {
          callback({ success: false, timestamp: new Date() });
          return;
        }

        const messageData = {
          id: uuidv4(),
          userId: socket.user!.id,
          content: message,
          timestamp: new Date(),
          type: 'text' as const
        };

        // Broadcast to room
        socket.to(socket.roomId).emit('chat:message', messageData);
        callback({ success: true, timestamp: messageData.timestamp });
      });

      // Code collaboration
      socket.on('code:update', (data) => {
        if (!socket.roomId) return;
        
        socket.to(socket.roomId).emit('code:updated', {
          userId: socket.user!.id,
          code: data.code,
          cursorPosition: data.cursorPosition,
          timestamp: new Date()
        });
      });

      // Cursor movement
      socket.on('cursor:move', (position) => {
        if (!socket.roomId) return;
        
        socket.to(socket.roomId).emit('cursor:moved', {
          userId: socket.user!.id,
          position,
          name: socket.user!.username,
          color: this.getUserColor(socket.user!.id)
        });
      });
    });
  }

  private async joinRoom(socket: UserSocket, roomId: string): Promise<void> {
    if (!socket.user) {
      throw new Error('Unauthorized');
    }

    // Check if room exists
    let room = this.rooms.get(roomId);
    
    // Create room if it doesn't exist
    if (!room) {
      room = {
        id: roomId,
        name: roomId, // In a real app, you might want to fetch the room name from a database
        users: new Map(),
        maxUsers: this.MAX_USERS_PER_ROOM,
        isPrivate: false, // Default to public
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.rooms.set(roomId, room);
    }

    // Check if room is full
    if (room.users.size >= room.maxUsers) {
      throw new Error('Room is full');
    }

    // Check if user is already in the room
    if (room.users.has(socket.user.id)) {
      throw new Error('User already in room');
    }

    // Leave current room if any
    if (socket.roomId) {
      this.leaveRoom(socket, socket.roomId);
    }

    // Join the room
    await socket.join(roomId);
    socket.roomId = roomId;
    
    // Add user to room
    room.users.set(socket.user.id, socket.user);
    room.updatedAt = new Date();

    // Notify the user who joined
    socket.emit('room:joined', {
      room: {
        id: room.id,
        name: room.name,
        maxUsers: room.maxUsers,
        isPrivate: room.isPrivate,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt
      },
      users: Array.from(room.users.values())
    });

    // Notify others in the room
    socket.to(roomId).emit('room:user-joined', socket.user);

    logger.info(`User ${socket.user.id} joined room ${roomId}`);
  }

  private leaveRoom(socket: UserSocket, roomId: string): void {
    if (!socket.user || !socket.rooms.has(roomId)) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    // Remove user from room
    room.users.delete(socket.user.id);
    room.updatedAt = new Date();

    // Leave the socket room
    socket.leave(roomId);
    delete socket.roomId;

    // Notify others in the room
    socket.to(roomId).emit('room:user-left', socket.user.id);

    // Clean up room if empty
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      logger.info(`Room ${roomId} deleted (no users left)`);
    }

    logger.info(`User ${socket.user.id} left room ${roomId}`);
  }

  private getUserColor(userId: string): string {
    // Simple hash function to generate consistent colors for users
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEEAD', '#D4A5A5', '#9B786F', '#E8F4F8'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  public async close(): Promise<void> {
    if (this.io) {
      // Close all connections
      this.io.sockets.sockets.forEach(socket => {
        socket.disconnect(true);
      });
      
      // Close the server
      await new Promise<void>((resolve) => {
        if (this.io) {
          this.io.close(() => {
            this.io = null;
            resolve();
          });
        } else {
          resolve();
        }
      });
      
      // Close Redis connection
      await this.redisAdapter.close();
      
      logger.info('Socket.IO server closed');
    }
  }

  public getIO() {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }
    return this.io;
  }
}
