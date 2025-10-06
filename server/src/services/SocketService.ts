import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { EditorService, DocumentState, Operation, CursorPosition, SelectionRange } from './EditorService';

export interface SocketData {
  userId: string;
  username: string;
  documentId: string;
}

export class SocketService {
  private io: Server;
  private editorService: EditorService;
  private redis: Redis;
  private connectedSockets: Map<string, SocketData> = new Map();
  private documentRooms: Map<string, Set<string>> = new Map();

  constructor(server: HttpServer, redis: Redis) {
    this.redis = redis;
    this.editorService = new EditorService(redis);
    
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 10000,
      pingInterval: 5000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`New connection: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', async ({ token, documentId }: { token: string; documentId: string }, callback) => {
        try {
          // In a real app, verify the JWT token and get user info
          const userData = await this.authenticateUser(token);
          
          if (!userData) {
            throw new Error('Authentication failed');
          }

          const socketData: SocketData = {
            userId: userData.id,
            username: userData.username,
            documentId,
          };

          this.connectedSockets.set(socket.id, socketData);
          
          // Join the document room
          await socket.join(documentId);
          
          // Track document rooms for cleanup
          if (!this.documentRooms.has(documentId)) {
            this.documentRooms.set(documentId, new Set());
          }
          this.documentRooms.get(documentId)?.add(socket.id);

          // Send initial document state
          const documentState = await this.editorService.getDocumentState(documentId);
          if (!documentState) {
            await this.editorService.initializeDocument(documentId);
          }
          
          // Send the current document state to the newly connected client
          socket.emit('document:state', documentState || await this.editorService.getDocumentState(documentId));
          
          // Notify other users in the room about the new user
          socket.to(documentId).emit('user:joined', {
            userId: userData.id,
            username: userData.username,
            color: this.editorService.getUserColor(userData.id),
          });

          callback({ success: true });
        } catch (error) {
          console.error('Authentication error:', error);
          callback({ success: false, error: 'Authentication failed' });
          socket.disconnect();
        }
      });

      // Handle document operations
      socket.on('operation', async (data: {
        documentId: string;
        operation: Operation;
        version: number;
        cursor?: CursorPosition | null;
        selection?: SelectionRange | null;
      }) => {
        const socketData = this.connectedSockets.get(socket.id);
        if (!socketData) return;

        try {
          const { documentId, operation, version, cursor, selection } = data;
          
          // Update user's cursor and selection (debounced)
          await this.editorService.debouncedUpdateUserState(
            documentId,
            socketData.userId,
            socketData.username,
            cursor || null,
            selection || null
          );

          // Apply the operation and get the updated state
          const result = await this.editorService.applyOperation(
            documentId,
            socketData.userId,
            socketData.username,
            operation,
            cursor || null,
            selection || null
          );

          // Broadcast the operation to other clients in the room
          socket.to(documentId).emit('operation', {
            operation,
            version: result.version,
            userId: socketData.userId,
          });

          // Send acknowledgment to the sender
          socket.emit('operation:ack', {
            version: result.version,
          });
        } catch (error) {
          console.error('Operation error:', error);
          socket.emit('error', { message: 'Failed to apply operation' });
        }
      });

      // Handle cursor position updates
      socket.on('cursor:update', async (data: {
        documentId: string;
        cursor: CursorPosition | null;
        selection: SelectionRange | null;
      }) => {
        const socketData = this.connectedSockets.get(socket.id);
        if (!socketData) return;

        try {
          await this.editorService.debouncedUpdateUserState(
            data.documentId,
            socketData.userId,
            socketData.username,
            data.cursor,
            data.selection
          );

          // Broadcast cursor update to other clients in the room
          socket.to(data.documentId).emit('cursor:update', {
            userId: socketData.userId,
            cursor: data.cursor,
            selection: data.selection,
          });
        } catch (error) {
          console.error('Cursor update error:', error);
        }
      });

      // Handle document language change
      socket.on('document:language', async (data: { documentId: string; language: string }) => {
        const socketData = this.connectedSockets.get(socket.id);
        if (!socketData) return;

        try {
          await this.editorService.setLanguage(data.documentId, data.language);
          
          // Broadcast language change to all clients in the room
          this.io.to(data.documentId).emit('document:language', {
            language: data.language,
            updatedBy: socketData.userId,
          });
        } catch (error) {
          console.error('Language update error:', error);
          socket.emit('error', { message: 'Failed to update document language' });
        }
      });

      // Handle theme change
      socket.on('document:theme', async (data: { documentId: string; theme: string }) => {
        const socketData = this.connectedSockets.get(socket.id);
        if (!socketData) return;

        try {
          await this.editorService.setTheme(data.documentId, data.theme);
          
          // Broadcast theme change to all clients in the room
          this.io.to(data.documentId).emit('document:theme', {
            theme: data.theme,
            updatedBy: socketData.userId,
          });
        } catch (error) {
          console.error('Theme update error:', error);
          socket.emit('error', { message: 'Failed to update theme' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const socketData = this.connectedSockets.get(socket.id);
        if (!socketData) return;

        const { userId, username, documentId } = socketData;
        
        // Remove from connected sockets
        this.connectedSockets.delete(socket.id);
        
        // Remove from document room
        const room = this.documentRooms.get(documentId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            this.documentRooms.delete(documentId);
          }
        }

        console.log(`User ${username} (${userId}) disconnected`);
        
        // Notify other users in the room
        socket.to(documentId).emit('user:left', { userId });
      });
    });
  }

  private async authenticateUser(token: string): Promise<{ id: string; username: string }> {
    // In a real app, verify JWT token and get user data from your auth service
    // This is a simplified example
    try {
      // Example: const decoded = verifyToken(token);
      // return { id: decoded.userId, username: decoded.username };
      return { id: 'user-' + Math.random().toString(36).substr(2, 9), username: 'User' };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Get all connected users in a document
  public async getConnectedUsers(documentId: string): Promise<Array<{ userId: string; username: string; color: string }>> {
    const users = [];
    for (const socketData of this.connectedSockets.values()) {
      if (socketData.documentId === documentId) {
        users.push({
          userId: socketData.userId,
          username: socketData.username,
          color: this.editorService.getUserColor(socketData.userId),
        });
      }
    }
    return users;
  }

  // Clean up resources
  public async shutdown(): Promise<void> {
    await this.editorService.disconnect();
    this.io.close();
  }
}
