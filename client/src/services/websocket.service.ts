import { v4 as uuidv4 } from 'uuid';
import { authService } from './auth.service';

interface WebSocketMessage {
  type: string;
  data: any;
  userId?: string;
  documentId?: string;
  timestamp: number;
  error?: string;
}

type MessageHandler = (data: any) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private documentId: string | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number = 1000;
  private isConnected = false;
  private pendingMessages: WebSocketMessage[] = [];
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPingTime: number = 0;
  private connectionPromise: Promise<void> | null = null;
  private resolveConnection: (() => void) | null = null;
  private rejectConnection: ((error: Error) => void) | null = null;

  constructor() {
    // Set up auth state change listener
    authService.onAuthStateChanged((user) => {
      if (user) {
        // Reconnect if we have a documentId and the connection is not active
        if (this.documentId && !this.isConnected) {
          this.connect(this.documentId);
        }
      } else {
        // Disconnect if user logs out
        this.disconnect();
      }
    });
  }

  public async connect(documentId: string): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;
    });

    this.documentId = documentId;
    this.reconnectAttempts = 0;

    const token = authService.getAccessToken();
    if (!token) {
      this.handleConnectionError(new Error('No authentication token available'));
      return this.connectionPromise;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.REACT_APP_WS_URL || window.location.host;
      const wsUrl = `${protocol}//${host}/ws/${documentId}?token=${encodeURIComponent(token)}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => this.handleOpen();
      this.ws.onclose = (event) => this.handleClose(event);
      this.ws.onerror = (error) => this.handleError(error);
      this.ws.onmessage = (event) => this.handleMessage(event);
      
    } catch (error) {
      this.handleConnectionError(error as Error);
    }

    return this.connectionPromise;
  }

  private handleOpen() {
    console.log('WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.startPingInterval();
    this.flushPendingMessages();
    
    if (this.resolveConnection) {
      this.resolveConnection();
      this.cleanupConnectionPromise();
    }

    this.emit('connected', { documentId: this.documentId });
  }

  private handleClose(event: CloseEvent) {
    console.log('WebSocket disconnected:', event.reason);
    this.isConnected = false;
    this.stopPingInterval();
    this.cleanup();

    // Only attempt to reconnect if this was an unexpected disconnection
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('disconnected', { reason: 'max_reconnect_attempts' });
    } else {
      this.emit('disconnected', { reason: 'user_disconnect' });
    }

    if (this.rejectConnection) {
      this.rejectConnection(new Error(`WebSocket connection closed: ${event.reason || 'Unknown reason'}`));
      this.cleanupConnectionPromise();
    }
  }

  private handleError(error: Event) {
    console.error('WebSocket error:', error);
    this.emit('error', { error });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.documentId) {
      console.error('Max reconnection attempts reached or no document ID');
      this.emit('connection-lost', { reason: 'max_attempts' });
      return;
    }

    this.reconnectAttempts++;
    const timeout = Math.min(
      this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );
    
    console.log(`Attempting to reconnect in ${timeout}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.documentId) {
        this.reconnect().catch(console.error);
      }
    }, timeout);
  }

  private reconnect(): Promise<void> {
    this.cleanup();
    if (this.documentId) {
      return this.connect(this.documentId);
    }
    return Promise.reject(new Error('No document ID available for reconnection'));
  }

  private cleanup() {
    this.stopPingInterval();
    
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client closed connection');
      }
      
      this.ws = null;
    }
  }

  public disconnect() {
    this.cleanup();
    this.documentId = null;
    this.isConnected = false;
    this.cleanupConnectionPromise();
  }

  private startPingInterval() {
    this.lastPingTime = Date.now();
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        // Check if we've missed too many pings
        if (Date.now() - this.lastPingTime > 30000) { // 30 seconds without a pong
          console.warn('No pong received, reconnecting...');
          this.reconnect();
          return;
        }
        
        // Send a ping
        this.sendMessage('ping', {});
      }
    }, 10000); // Send a ping every 10 seconds
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleConnectionError(error: Error) {
    console.error('WebSocket connection error:', error);
    
    if (this.rejectConnection) {
      this.rejectConnection(error);
      this.cleanupConnectionPromise();
    }
    
    this.emit('error', { error: error.message });
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    }
  }

  private cleanupConnectionPromise() {
    this.connectionPromise = null;
    this.resolveConnection = null;
    this.rejectConnection = null;
  }

  private flushPendingMessages() {
    if (!this.isConnected || !this.ws) return;
    
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      if (message) {
        this.sendMessage(message.type, message.data);
      }
    }
  }

  public sendMessage(type: string, data: any = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Queue the message if we're not connected
      this.pendingMessages.push({
        type,
        data,
        userId: authService.user?.id,
        documentId: this.documentId || undefined,
        timestamp: Date.now(),
      });
      return;
    }

    try {
      const message: WebSocketMessage = {
        type,
        data,
        userId: authService.user?.id,
        documentId: this.documentId || undefined,
        timestamp: Date.now(),
      };
      
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      this.emit('error', { error: 'Failed to send message', type });
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle ping-pong for connection health
      if (message.type === 'pong') {
        this.lastPingTime = Date.now();
        return;
      }
      
      // Emit the message to all handlers
      this.emit(message.type, message.data);
      
      // Special handling for error messages
      if (message.error) {
        console.error('WebSocket error:', message.error);
        this.emit('error', { error: message.error });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.emit('error', { error: 'Invalid message format' });
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      // Create a copy of the handlers set to avoid issues if handlers are removed during iteration
      const handlersCopy = new Set(handlers);
      handlersCopy.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  public on(event: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());
    }
    
    const handlers = this.messageHandlers.get(event)!;
    handlers.add(handler);
    
    // Return a function to remove the handler
    return () => this.off(event, handler);
  }

  public off(event: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      
      if (handlers.size === 0) {
        this.messageHandlers.delete(event);
      }
    }
  }

  // Public API for common operations
  public sendContentUpdate(content: string) {
    this.sendMessage('content-update', { content });
  }

  public sendCursorMove(position: { lineNumber: number; column: number }) {
    this.sendMessage('cursor-move', { position });
  }

  public sendSelectionChange(selection: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  }) {
    this.sendMessage('selection-change', { selection });
  }

  public sendLanguageChange(language: string) {
    this.sendMessage('language-change', { language });
  }

  // Event subscription helpers
  public onContentChange(handler: (content: string) => void): () => void {
    return this.on('content-update', (data) => {
      if (data.userId !== authService.user?.id) {
        handler(data.content);
      }
    });
  }

  public onCursorMoved(handler: (userId: string, position: any) => void): () => void {
    return this.on('cursor-move', (data) => {
      if (data.userId !== authService.user?.id) {
        handler(data.userId, data.position);
      }
    });
  }

  public onSelectionChanged(handler: (userId: string, selection: any) => void): () => void {
    return this.on('selection-change', (data) => {
      if (data.userId !== authService.user?.id) {
        handler(data.userId, data.selection);
      }
    });
  }

  public onLanguageChanged(handler: (language: string) => void): () => void {
    return this.on('language-change', (data) => {
      if (data.userId !== authService.user?.id) {
        handler(data.language);
      }
    });
  }

  public onUserJoined(handler: (user: any) => void): () => void {
    return this.on('user-joined', (data) => {
      if (data.userId !== authService.user?.id) {
        handler(data.user);
      }
    });
  }

  public onUserLeft(handler: (userId: string) => void): () => void {
    return this.on('user-left', (data) => {
      if (data.userId !== authService.user?.id) {
        handler(data.userId);
      }
    });
  }

  public onConnected(handler: () => void): () => void {
    return this.on('connected', handler);
  }

  public onDisconnected(handler: () => void): () => void {
    return this.on('disconnected', handler);
  }

  public onError(handler: (error: any) => void): () => void {
    return this.on('error', handler);
  }

  public get connectionState() {
    return this.ws?.readyState;
  }

  public get isConnectedState() {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  public get currentDocumentId() {
    return this.documentId;
  }
}

// Export a singleton instance
export const webSocketService = new WebSocketService();
