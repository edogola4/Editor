import { Operation } from '../../shared/ot-types';

/**
 * Configuration options for the Socket.IO client
 * @interface SocketConfig
 * @property {string} url - The WebSocket server URL
 * @property {boolean} [autoConnect=true] - Whether to connect automatically
 * @property {boolean} [reconnection=true] - Whether to automatically reconnect
 * @property {number} [reconnectionAttempts=5] - Maximum number of reconnection attempts
 * @property {number} [reconnectionDelay=1000] - Initial delay before reconnection in ms
 * @property {number} [reconnectionDelayMax=5000] - Maximum delay between reconnections
 * @property {number} [timeout=20000] - Connection timeout in ms
 * @property {Record<string, any>} [auth] - Authentication data
 */
export interface SocketConfig {
  url: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
  auth?: Record<string, any>;
}

/**
 * Socket.IO event types for the collaborative editor
 * @enum {string}
 * @readonly
 */
export enum SocketEvent {
  // Connection events
  CONNECT = 'connect',
  CONNECT_ERROR = 'connect_error',
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect',
  RECONNECT_ATTEMPT = 'reconnect_attempt',
  RECONNECT_ERROR = 'reconnect_error',
  RECONNECT_FAILED = 'reconnect_failed',
  
  // Room events
  ROOM_JOIN = 'room:join',
  ROOM_LEAVE = 'room:leave',
  ROOM_USERS = 'room:users',
  ROOM_USER_JOINED = 'room:user_joined',
  ROOM_USER_LEFT = 'room:user_left',
  
  // Document events
  DOCUMENT_CHANGE = 'document:change',
  DOCUMENT_SYNC = 'document:sync',
  DOCUMENT_ACK = 'document:ack',
  
  // Cursor events
  CURSOR_UPDATE = 'cursor:update',
  
  // Chat events
  CHAT_MESSAGE = 'chat:message',
  
  // Error events
  ERROR = 'error',
  PERMISSION_DENIED = 'permission_denied'
}

/**
 * Type mapping for all socket events and their corresponding payloads
 * @interface SocketEventMap
 */
export interface SocketEventMap {
  // Connection events
  [SocketEvent.CONNECT]: () => void;
  [SocketEvent.DISCONNECT]: (reason: string) => void;
  [SocketEvent.CONNECT_ERROR]: (error: Error) => void;
  [SocketEvent.RECONNECT]: (attempt: number) => void;
  [SocketEvent.RECONNECT_ATTEMPT]: (attempt: number) => void;
  [SocketEvent.RECONNECT_ERROR]: (error: Error) => void;
  [SocketEvent.RECONNECT_FAILED]: () => void;
  
  // Room events
  [SocketEvent.ROOM_JOIN]: (data: { roomId: string; user: any }) => void;
  [SocketEvent.ROOM_LEAVE]: (data: { roomId: string; userId: string }) => void;
  [SocketEvent.ROOM_USERS]: (users: any[]) => void;
  [SocketEvent.ROOM_USER_JOINED]: (user: any) => void;
  [SocketEvent.ROOM_USER_LEFT]: (userId: string) => void;
  
  // Document events
  [SocketEvent.DOCUMENT_CHANGE]: (data: { operation: Operation; version: number }) => void;
  [SocketEvent.DOCUMENT_SYNC]: (data: { content: string; version: number }) => void;
  [SocketEvent.DOCUMENT_ACK]: (data: { version: number }) => void;
  
  // Cursor events
  [SocketEvent.CURSOR_UPDATE]: (data: { userId: string; cursor: any }) => void;
  
  // Chat events
  [SocketEvent.CHAT_MESSAGE]: (message: any) => void;
  
  // Error events
  [SocketEvent.ERROR]: (error: { message: string; code?: string }) => void;
  [SocketEvent.PERMISSION_DENIED]: (reason: string) => void;
}

export type SocketEventCallback<T extends SocketEvent> = 
  (data: SocketEventMap[T]) => void;

/**
 * Interface for the Socket.IO client service
 * @interface SocketService
 * @example
 * const socket = createSocketService({ url: 'http://localhost:3000' });
 * socket.connect();
 * socket.on('document:change', (data) => {
 *   console.log('Document changed:', data);
 * });
 */
export interface SocketService {
  connect(): void;
  disconnect(): void;
  reconnect(): void;
  isConnected(): boolean;
  
  // Room methods
  joinRoom(roomId: string, userId: string, username: string): void;
  leaveRoom(roomId: string, userId: string): void;
  
  // Document methods
  sendOperation(operation: Operation): void;
  requestDocumentSync(version: number): void;
  
  // Cursor methods
  sendCursorUpdate(cursor: any): void;
  
  // Chat methods
  sendMessage(message: string): void;
  
  // Event management
  on<T extends SocketEvent>(
    event: T,
    callback: SocketEventCallback<T>
  ): () => void;
  
  off<T extends SocketEvent>(
    event: T,
    callback: SocketEventCallback<T>
  ): void;
  
  once<T extends SocketEvent>(
    event: T,
    callback: SocketEventCallback<T>
  ): () => void;
}

export interface OperationQueueItem {
  operation: Operation;
  retries: number;
  timestamp: number;
  resolve: (value: void | PromiseLike<void>) => void;
  reject: (reason?: any) => void;
}

export interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastPing?: number;
  latency: number;
  error: Error | null;
}
