import { Server as SocketIO, Socket } from 'socket.io';
import { RedisClient } from 'redis';
import { EditorService } from '../editor/EditorService';
import { 
  Operation, 
  CursorPosition, 
  EditorEvent, 
  OperationEvent, 
  CursorEvent, 
  SelectionEvent,
  PresenceEvent,
  SyncEvent,
  DocumentState
} from '../../types/editor.types';

export class EditorSocketService {
  private io: SocketIO;
  private editorService: EditorService;
  private redis: RedisClient;
  private docRooms: Map<string, Set<string>> = new Map();
  private userRooms: Map<string, Set<string>> = new Map();

  constructor(io: SocketIO, redis: RedisClient) {
    this.io = io;
    this.redis = redis;
    this.editorService = new EditorService({ redis });
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`User connected: ${socket.id}`);

      // Join a document room
      socket.on('joinDocument', async (data: { docId: string; userId: string }) => {
        const { docId, userId } = data;
        await this.handleJoinDocument(socket, docId, userId);
      });

      // Handle editor operations
      socket.on('operation', async (data: { docId: string; operations: Operation[] }) => {
        const { docId, operations } = data;
        await this.handleOperation(socket, docId, operations);
      });

      // Handle cursor movement
      socket.on('cursor', (data: { docId: string; position: CursorPosition }) => {
        const { docId, position } = data;
        this.handleCursor(socket, docId, position);
      });

      // Handle selection changes
      socket.on('selection', (data: { docId: string; selection: any }) => {
        const { docId, selection } = data;
        this.handleSelection(socket, docId, selection);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleJoinDocument(socket: Socket, docId: string, userId: string): Promise<void> {
    try {
      // Join the document room
      await socket.join(docId);
      
      // Track user's rooms
      if (!this.userRooms.has(socket.id)) {
        this.userRooms.set(socket.id, new Set());
      }
      this.userRooms.get(socket.id)?.add(docId);

      // Track document's users
      if (!this.docRooms.has(docId)) {
        this.docRooms.set(docId, new Set());
      }
      this.docRooms.get(docId)?.add(socket.id);

      // Get current document state
      const docState = await this.editorService.getDocumentState(docId);
      if (!docState) {
        // Initialize new document if it doesn't exist
        const initialState: DocumentState = {
          content: '',
          version: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: userId,
          language: 'plaintext',
          theme: 'default',
          users: {}
        };
        await this.editorService.updateDocumentState(docId, []);
      }

      // Send current document state to the user
      const currentState = await this.editorService.getDocumentState(docId);
      socket.emit('sync', {
        type: 'sync',
        payload: {
          version: currentState?.version || 0,
          state: currentState?.content || '',
          operations: []
        },
        timestamp: Date.now()
      } as SyncEvent);

      // Notify other users in the room
      this.broadcastToRoom(docId, 'presence', {
        type: 'presence',
        payload: {
          users: this.getRoomUsers(docId)
        },
        timestamp: Date.now()
      } as PresenceEvent, socket.id);

    } catch (error) {
      console.error('Error joining document:', error);
      socket.emit('error', {
        type: 'error',
        payload: {
          code: 'JOIN_ERROR',
          message: 'Failed to join document',
          details: error
        },
        timestamp: Date.now()
      });
    }
  }

  private async handleOperation(socket: Socket, docId: string, operations: Operation[]): Promise<void> {
    try {
      // Queue operations for batching
      for (const op of operations) {
        this.editorService.queueOperation(docId, {
          ...op,
          timestamp: Date.now()
        });
      }

      // Broadcast operations to other users in the room
      this.broadcastToRoom(docId, 'operation', {
        type: 'operation',
        payload: {
          operations,
          version: 0, // Will be set by the editor service
          source: socket.id
        },
        timestamp: Date.now()
      } as OperationEvent, socket.id);

    } catch (error) {
      console.error('Error handling operation:', error);
      socket.emit('error', {
        type: 'error',
        payload: {
          code: 'OPERATION_ERROR',
          message: 'Failed to process operation',
          details: error
        },
        timestamp: Date.now()
      });
    }
  }

  private handleCursor(socket: Socket, docId: string, position: CursorPosition): void {
    try {
      const userId = this.getUserIdFromSocket(socket);
      if (!userId) return;

      // Update cursor position in the editor service
      this.editorService.updateCursorPosition(userId, docId, position);

      // Broadcast cursor position to other users in the room
      this.broadcastToRoom(docId, 'cursor', {
        type: 'cursor',
        payload: {
          userId,
          position,
          color: this.editorService.getUserColor(userId)
        },
        timestamp: Date.now()
      } as CursorEvent, socket.id);
    } catch (error) {
      console.error('Error handling cursor:', error);
    }
  }

  private handleSelection(socket: Socket, docId: string, selection: any): void {
    try {
      const userId = this.getUserIdFromSocket(socket);
      if (!userId) return;

      // Update selection in the editor service
      this.editorService.updateUserSelection(userId, docId, selection);

      // Broadcast selection to other users in the room
      this.broadcastToRoom(docId, 'selection', {
        type: 'selection',
        payload: {
          userId,
          selection,
          color: this.editorService.getUserColor(userId)
        },
        timestamp: Date.now()
      } as SelectionEvent, socket.id);
    } catch (error) {
      console.error('Error handling selection:', error);
    }
  }

  private handleDisconnect(socket: Socket): void {
    try {
      const userRooms = this.userRooms.get(socket.id) || new Set();
      
      // Notify all rooms that the user was in
      for (const docId of userRooms) {
        this.broadcastToRoom(docId, 'userLeft', {
          type: 'presence',
          payload: {
            userId: this.getUserIdFromSocket(socket),
            status: 'offline'
          },
          timestamp: Date.now()
        });

        // Clean up room tracking
        const docRoom = this.docRooms.get(docId);
        if (docRoom) {
          docRoom.delete(socket.id);
          if (docRoom.size === 0) {
            this.docRooms.delete(docId);
          }
        }
      }

      // Clean up user tracking
      this.userRooms.delete(socket.id);
      
      console.log(`User disconnected: ${socket.id}`);
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  }

  private broadcastToRoom(roomId: string, event: string, data: any, excludeSocketId?: string): void {
    if (excludeSocketId) {
      socket.to(roomId).emit(event, data);
    } else {
      this.io.to(roomId).emit(event, data);
    }
  }

  private getRoomUsers(roomId: string): Record<string, any> {
    const users: Record<string, any> = {};
    const room = this.io.sockets.adapter.rooms.get(roomId);
    
    if (room) {
      for (const socketId of room) {
        const userId = this.getUserIdFromSocket(this.io.sockets.sockets.get(socketId)!);
        if (userId) {
          users[userId] = {
            userId,
            color: this.editorService.getUserColor(userId),
            lastActive: Date.now()
          };
        }
      }
    }
    
    return users;
  }

  private getUserIdFromSocket(socket: Socket): string | null {
    // Extract user ID from socket handshake or auth token
    return socket.handshake.auth.userId || socket.id;
  }
}
