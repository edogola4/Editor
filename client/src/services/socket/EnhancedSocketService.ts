import { io, Socket } from 'socket.io-client';
import { throttle, debounce } from 'lodash';
import { EventEmitter } from 'events';
// Import Operation type from the correct path
import { Operation } from '../../shared/ot-types';
import { SocketService, SocketEvent, SocketState, SocketConfig } from './types';

// Constants
const DEFAULT_THROTTLE_INTERVAL = 50; // ms
const DEFAULT_DEBOUNCE_INTERVAL = 100; // ms
const MAX_QUEUE_SIZE = 1000;
const MAX_RETRY_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const PING_INTERVAL = 30000; // 30 seconds
const PING_TIMEOUT = 10000; // 10 seconds

export class EnhancedSocketService extends EventEmitter implements SocketService {
  private socket: Socket | null = null;
  private operationQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private connectionAttempts = 0;
  private lastReconnectAttempt = 0;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPingTime = 0;
  private pendingAcks = new Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>();
  private config: Required<SocketConfig>;
  private isDisposed = false;

  // Performance-optimized methods
  private throttledCursorUpdate = throttle(
    (cursor: any) => this.emitEvent(SocketEvent.CURSOR_UPDATE, cursor),
    DEFAULT_THROTTLE_INTERVAL,
    { leading: true, trailing: true }
  );

