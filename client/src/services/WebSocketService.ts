import { io, Socket } from 'socket.io-client';
import { Operation } from 'ot-types';

export interface CursorPosition {
  row: number;
  column: number;
}

export interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
  isBackward?: boolean;
}

type DocumentStateHandler = (content: string, version: number) => void;
type OperationHandler = (operation: Operation, version: number, userId: string) => void;
type CursorHandler = (userId: string, cursor: CursorPosition | null, selection: SelectionRange | null) => void;
type UserJoinedHandler = (userId: string, username: string, color: string) => void;
type UserLeftHandler = (userId: string) => void;
type ErrorHandler = (error: string) => void;

export class WebSocketService {
  private socket: Socket | null = null;
  private documentStateHandlers: DocumentStateHandler[] = [];
  private operationHandlers: OperationHandler[] = [];
  private cursorHandlers: CursorHandler[] = [];
  private userJoinedHandlers: UserJoinedHandler[] = [];
  private userLeftHandlers: UserLeftHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private documentId: string | null = null;
  private isConnected = false;

  constructor() {
    this.connect = this.connect.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  public connect(url: string, token: string, documentId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        return resolve();
      }

      this.userId = userId;
      this.documentId = documentId;

      // Disconnect existing socket if any
      this.disconnect();

      // Create new socket connection
      this.socket = io(url, {
        auth: { token },
        query: { documentId },
        reconnection: false, // We'll handle reconnection manually
        autoConnect: true,
        transports: ['websocket', 'polling'],
      });

      // Set up event handlers
      this.setupEventHandlers();

      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          this.handleError('Connection timeout');
          reject(new Error('Connection timeout'));
        }
      }, 10000); // 10 seconds timeout

      // Handle successful connection
      const onConnect = () => {
        clearTimeout(connectionTimeout);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('Connected to WebSocket server');
        resolve();
      };

      this.socket.on('connect', onConnect);
      this.socket.on('connect_error', (error) => {
        clearTimeout(connectionTimeout);
        this.handleError(`Connection error: ${error.message}`);
        reject(error);
      });
    });
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', this.handleDisconnect);
    this.socket.on('error', this.handleError);

    // Document state
    this.socket.on('document:state', (data: { content: string; version: number }) => {
      this.documentStateHandlers.forEach(handler => handler(data.content, data.version));
    });

    // Operations
    this.socket.on('operation', (data: { operation: Operation; version: number; userId: string }) => {
      this.operationHandlers.forEach(handler => 
        handler(data.operation, data.version, data.userId)
      );
    });

    // Cursor updates
    this.socket.on('cursor:update', (data: { 
      userId: string; 
      cursor: CursorPosition | null; 
      selection: SelectionRange | null 
    }) => {
      this.cursorHandlers.forEach(handler => 
        handler(data.userId, data.cursor, data.selection)
      );
    });

    // User joined
    this.socket.on('user:joined', (data: { userId: string; username: string; color: string }) => {
      this.userJoinedHandlers.forEach(handler => 
        handler(data.userId, data.username, data.color)
      );
    });

    // User left
    this.socket.on('user:left', (data: { userId: string }) => {
      this.userLeftHandlers.forEach(handler => handler(data.userId));
    });

    // Error handling
    this.socket.on('error', (error: { message: string }) => {
      this.handleError(error.message);
    });
  }

  private handleDisconnect(): void {
    this.isConnected = false;
    console.log('Disconnected from WebSocket server');
    this.attemptReconnect();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect();
      }
    }, delay);
  }

  private handleError(error: string): void {
    console.error('WebSocket error:', error);
    this.errorHandlers.forEach(handler => handler(error));
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.off('disconnect', this.handleDisconnect);
      this.socket.off('error', this.handleError);
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Operation methods
  public sendOperation(operation: Operation, version: number): void {
    if (this.socket?.connected) {
      this.socket.emit('operation', { 
        documentId: this.documentId,
        operation,
        version 
      });
    }
  }

  public updateCursor(cursor: CursorPosition | null, selection: SelectionRange | null): void {
    if (this.socket?.connected) {
      this.socket.emit('cursor:update', { 
        documentId: this.documentId,
        cursor,
        selection 
      });
    }
  }

  public setLanguage(language: string): void {
    if (this.socket?.connected) {
      this.socket.emit('document:language', { 
        documentId: this.documentId,
        language
      });
    }
  }

  public setTheme(theme: string): void {
    if (this.socket?.connected) {
      this.socket.emit('document:theme', { 
        documentId: this.documentId,
        theme
      });
    }
  }

  // Event subscription methods
  public onDocumentState(handler: DocumentStateHandler): () => void {
    this.documentStateHandlers.push(handler);
    return () => {
      this.documentStateHandlers = this.documentStateHandlers.filter(h => h !== handler);
    };
  }

  public onOperation(handler: OperationHandler): () => void {
    this.operationHandlers.push(handler);
    return () => {
      this.operationHandlers = this.operationHandlers.filter(h => h !== handler);
    };
  }

  public onCursorUpdate(handler: CursorHandler): () => void {
    this.cursorHandlers.push(handler);
    return () => {
      this.cursorHandlers = this.cursorHandlers.filter(h => h !== handler);
    };
  }

  public onUserJoined(handler: UserJoinedHandler): () => void {
    this.userJoinedHandlers.push(handler);
    return () => {
      this.userJoinedHandlers = this.userJoinedHandlers.filter(h => h !== handler);
    };
  }

  public onUserLeft(handler: UserLeftHandler): () => void {
    this.userLeftHandlers.push(handler);
    return () => {
      this.userLeftHandlers = this.userLeftHandlers.filter(h => h !== handler);
    };
  }

  public onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
    };
  }

  public get isConnectedStatus(): boolean {
    return this.isConnected;
  }

  public get currentUserId(): string | null {
    return this.userId;
  }

  public get currentDocumentId(): string | null {
    return this.documentId;
  }
}

export const webSocketService = new WebSocketService();
