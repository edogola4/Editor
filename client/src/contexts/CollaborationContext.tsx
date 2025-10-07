import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email?: string;
  color: string;
  cursorPosition?: {
    lineNumber: number;
    column: number;
  };
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

interface CollaborationContextType {
  users: User[];
  currentUser: User | null;
  onContentChange: (content: string) => void;
  setCursorPosition: (position: { lineNumber: number; column: number }) => void;
  setSelection: (selection: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  }) => void;
  addUser: (user: Omit<User, 'id'>) => string;
  removeUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

// Generate a random color for user cursors
const generateRandomColor = () => {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEEAD', // Yellow
    '#D4A5A5', // Pink
    '#9B5DE5', // Purple
    '#F15BB5', // Magenta
    '#00BBF9', // Light Blue
    '#00F5D4', // Turquoise
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const CollaborationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // In a real app, you would connect to your WebSocket server here
    // const ws = new WebSocket('ws://your-websocket-server');
    // setSocket(ws);

    // For demo purposes, we'll simulate a local user
    const localUser: User = {
      id: 'local-user',
      name: 'You',
      color: generateRandomColor(),
    };
    setCurrentUser(localUser);
    setUsers([localUser]);

    return () => {
      // Clean up WebSocket connection
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        // Handle different types of messages (user joined, content changed, cursor moved, etc.)
        switch (message.type) {
          case 'user-joined':
            setUsers(prevUsers => [...prevUsers, message.user]);
            break;
          case 'user-left':
            setUsers(prevUsers => prevUsers.filter(user => user.id !== message.userId));
            break;
          case 'content-changed':
            // Handle content changes from other users
            break;
          case 'cursor-moved':
            // Update cursor position for the user
            setUsers(prevUsers =>
              prevUsers.map(user =>
                user.id === message.userId
                  ? { ...user, cursorPosition: message.position }
                  : user
              )
            );
            break;
          case 'selection-changed':
            // Update selection for the user
            setUsers(prevUsers =>
              prevUsers.map(user =>
                user.id === message.userId ? { ...user, selection: message.selection } : user
              )
            );
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket]);

  // Notify other users about content changes
  const onContentChange = useCallback(
    (content: string) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'content-changed',
            content,
            userId: currentUser?.id,
          })
        );
      }
    },
    [socket, currentUser?.id]
  );

  // Update cursor position
  const setCursorPosition = useCallback(
    (position: { lineNumber: number; column: number }) => {
      if (!currentUser) return;

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === currentUser.id ? { ...user, cursorPosition: position } : user
        )
      );

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'cursor-moved',
            userId: currentUser.id,
            position,
          })
        );
      }
    },
    [currentUser, socket]
  );

  // Update selection
  const setSelection = useCallback(
    (selection: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    }) => {
      if (!currentUser) return;

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === currentUser.id ? { ...user, selection } : user
        )
      );

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'selection-changed',
            userId: currentUser.id,
            selection,
          })
        );
      }
    },
    [currentUser, socket]
  );

  // Add a new user
  const addUser = useCallback((user: Omit<User, 'id'>) => {
    const newUser = {
      ...user,
      id: `user-${Date.now()}`,
      color: generateRandomColor(),
    };
    setUsers(prevUsers => [...prevUsers, newUser]);
    return newUser.id;
  }, []);

  // Remove a user
  const removeUser = useCallback((userId: string) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
  }, []);

  // Update user information
  const updateUser = useCallback((userId: string, updates: Partial<User>) => {
    setUsers(prevUsers =>
      prevUsers.map(user => (user.id === userId ? { ...user, ...updates } : user))
    );
  }, []);

  return (
    <CollaborationContext.Provider
      value={{
        users,
        currentUser,
        onContentChange,
        setCursorPosition,
        setSelection,
        addUser,
        removeUser,
        updateUser,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

export default CollaborationContext;