  private debouncedProcessQueue = debounce(
    () => this.processOperationQueue(),
    DEFAULT_DEBOUNCE_INTERVAL,
    { maxWait: 1000 }
  );

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
    this.config = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      ...config,
    } as Required<SocketConfig>;

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  public connect(): Promise<void> {
    if (this.state.isConnected || this.state.isConnecting) {
      return Promise.resolve();
    }

    this.updateState({
      isConnecting: true,
      error: null,
    });

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.config.url, {
          reconnection: this.config.reconnection,
          reconnectionAttempts: this.config.reconnectionAttempts,
          reconnectionDelay: this.config.reconnectionDelay,
          reconnectionDelayMax: this.config.reconnectionDelayMax,
          timeout: this.config.timeout,
          transports: ['websocket'],
        });

        this.setupEventListeners();

        const onConnect = () => {
          this.socket?.off('connect', onConnect);
          this.socket?.off('connect_error', onError);
          this.setupPingPong();
          this.connectionAttempts = 0;
          this.updateState({
            isConnected: true,
            isConnecting: false,
            isReconnecting: false,
            reconnectAttempts: 0,
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
      } catch (error) {
        this.handleConnectionError(error as Error);
        reject(error);
      }
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason: string) => {
      this.updateState({ isConnected: false });
      this.emitEvent(SocketEvent.DISCONNECT, reason);
    });

    this.socket.on('reconnect', (attempt: number) => {
      this.updateState({ isReconnecting: false, reconnectAttempts: 0 });
      this.emitEvent(SocketEvent.RECONNECT, attempt);
    });

    this.socket.on('reconnect_attempt', (attempt: number) => {
      this.updateState({ isReconnecting: true, reconnectAttempts: attempt });
      this.emitEvent(SocketEvent.RECONNECT_ATTEMPT, attempt);
    });

    this.socket.on('reconnect_error', (error: Error) => {
      this.emitEvent(SocketEvent.RECONNECT_ERROR, error);
    });

    this.socket.on('reconnect_failed', () => {
      this.updateState({ isReconnecting: false });
      this.emitEvent(SocketEvent.RECONNECT_FAILED);
    });

    // Custom events
    Object.values(SocketEvent).forEach((event) => {
      if (typeof event === 'string' && !this.socket?.hasListeners(event)) {
        this.socket?.on(event, (data: any) => {
          this.emitEvent(event, data);
        });
      }
    });

    // Handle ping/pong
    this.socket.on('pong', (latency: number) => {
      this.updateState({ latency });
    });
  }

  private setupPingPong() {
    if (this.pingInterval) clearInterval(this.pingInterval);

    this.pingInterval = setInterval(() => {
      if (!this.socket?.connected) return;

      this.lastPingTime = Date.now();
      const pingTimeout = setTimeout(() => {
        this.handleConnectionError(new Error('Ping timeout'));
      }, PING_TIMEOUT);

      this.socket.emit('ping', () => {
        clearTimeout(pingTimeout);
        const latency = Date.now() - this.lastPingTime;
        this.updateState({ latency });
      });
    }, PING_INTERVAL);
  }

  private handleConnectionError(error: Error) {
    this.connectionAttempts++;
    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, this.connectionAttempts - 1),
      MAX_RECONNECT_DELAY
    );

    this.updateState({
      isConnecting: false,
      isReconnecting: true,
      reconnectAttempts: this.connectionAttempts,
      error,
    });

    if (this.connectionAttempts <= MAX_RETRY_ATTEMPTS) {
      setTimeout(() => {
        if (!this.isDisposed) {
          this.reconnect();
        }
      }, delay);
    } else {
      this.emitEvent(SocketEvent.ERROR, {
        message: 'Max reconnection attempts reached',
        code: 'MAX_RECONNECT_ATTEMPTS',
      });
    }
  }

  private emitEvent<T extends SocketEvent>(event: T, data: any) {
    this.emit(event, data);
  }

  private updateState(partialState: Partial<SocketState>) {
    this.state = { ...this.state, ...partialState };
    this.emit('stateChange', this.state);
  }

  private async processOperationQueue() {
    if (this.isProcessingQueue || !this.state.isConnected || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Process operations in batches
      const batchSize = Math.min(50, this.operationQueue.length);
      const batch = this.operationQueue.splice(0, batchSize);

      await Promise.all(batch.map(operation => operation()));

      // Process next batch if there are more operations
      if (this.operationQueue.length > 0) {
        this.debouncedProcessQueue();
      }
    } catch (error) {
      console.error('Error processing operation queue:', error);
      // Retry failed operations with backoff
      setTimeout(() => this.processOperationQueue(), 1000);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Public API
  public disconnect(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.socket) {
      this.socket.disconnect();
    }
    this.updateState({
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
    });
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
      this.throttledCursorUpdate(cursor);
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
    callback: (data: any) => void
  ): () => void {
    super.on(event, callback);
    return () => this.off(event, callback);
  }

  public off<T extends SocketEvent>(
    event: T,
    callback: (data: any) => void
  ): void {
    super.off(event, callback);
  }

  public once<T extends SocketEvent>(
    event: T,
    callback: (data: any) => void
  ): () => void {
    const onceHandler = (data: any) => {
      this.off(event, onceHandler);
      callback(data);
    };
    return this.on(event, onceHandler);
  }

  // Utility methods
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

  private queueOperation(operation: any): Promise<void> {
    if (this.operationQueue.length >= MAX_QUEUE_SIZE) {
      return Promise.reject(new Error('Operation queue is full'));
    }

    return new Promise((resolve, reject) => {
      this.operationQueue.push(async () => {
        try {
          await this.emitWithAck(SocketEvent.DOCUMENT_CHANGE, operation);
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      if (this.state.isConnected) {
        this.debouncedProcessQueue();
      }
    });
  }

  private handleError(event: string, error: Error) {
    console.error(`Error in ${event}:`, error);
    this.emitEvent(SocketEvent.ERROR, { message: error.message, code: 'SOCKET_ERROR' });
  }

  public dispose() {
    this.isDisposed = true;
    this.disconnect();
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.debouncedProcessQueue.cancel) this.debouncedProcessQueue.cancel();
    if (this.throttledCursorUpdate.cancel) this.throttledCursorUpdate.cancel();
    this.removeAllListeners();
  }
}

export const createEnhancedSocketService = (config: SocketConfig): SocketService => {
  return new EnhancedSocketService(config);
};

export default createEnhancedSocketService;
