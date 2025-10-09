import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { SocketService, SocketEvent, SocketEventMap } from '../services/socket/types';
import { createSocketService, SocketServiceImpl } from '../services/socket/SocketService';
import { useStore } from '../store';

type EventHandler<T extends SocketEvent> = (data: SocketEventMap[T]) => void;
type UnsubscribeFn = () => void;

export const useSocket = (url: string, options: { autoConnect?: boolean } = {}) => {
  const { autoConnect = true } = options;
  const socketRef = useRef<SocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<Function>>>(new Map());
  const { setSocketState } = useStore();

  // Initialize socket service
  const socketService = useMemo(() => {
    if (socketRef.current) return socketRef.current;
    
    const service = createSocketService({
      url,
      autoConnect,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    
    socketRef.current = service;
    return service;
  }, [url, autoConnect]);

  // Connection management
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      await socketService.connect();
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect'));
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, socketService]);

  const disconnect = useCallback(() => {
    if (!isConnected) return;
    socketService.disconnect();
    setIsConnected(false);
  }, [isConnected, socketService]);

  // Event subscription
  const on = useCallback(<T extends SocketEvent>(
    event: T,
    handler: EventHandler<T>
  ): UnsubscribeFn => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    
    const handlers = eventHandlersRef.current.get(event)!;
    const wrappedHandler = (data: any) => {
      try {
        handler(data);
      } catch (err) {
        console.error(`Error in ${event} handler:`, err);
      }
    };
    
    handlers.add(wrappedHandler);
    const unsubscribe = socketService.on(event, wrappedHandler);
    
    return () => {
      handlers.delete(wrappedHandler);
      unsubscribe();
    };
  }, [socketService]);

  // Emit events
  const emit = useCallback(<T = void>(
    event: string,
    data?: any,
    ackTimeout = 5000
  ): Promise<T> => {
    if (!socketService.isConnected()) {
      return Promise.reject(new Error('Socket not connected'));
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Socket event ${event} timed out`));
      }, ackTimeout);
      
      try {
        // @ts-ignore - Dynamic event emission
        socketService.socket?.emit(event, data, (response: any) => {
          clearTimeout(timeout);
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response?.data);
          }
        });
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  }, [socketService]);

  // Effect for connection state management
  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };

    const onError = (err: Error) => {
      setError(err);
      setIsConnecting(false);
    };

    const unsubscribeConnect = socketService.on('connect', onConnect);
    const unsubscribeDisconnect = socketService.on('disconnect', onDisconnect);
    const unsubscribeError = socketService.on('error', onError);

    // Initialize connection if autoConnect is true
    if (autoConnect) {
      connect().catch(console.error);
    }

    // Cleanup on unmount
    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeError();
      
      // Clean up all registered event handlers
      eventHandlersRef.current.forEach((handlers, event) => {
        handlers.forEach(handler => {
          socketService.off(event as SocketEvent, handler as any);
        });
      });
      eventHandlersRef.current.clear();
      
      if (autoConnect) {
        socketService.disconnect();
      }
    };
  }, [autoConnect, connect, socketService]);

  // Update global store with connection state
  useEffect(() => {
    setSocketState({
      isConnected,
      isConnecting,
      lastError: error?.message || null,
      reconnectAttempts: isConnecting ? 1 : 0,
    });
  }, [isConnected, isConnecting, error, setSocketState]);

  // Public API
  return useMemo(() => ({
    // Connection
    connect,
    disconnect,
    isConnected,
    isConnecting,
    error,
    
    // Event handling
    on,
    off: socketService.off.bind(socketService) as <T extends SocketEvent>(
      event: T,
      handler: EventHandler<T>
    ) => void,
    once: <T extends SocketEvent>(
      event: T,
      handler: EventHandler<T>
    ) => {
      const unsubscribe = on(event, ((...args: any[]) => {
        unsubscribe();
        (handler as any)(...args);
      }) as EventHandler<T>);
      return unsubscribe;
    },
    
    // Emit methods
    emit,
    
    // Room methods
    joinRoom: (roomId: string, userId: string, username: string) => 
      emit('room:join', { roomId, userId, username }),
    leaveRoom: (roomId: string, userId: string) => 
      emit('room:leave', { roomId, userId }),
    
    // Document methods
    sendOperation: (operation: any) => 
      emit('document:change', operation),
    requestDocumentSync: (version: number) => 
      emit('document:sync', { version }),
    
    // Cursor methods
    sendCursorUpdate: (cursor: any) => 
      emit('cursor:update', cursor),
    
    // Chat methods
    sendMessage: (message: string) => 
      emit('chat:message', { message }),
    
    // Socket instance (use with caution)
    socket: (socketService as SocketServiceImpl).socket,
  }), [
    connect,
    disconnect,
    emit,
    error,
    isConnected,
    isConnecting,
    on,
    socketService,
  ]);
};

export default useSocket;
