import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { Operation, CursorPosition, SelectionRange, UserPresence } from '../types/editor.types';

interface EditorContextType {
  content: string;
  setContent: (content: string) => void;
  cursorPosition: CursorPosition;
  setCursorPosition: (position: CursorPosition) => void;
  selection: SelectionRange | null;
  setSelection: (selection: SelectionRange | null) => void;
  users: Record<string, UserPresence>;
  connect: (documentId: string, userId: string, username: string) => void;
  disconnect: () => void;
  isConnected: boolean;
  version: number;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [content, setContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ line: 0, ch: 0 });
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [users, setUsers] = useState<Record<string, UserPresence>>({});
  const [version, setVersion] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [documentId, setDocumentId] = useState('');
  const [userId] = useState(() => localStorage.getItem('userId') || uuidv4());
  const [username, setUsername] = useState('');

  // Initialize socket connection
  useEffect(() => {
    localStorage.setItem('userId', userId);
    return () => {
      socket?.disconnect();
    };
  }, [userId]);

  const connect = useCallback((docId: string, user: string) => {
    setDocumentId(docId);
    setUsername(user);
    
    const socketInstance = io(process.env.REACT_APP_WS_URL || 'ws://localhost:3001', {
      query: { documentId: docId, userId, username: user },
      transports: ['websocket'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
      
      // Request initial document state
      socketInstance.emit('joinDocument', { documentId: docId, userId, username: user });
    });

    socketInstance.on('sync', (data: { content: string; version: number }) => {
      setContent(data.content);
      setVersion(data.version);
    });

    socketInstance.on('operation', (data: { operations: Operation[]; version: number }) => {
      // Apply remote operations to local state
      // This would be handled by your operational transform logic
      setVersion(data.version);
    });

    socketInstance.on('presence', (data: { users: Record<string, UserPresence> }) => {
      setUsers(data.users);
    });

    socketInstance.on('cursor', (data: { userId: string; position: CursorPosition; color: string }) => {
      setUsers(prev => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          cursor: data.position,
          color: data.color,
          lastActive: Date.now(),
        },
      }));
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setIsConnected(false);
    }
  }, [socket]);

  // Debounce cursor updates
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const timer = setTimeout(() => {
      socket.emit('cursor', {
        documentId,
        position: cursorPosition,
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [cursorPosition, documentId, isConnected, socket]);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    if (!socket || !isConnected) return;
    
    // Calculate the operation (simplified - in a real app, you'd use a diffing algorithm)
    const operation: Operation = {
      type: 'insert',
      position: 0, // This should be calculated based on the actual change
      text: newContent,
      version: version + 1,
      userId,
      timestamp: Date.now(),
    };

    socket.emit('operation', {
      documentId,
      operations: [operation],
    });

    setContent(newContent);
  }, [documentId, isConnected, socket, userId, version]);

  const value = {
    content,
    setContent: handleContentChange,
    cursorPosition,
    setCursorPosition,
    selection,
    setSelection,
    users,
    connect,
    disconnect,
    isConnected,
    version,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
