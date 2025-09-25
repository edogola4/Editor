import { io, Socket } from 'socket.io-client';
import { useState, useEffect } from 'react';

// Define types for our socket events
type ClientToServerEvents = {
  // Room events
  'room:join': (roomId: string, callback: (response: { success: boolean; message?: string }) => void) => void;
  'room:leave': (callback: (response: { success: boolean }) => void) => void;
  'room:create': (data: { name: string; isPrivate?: boolean }, callback: (response: { roomId?: string; error?: string }) => void) => void;
  'room:list': (callback: (rooms: any[]) => void) => void;
  
  // Presence events
  'presence:update': (status: 'online' | 'away') => void;
  
  // Chat events
  'chat:message': (message: string, callback: (response: { success: boolean; timestamp: Date }) => void) => void;
  
  // Typing indicators
  'typing:start': () => void;
  'typing:stop': () => void;
  
  // Code collaboration events
  'code:update': (data: { 
    roomId: string; 
    code: string; 
    cursorPosition: { line: number; ch: number } 
  }) => void;
  
  'cursor:move': (position: { line: number; ch: number }) => void;
  'selection:change': (selection: { 
    start: { line: number; ch: number }; 
    end: { line: number; ch: number } 
  }) => void;
  
  // Document events
  'document:join': (documentId: string, callback: (response: { success: boolean }) => void) => void;
  'document:leave': (documentId: string, callback: (response: { success: boolean }) => void) => void;
};

type ServerToClientEvents = {
  // Connection events
  'connection:connected': (data: { userId: string; socketId: string }) => void;
  'connection:error': (error: { message: string; code?: string }) => void;
  'disconnected': (data: { reason: string }) => void;
  'error': (error: { message: string; context?: string; timestamp: Date }) => void;
  
  // Room events
  'room:joined': (data: { room: any; users: any[] }) => void;
  'room:left': (data: { roomId: string; userId: string }) => void;
  'room:user-joined': (user: any) => void;
  'room:user-left': (data: { userId: string }) => void;
  'room:created': (room: any) => void;
  'room:list': (rooms: any[]) => void;
  'room:error': (error: { message: string; code: string }) => void;
  
  // Presence events
  'presence:update': (userId: string, status: 'online' | 'away' | 'offline') => void;
  
  // Chat events
  'chat:message': (message: { 
    id: string;
    userId: string;
    content: string;
    timestamp: Date;
    type: 'text' | 'system' | 'action';
  }) => void;
  
  // Typing indicators
  'typing:start': (data: { userId: string }) => void;
  'typing:stop': (data: { userId: string }) => void;
  
  // Code collaboration events
  'code:updated': (data: { 
    userId: string;
    code: string;
    cursorPosition: { line: number; ch: number };
    timestamp: Date;
  }) => void;
  
  'cursor:moved': (data: {
    userId: string;
    position: { line: number; ch: number };
    name: string;
    color: string;
  }) => void;
  
  'selection:changed': (data: {
    userId: string;
    selection: { start: { line: number; ch: number }; end: { line: number; ch: number } };
  }) => void;
  
  // Document events
  'document:state': (data: { 
    code: string; 
    language: string; 
    users: string[] 
  }) => void;
  
  // Reconnection events
  'reconnect_failed': () => void;
};

class SocketManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 second initial delay
  private currentRoomId: string | null = null;
  private currentDocumentId: string | null = null;
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  
  // Singleton instance
  private static instance: SocketManager;
  
  // Private constructor to enforce singleton
  private constructor() {}
  
  // Get singleton instance
  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  // Get the socket instance
  public getSocket() {
    if (!this.socket) {
      throw new Error('Socket not initialized. Call connect() first.');
    }
    return this.socket;
  }

  // Connect to the WebSocket server
  public connect(token: string): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        return resolve(this.socket);
      }

      this.socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
      });

      const onConnect = () => {
        this.socket?.off('connect_error', onError);
        this.setupEventListeners();
        resolve(this.socket!);
      };

      const onError = (error: Error) => {
        this.socket?.off('connect', onConnect);
        reject(error);
      };

      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onError);
    });
  }

  // Set up all event listeners
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected successfully!');
      this.reconnectAttempts = 0;
      this.emit('connection:connected', { 
        userId: '', // Will be set by the server
        socketId: this.socket?.id || ''
      });

      // Rejoin room if we were in one before reconnection
      if (this.currentRoomId) {
        this.joinRoom(this.currentRoomId);
      }
      
      // Rejoin document if we were in one before reconnection
      if (this.currentDocumentId) {
        this.joinDocument(this.currentDocumentId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      this.emit('connection:error', { message: error.message, code: error.message.includes('401') ? 'UNAUTHORIZED' : 'CONNECTION_ERROR' });
      this.handleReconnect();
    });

    // Room events
    this.socket.on('room:joined', (data) => {
      console.log('🚪 Joined room:', data.room.name);
      this.currentRoomId = data.room.id;
      this.emit('room:joined', data);
    });

    this.socket.on('room:left', (data) => {
      console.log('🚪 Left room:', data.roomId);
      if (this.currentRoomId === data.roomId) {
        this.currentRoomId = null;
      }
      this.emit('room:left', data);
    });

    this.socket.on('room:user-joined', (user) => {
      console.log('👋 User joined:', user.username);
      this.emit('room:user-joined', user);
    });

    this.socket.on('room:user-left', (data) => {
      console.log('👋 User left:', data.userId);
      this.emit('room:user-left', data);
    });

    // Document events
    this.socket.on('document:state', (data) => {
      console.log('📄 Received document state update');
      this.emit('document:state', data);
    });

    // Code collaboration events
    this.socket.on('code:updated', (data) => {
      console.log('📝 Received code update from:', data.userId);
      this.emit('code:updated', data);
    });

    this.socket.on('cursor:moved', (data) => {
      this.emit('cursor:moved', data);
    });

    this.socket.on('selection:changed', (data) => {
      this.emit('selection:changed', data);
    });

    // Typing indicators
    this.socket.on('typing:start', (data) => {
      this.emit('typing:start', data);
    });

    this.socket.on('typing:stop', (data) => {
      this.emit('typing:stop', data);
    });

    // Presence events
    this.socket.on('presence:update', (userId, status) => {
      console.log(`👤 User ${userId} is now ${status}`);
      this.emit('presence:update', userId, status);
    });
  }

  // Join a room
  public joinRoom(roomId: string): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, message: 'Socket not connected' });
        return;
      }

      this.socket.emit('room:join', roomId, (response) => {
        if (response.success) {
          this.currentRoomId = roomId;
        }
        resolve(response);
      });
    });
  }
  
  // Join a document room
  public joinDocument(documentId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket) {
        console.error('Socket not connected');
        resolve(false);
        return;
      }
      
      const leavePromise = this.currentDocumentId && this.currentDocumentId !== 'default'
        ? new Promise<void>((res) => {
            console.log('🚪 Leaving document room:', this.currentDocumentId);
            this.socket?.emit('document:leave', this.currentDocumentId, () => res());
          })
        : Promise.resolve();

      leavePromise.then(() => {
        console.log('🚪 Joining document room:', documentId);
        this.socket?.emit('document:join', documentId, (response: { success: boolean }) => {
          if (response.success) {
            this.currentDocumentId = documentId;
          }
          resolve(response.success);
        });
      });
    });
  }

  // Leave the current room
  public leaveRoom(): Promise<{ success: boolean }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.currentRoomId) {
        resolve({ success: false });
        return;
      }

      this.socket.emit('room:leave', (response) => {
        if (response.success) {
          this.currentRoomId = null;
        }
        resolve(response);
      });
    });
  }

  // Create a new room
  public createRoom(name: string, isPrivate = false): Promise<{ roomId?: string; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ error: 'Socket not connected' });
        return;
      }

      this.socket.emit('room:create', { name, isPrivate }, (response) => {
        if (response.roomId) {
          this.currentRoomId = response.roomId;
        }
        resolve(response);
      });
    });
  }

  // Send a chat message
  public sendMessage(content: string): Promise<{ success: boolean; timestamp: Date }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, timestamp: new Date() });
        return;
      }

      this.socket.emit('chat:message', content, (response) => {
        resolve(response);
      });
    });
  }

  // Update code in the current room
  public updateCode(code: string, cursorPosition: { line: number; ch: number }) {
    if (!this.socket || !this.currentRoomId) return;
    
    this.socket.emit('code:update', {
      roomId: this.currentRoomId,
      code,
      cursorPosition
    });
  }

  // Start typing indicator
  public startTyping() {
    if (!this.socket || !this.currentRoomId) return;
    this.socket.emit('typing:start');
  }

  // Stop typing indicator
  public stopTyping() {
    if (!this.socket || !this.currentRoomId) return;
    this.socket.emit('typing:stop');
  }

  // Handle reconnection logic
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
      
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect_failed');
    }
  }

  // Disconnect from the server
  public disconnect() {
    if (this.socket) {
      // Leave document room before disconnecting
      if (this.currentDocumentId && this.currentDocumentId !== 'default') {
        this.socket.emit('document:leave', this.currentDocumentId, () => {
          this.socket?.disconnect();
        });
      } else {
        this.socket.disconnect();
      }
      
      this.socket = null;
      this.currentRoomId = null;
      this.currentDocumentId = null;
      this.reconnectAttempts = 0;
    }
  }

  // Add event listener
  public on<T extends keyof ServerToClientEvents>(
    event: T,
    listener: (...args: Parameters<ServerToClientEvents[T]>) => void
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    const listeners = this.eventListeners.get(event)!;
    listeners.add(listener as (...args: any[]) => void);
    
    return () => {
      this.off(event, listener);
    };
  }

  // Remove event listener
  public off<T extends keyof ServerToClientEvents>(
    event: T,
    listener: (...args: Parameters<ServerToClientEvents[T]>) => void
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener as (...args: any[]) => void);
    }
  }
  
  // Emit custom event
  private emit<T extends keyof ServerToClientEvents>(
    event: T,
    ...args: Parameters<ServerToClientEvents[T]>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as any)(...args);
        } catch (error) {
          console.error(`Error in ${String(event)} listener:`, error);
        }
      });
    }
  }
  
  // Check if connected
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
  
  // Get current room ID
  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }
  
  // Get current document ID
  public getCurrentDocumentId(): string | null {
    return this.currentDocumentId;
  }
}

// Export a singleton instance
export const socketManager = SocketManager.getInstance();

// React hook for using the socket manager
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up event listeners when the component mounts
    const onConnected = () => setIsConnected(true);
    const onDisconnected = () => {
      setIsConnected(false);
      setCurrentRoom(null);
    };
    const onError = (error: { message: string }) => setError(error.message);
    const onRoomJoined = (data: { room: any }) => setCurrentRoom(data.room.id);
    const onRoomLeft = () => setCurrentRoom(null);

    socketManager.on('connection:connected', onConnected);
    socketManager.on('disconnected', onDisconnected);
    socketManager.on('connection:error', onError);
    socketManager.on('room:joined', onRoomJoined);
    socketManager.on('room:left', onRoomLeft);

    // Clean up event listeners when the component unmounts
    return () => {
      socketManager.off('connection:connected', onConnected);
      socketManager.off('disconnected', onDisconnected);
      socketManager.off('connection:error', onError);
      socketManager.off('room:joined', onRoomJoined);
      socketManager.off('room:left', onRoomLeft);
    };
  }, []);

  return {
    socket: socketManager,
    isConnected,
    currentRoom,
    error,
  };
}
