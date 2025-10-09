import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

let socketInstance: Socket | null = null;

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (!token || socketInstance?.connected) {
      return;
    }

    // Create a new socket connection if one doesn't exist
    if (!socketInstance) {
      socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      setSocket(socketInstance);
    }

    // Clean up on unmount
    return () => {
      if (socketInstance) {
        socketInstance.off('connect');
        socketInstance.off('disconnect');
        socketInstance.off('connect_error');
        
        // Only disconnect if there are no more listeners
        if (socketInstance.listeners('connect').length === 0) {
          socketInstance.disconnect();
          socketInstance = null;
        }
      }
    };
  }, [token]);

  // Emit a socket event
  const emit = useCallback((event: string, data: any, callback?: (response: any) => void) => {
    if (!socket) {
      console.error('Socket not connected');
      return;
    }
    
    if (callback) {
      socket.emit(event, data, callback);
    } else {
      socket.emit(event, data);
    }
  }, [socket]);

  // Listen to a socket event
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (!socket) return () => {};
    
    socket.on(event, callback);
    return () => {
      socket.off(event, callback);
    };
  }, [socket]);

  // Disconnect the socket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socketInstance = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    emit,
    on,
    disconnect,
  };
};
