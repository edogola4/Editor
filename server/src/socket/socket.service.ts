import { Server as HttpServer } from 'http';
import { Server, Socket as BaseSocket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import type { 
  CustomSocket, 
  ClientToServerEvents, 
  ServerToClientEvents, 
  ServerToServerEvents,
  InterServerEvents, 
  SocketData, 
  CursorPosition, 
  SelectionRange,
  DocumentOperation,
  User
} from './types/events.js';
import { authenticateSocket, requireAuth } from './middleware/auth.js';
import { roomService } from './services/room.service.js';
import { documentService } from './services/document.service.js';
import { ChatService } from './services/chat.service.js';
import { randomColor } from '../utils/color.js';

export class SocketService {
  private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  private redisClient: Redis;
  private redisAdapter: any;

  constructor(server: HttpServer, redisClient: Redis) {
    this.redisClient = redisClient;
    
    // Initialize Socket.IO server
    this.io = new Server<ClientToServerEvents, ServerToServerEvents, InterServerEvents, SocketData>(server, {
      cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      connectionStateRecovery: {
        // Enable connection recovery with a 60-second timeout
        maxDisconnectionDuration: 60000,
        // Skip middlewares upon successful recovery
        skipMiddlewares: true,
      },
    });

    // Set up Redis adapter for scaling
    if (this.redisClient) {
      const pubClient = this.redisClient.duplicate();
      const subClient = this.redisClient.duplicate();
      this.redisAdapter = createAdapter(pubClient, subClient);
      this.io.adapter(this.redisAdapter);
    }

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use((socket: CustomSocket, next) => {
      try {
        authenticateSocket(socket, next);
      } catch (error) {
        next(error instanceof Error ? error : new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: CustomSocket) => {
      const user = socket.data.user;
      if (!user) {
        console.error('No user data in socket');
        return socket.disconnect(true);
      }

      console.log(`User connected: ${user.id} (${user.username})`);
      
      // Assign a color to the user if not already set
      if (!user.color) {
        user.color = randomColor();
      }
      
      // Register user socket with presence
      roomService.registerUserSocket(user.id, socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${user.id}`);
        this.handleDisconnect(socket);
      });

      // Room events
      socket.on('room:join', (payload, callback) => this.handleJoinRoom(socket, payload, callback));
      socket.on('room:leave', (payload) => this.handleLeaveRoom(socket, payload));
      
      // Document events
      socket.on('document:join', (documentId, callback) => this.handleDocumentJoin(socket, documentId, callback));
      socket.on('document:leave', (documentId, callback) => this.handleDocumentLeave(socket, documentId, callback));
      socket.on('document:operation', (operation, callback) => 
        this.handleDocumentOperation(socket, operation, callback)
      );
      socket.on('document:sync', (payload) => this.handleDocumentSync(socket, payload));
      
      // Cursor and selection events
      socket.on('cursor:move', (position: CursorPosition) => {
        roomService.updateCursorPosition(user.id, position);
        // Broadcast to other users in the same room
        if (socket.data.roomId) {
          socket.to(socket.data.roomId).emit('cursor:update', {
            userId: user.id,
            position
          });
        }
      });

      socket.on('selection:change', (selection: SelectionRange | null) => {
        roomService.updateSelection(user.id, selection);
        // Broadcast to other users in the same room
        if (socket.data.roomId && selection) {
          socket.to(socket.data.roomId).emit('selection:update', {
            userId: user.id,
            selection
          });
        }
      });

      // Formatting events
      socket.on('format:text', (payload: { range: SelectionRange; formatting: TextFormatting }) => {
        if (!socket.data.roomId) return;
        
        // Create and apply format operation
        const formatOp: DocumentOperation = {
          type: 'format',
          position: payload.range.anchor.ch,
          length: Math.abs(payload.range.head.ch - payload.range.anchor.ch),
          version: 0, // Will be set by document service
          clientId: socket.id,
          timestamp: Date.now(),
          userId: user.id,
          formatting: payload.formatting
        };

        // Apply operation locally first
        const result = documentService.applyOperation(socket.data.roomId, formatOp);
        
        if (result.success) {
          // Broadcast to other users in the room
          socket.to(socket.data.roomId).emit('format:apply', {
            range: payload.range,
            formatting: payload.formatting,
            userId: user.id
          });
        }
      });
      // Presence events
      socket.on('user:typing', (payload) => this.handleUserTyping(socket, payload));
    });
  }

  private async handleJoinRoom(
    socket: CustomSocket, 
    payload: { roomId: string; user?: Omit<User, 'id'> },
    callback: (response: { success: boolean; message?: string; user?: User }) => void
  ): Promise<void> {
    try {
      const { roomId } = payload;
      const user = socket.data.user;
      
      if (!user) {
        callback({ success: false, message: 'User not authenticated' });
        return;
      }
      
      // Update user data if provided in the payload
      if (payload.user) {
        Object.assign(user, payload.user);
      }

      // Join the room
      const room = roomService.joinRoom(roomId, user);
      await socket.join(roomId);
      socket.data.roomId = roomId;
      
      // Send success response with user data (including color)
      callback({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          color: user.color
        }
      });
      
      // Notify other users in the room about the new user
      const members = roomService.getRoomMembers(roomId);
      socket.to(roomId).emit('presence:update', members);
      
      // Notify all users in the room about the new member
      socket.to(roomId).emit('room:joined', {
        room: {
          id: room.id,
          name: room.name,
          owner: room.owner,
          maxMembers: room.maxMembers,
          createdAt: room.createdAt
        },
        members: members
      });
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to join room' 
      });
    }
  }

  private handleUserTyping(
    socket: CustomSocket,
    payload: { isTyping: boolean; roomId: string }
  ): void {
    const { isTyping, roomId } = payload;
    const user = socket.data.user;
    
    if (!user || !roomId) return;
    
    // Update typing status in presence
    roomService.setUserTyping(user.id, isTyping);
    
    // Broadcast typing status to other users in the room
    socket.to(roomId).emit('user:typing', {
      userId: user.id,
      isTyping
    });
  }

  private handleCursorPosition(
    socket: CustomSocket,
    position: CursorPosition
  ): void {
    const user = socket.data.user;
    const roomId = socket.data.roomId;
    
    if (!user || !roomId) return;
    
    // Update user position in presence
    roomService.updateCursorPosition(user.id, position);
    
    // Broadcast position to other users in the room
    socket.to(roomId).emit('cursor:update', {
      userId: user.id,
      position
    });
  }

  private handleSelectionChange(
    socket: CustomSocket,
    selection: SelectionRange | null
  ): void {
    const user = socket.data.user;
    const roomId = socket.data.roomId;
    
    if (!user || !roomId) return;
    
    // Update user selection in presence
    roomService.updateSelection(user.id, selection);
    
    // Broadcast selection to other users in the room
    socket.to(roomId).emit('selection:update', {
      userId: user.id,
      selection
    });
  }

  private handleFormatText(
    socket: CustomSocket,
    payload: { range: SelectionRange; formatting: TextFormatting }
  ): void {
    const user = socket.data.user;
    const roomId = socket.data.roomId;
    
    if (!user || !roomId) return;
    
    // Create and apply format operation
    const formatOp: DocumentOperation = {
      type: 'format',
      position: payload.range.anchor.ch,
      length: Math.abs(payload.range.head.ch - payload.range.anchor.ch),
      version: 0, // Will be set by document service
      clientId: socket.id,
      timestamp: Date.now(),
      userId: user.id,
      formatting: payload.formatting
    };

    // Apply operation locally first
    const result = documentService.applyOperation(roomId, formatOp);
    
    if (result.success) {
      // Broadcast to other users in the room
      socket.to(roomId).emit('format:apply', {
        range: payload.range,
        formatting: payload.formatting,
        userId: user.id
      });
    }
  }

  private handleConnection(socket: CustomSocket): void {
    console.log(`Socket connected: ${socket.id}`);

    // Initialize services
    roomService.initialize(socket);
    documentService.initialize(socket);
    
    // Initialize chat service with default options
    const chatService = new ChatService(this.io, socket, {
      // Override any default options here if needed
    });
    chatService.initialize();
  }

  private handleDisconnect(socket: CustomSocket): void {
    const user = socket.data.user;
    if (!user) return;
    
    const room = roomService.getUserRoom(user.id);
    
    // Clean up room membership
    const result = roomService.leaveRoom(user.id);
    if (result && room) {
      const { roomId, isEmpty } = result;
      
      if (!isEmpty) {
        // Notify about user leaving
        socket.to(roomId).emit('room:left', {
          userId: user.id,
          roomId
        });
        
        // Update presence for remaining users
        const members = roomService.getRoomMembers(roomId);
        socket.to(roomId).emit('presence:update', members);
      }
    }
    
    // Clean up user socket
    roomService.removeUserSocket(user.id);
  }

  // Public API
  private handleLeaveRoom(socket: CustomSocket, payload: { roomId: string }): void {
    const user = socket.data.user;
    if (!user) return;

    const { roomId } = payload;
    const result = roomService.leaveRoom(user.id);
    
    if (result) {
      socket.leave(roomId);
      socket.to(roomId).emit('user:left', { userId: user.id });
      
      // Update presence for remaining users
      const members = roomService.getRoomMembers(roomId);
      socket.to(roomId).emit('presence:update', members);
    }
  }

  private handleDocumentOperation(
    socket: CustomSocket,
    operation: Omit<DocumentOperation, 'clientId' | 'timestamp'>,
    callback: (response: { success: boolean; message?: string }) => void
  ): void {
    const user = socket.data.user;
    const roomId = socket.data.roomId;

    if (!user || !roomId) {
      callback({ success: false, message: 'Not authenticated or not in a room' });
      return;
    }

    try {
      // Create the full operation with clientId and timestamp
      const fullOperation: DocumentOperation = {
        ...operation,
        clientId: socket.id,
        timestamp: Date.now(),
        userId: user.id
      };

      // Apply operation to the document
      const result = documentService.applyOperation(roomId, fullOperation);
      
      if (result.success) {
        // Broadcast to other users in the room
        socket.to(roomId).emit('document:operation', fullOperation);
        callback({ success: true });
      } else {
        callback({ success: false, message: result.error || result.message || 'Failed to apply operation' });
      }
    } catch (error) {
      console.error('Error applying document operation:', error);
      callback({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to apply operation' 
      });
    }
  }

  private handleDocumentJoin(
    socket: CustomSocket,
    documentId: string,
    callback: (response: { success: boolean; content?: string; version?: number }) => void
  ): void {
    const user = socket.data.user;
    if (!user) {
      callback({ success: false });
      return;
    }

    try {
      // Create document if it doesn't exist
      let document = documentService.getDocument(documentId);
      if (!document) {
        documentService.createDocument(documentId, '// Welcome to the collaborative editor!\n');
        document = documentService.getDocument(documentId);
      }

      // Join the document room
      socket.join(`document:${documentId}`);
      socket.data.roomId = documentId;

      console.log(`User ${user.id} joined document: ${documentId}`);

      // Send document state to the user
      if (document) {
        callback({
          success: true,
          content: document.content,
          version: document.version
        });

        // Notify other users in the document
        socket.to(`document:${documentId}`).emit('room:joined', {
          room: {
            id: documentId,
            name: `Document ${documentId}`,
            owner: user.id,
            maxMembers: 100,
            createdAt: new Date()
          },
          members: [user]
        });
      } else {
        callback({ success: false });
      }
    } catch (error) {
      console.error('Error joining document:', error);
      callback({ success: false });
    }
  }

  private handleDocumentLeave(
    socket: CustomSocket,
    documentId: string,
    callback: (response: { success: boolean }) => void
  ): void {
    const user = socket.data.user;
    if (!user) {
      callback({ success: false });
      return;
    }

    try {
      socket.leave(`document:${documentId}`);
      
      // Notify other users
      socket.to(`document:${documentId}`).emit('room:left', {
        userId: user.id,
        roomId: documentId
      });

      console.log(`User ${user.id} left document: ${documentId}`);
      callback({ success: true });
    } catch (error) {
      console.error('Error leaving document:', error);
      callback({ success: false });
    }
  }

  private handleDocumentSync(socket: CustomSocket, payload: { version: number }): void {
    const user = socket.data.user;
    const roomId = socket.data.roomId;

    if (!user || !roomId) {
      return;
    }

    try {
      const document = documentService.getDocument(roomId);
      if (document) {
        socket.emit('document:state', {
          content: document.content,
          version: document.version,
          members: roomService.getRoomMembers(roomId)
        });
      }
    } catch (error) {
      console.error('Error syncing document:', error);
    }
  }

  public getIO(): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
    return this.io;
  }

  public async close(): Promise<void> {
    if (this.redisAdapter) {
      await this.redisAdapter.close();
    }
    this.io.close();
  }
}
