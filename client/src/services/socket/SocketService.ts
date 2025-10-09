import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { Operation } from 'ot-engine-common';
import type {
  SocketConfig,
  SocketEvent,
  SocketEventMap,
  SocketService,
  OperationQueueItem,
  SocketState
} from './types';

const DEFAULT_CONFIG: Partial<SocketConfig> = {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
};

export class SocketServiceImpl extends EventEmitter implements SocketService {
  private socket: Socket | null = null;
  private config: SocketConfig;
  private operationQueue: OperationQueueItem[] = [];
  private isProcessingQueue = false;
  private eventHandlers = new Map<string, Set<Function>>();
  private connectionPromise: Promise<void> | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPingTime = 0;

  public state: SocketState = {
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    reconnectAttempts: 0,
    latency: 0,
    error: null,
  };

  constructor(config: SocketConfig) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config } as SocketConfig;
    if (this.config.autoConnect) this.connect();
  }

  public connect(): Promise<void> {
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = new Promise((resolve, reject) => {
      if (this.socket?.connected) return resolve();

      this.updateState({
        isConnecting: true,
        isReconnecting: this.state.reconnectAttempts > 0,
      });

      try {
        this.socket = io(this.config.url, {
          reconnection: this.config.reconnection,
          reconnectionAttempts: this.config.reconnectionAttempts,
          reconnectionDelay: this.config.reconnectionDelay,
          reconnectionDelayMax: this.config.reconnectionDelayMax,
          timeout: this.config.timeout,
          auth: this.config.auth,
          transports: ['websocket'],
        });

        this.setupEventListeners();
        this.setupConnectionHandlers(resolve, reject);
      } catch (error) {
        this.handleConnectionError(error as Error);
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private setupConnectionHandlers(resolve: () => void, reject: (error: Error) => void) {
    if (!this.socket) return;

    const onConnect = () => {
      this.socket?.off('connect', onConnect);
      this.socket?.off('connect_error', onError);
      this.setupPingPong();
      this.updateState({
        isConnected: true,
        isConnecting: false,
        isReconnecting: false,
        reconnectAttempts: 0,
        error: null,
      });
      this.processOperationQueue();
      resolve();
    };

    const onError = (error: Error) => {
      this.socket?.off('connect', onConnect);
      this.socket?.off('connect_error', onError);
      this.handleConnectionError(error);
      reject(error);
    };

    this.socket.on('connect', onConnect);
    this.socket.on('connect_error', onError);
  }

  private handleConnectionError(error: Error) {
    this.updateState({
      isConnecting: false,
      isReconnecting: false,
      error,
    });
  }

  private setupPingPong() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    
    this.pingInterval = setInterval(() => {
      if (!this.socket?.connected) return;
      
      this.lastPingTime = Date.now();
      this.socket.emit('ping', () => {
        const latency = Date.now() - this.lastPingTime;
        this.updateState({ latency });
      });
    }, 30000);
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason: string) => {
      this.updateState({ isConnected: false });
      this.emitEvent(SocketEvent.DISCONNECT, reason);
    });

    this.socket.on('reconnect', (attempt: number) => {
      this.updateState({ isReconnecting: false, reconnectAttempts: 0 });
      this.emitEvent(SocketEvent.RECONNECT, attempt);
    });

    this.socket.on('reconnect_attempt', (attempt: number) => {
      this.updateState({
        isReconnecting: true,
        reconnectAttempts: attempt,
      });
      this.emitEvent(SocketEvent.RECONNECT_ATTEMPT, attempt);
    });

    this.socket.on('reconnect_error', (error: Error) => {
      this.emitEvent(SocketEvent.RECONNECT_ERROR, error);
    });

    this.socket.on('reconnect_failed', () => {
      this.updateState({ isReconnecting: false });
      this.emitEvent(SocketEvent.RECONNECT_FAILED);
    });

    // Forward all custom events
    Object.values(SocketEvent).forEach((event) => {
      if (typeof event === 'string' && !this.socket?.hasListeners(event)) {
        this.socket?.on(event, (data: any) => {
          this.emitEvent(event, data);
        });
      }
    });
  }

  private emitEvent<T extends SocketEvent>(event: T, data: SocketEventMap[T]) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  public disconnect(): void {
    this.cleanup();
    this.socket?.disconnect();
    this.updateState({
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      reconnectAttempts: 0,
    });
  }

  private cleanup() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.operationQueue = [];
    this.isProcessingQueue = false;
    this.connectionPromise = null;
  }

  public reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.connect();
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Room methods
  public joinRoom(roomId: string, userId: string, username: string): void {
    this.emitWithAck(SocketEvent.ROOM_JOIN, { roomId, userId, username })
      .catch(error => this.handleError(SocketEvent.ROOM_JOIN, error));
  }

  public leaveRoom(roomId: string, userId: string): void {
    this.emitWithAck(SocketEvent.ROOM_LEAVE, { roomId, userId })
      .catch(error => this.handleError(SocketEvent.ROOM_LEAVE, error));
  }

  // Document methods
  public sendOperation(operation: Operation): void {
    if (this.state.isConnected) {
      this.socket?.emit(SocketEvent.DOCUMENT_CHANGE, operation);
    } else {
      this.queueOperation(operation);
    }
  }

  public requestDocumentSync(version: number): void {
    this.emitWithAck(SocketEvent.DOCUMENT_SYNC, { version })
      .catch(error => this.handleError(SocketEvent.DOCUMENT_SYNC, error));
  }

  // Cursor methods
  public sendCursorUpdate(cursor: any): void {
    if (this.state.isConnected) {
      this.socket?.emit(SocketEvent.CURSOR_UPDATE, cursor);
    }
  }

  // Chat methods
  public sendMessage(message: string): void {
    this.emitWithAck(SocketEvent.CHAT_MESSAGE, { message })
      .catch(error => this.handleError(SocketEvent.CHAT_MESSAGE, error));
  }

  // Event management
  public on<T extends SocketEvent>(
    event: T,
    callback: (data: SocketEventMap[T]) => void
  ): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    const handlers = this.eventHandlers.get(event)!;
    handlers.add(callback);

    return () => {
      handlers.delete(callback);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    };
  }

  public off<T extends SocketEvent>(
    event: T,
    callback: (data: SocketEventMap[T]) => void
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(callback);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  public once<T extends SocketEvent>(
    event: T,
    callback: (data: SocketEventMap[T]) => void
  ): () => void {
    const onceHandler = (data: SocketEventMap[T]) => {
      this.off(event, onceHandler as any);
      callback(data);
    };
    return this.on(event, onceHandler);
  }

  // Private methods
  private emitWithAck<T>(event: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Socket event ${event} timed out`));
      }, this.config.timeout);

      this.socket.emit(event, data, (response: { error?: string; data?: T }) => {
        clearTimeout(timeout);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data as T);
        }
      });
    });
  }

  private queueOperation(operation: Operation): Promise<void> {
    return new Promise((resolve, reject) => {
      const item: OperationQueueItem = {
        operation,
        retries: 0,
        timestamp: Date.now(),
        resolve,
        reject,
      };
      this.operationQueue.push(item);
      this.processOperationQueue();
    });
  }

  private async processOperationQueue() {
    if (this.isProcessingQueue || !this.state.isConnected || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const item = this.operationQueue.shift();
    
    if (!item) {
      this.isProcessingQueue = false;
      return;
    }

    try {
      await this.emitWithAck(SocketEvent.DOCUMENT_CHANGE, item.operation);
      item.resolve();
    } catch (error) {
      item.retries++;
      if (item.retries >= 3) {
        item.reject(new Error('Max retries exceeded'));
      } else {
        // Re-queue with exponential backoff
        const backoff = Math.min(1000 * Math.pow(2, item.retries), 30000);
        setTimeout(() => {
          this.operationQueue.unshift(item);
          this.processOperationQueue();
        }, backoff);
        return;
      }
    }

    this.isProcessingQueue = false;
    this.processOperationQueue();
  }

  private handleError(event: string, error: Error) {
    console.error(`Socket error in ${event}:`, error);
    this.emitEvent(SocketEvent.ERROR, { message: error.message, code: 'SOCKET_ERROR' });
  }

  private updateState(partialState: Partial<SocketState>) {
    this.state = { ...this.state, ...partialState };
    this.emit('stateChange', this.state);
  }
}

export const createSocketService = (config: SocketConfig): SocketService => {
  return new SocketServiceImpl(config);
};

export default createSocketService;
