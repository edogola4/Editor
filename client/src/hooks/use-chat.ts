import { useState, useCallback, useEffect } from 'react';
import { useSocket } from './use-socket';
import { useUser } from './use-user';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  isCodeSnippet?: boolean;
  codeLanguage?: string;
}

interface ChatRoom {
  id: string;
  name: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
  }>;
  messages: Message[];
}

export const useChat = (roomId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { socket } = useSocket();

  // Initialize chat connection
  useEffect(() => {
    if (!socket || !user) return;

    const onConnect = () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      // Join the room when connected
      socket.emit('joinRoom', { roomId, userId: user.id });
    };

    const onDisconnect = () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    };

    const onMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    const onUserTyping = (userId: string, isTyping: boolean) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    };

    // Set up event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message', onMessage);
    socket.on('userTyping', onUserTyping);

    // Clean up on unmount
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message', onMessage);
      socket.off('userTyping', onUserTyping);
      
      // Leave the room when component unmounts
      if (user) {
        socket.emit('leaveRoom', { roomId, userId: user.id });
      }
    };
  }, [socket, roomId, user]);

  // Send a message
  const sendMessage = useCallback((content: string, isCodeSnippet = false, codeLanguage = '') => {
    if (!socket || !user) {
      setError('Not connected to chat server');
      return;
    }

    const message: Omit<Message, 'id' | 'timestamp'> = {
      content,
      sender: {
        id: user.id,
        name: user.name || 'Anonymous',
        avatar: user.avatar,
      },
      isCodeSnippet,
      codeLanguage: isCodeSnippet ? codeLanguage : undefined,
    };

    socket.emit('sendMessage', { roomId, message }, (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        setError(response.error || 'Failed to send message');
      }
    });
  }, [socket, roomId, user]);

  // Send typing indicator
  const setTyping = useCallback((isTyping: boolean) => {
    if (!socket || !user) return;
    
    socket.emit('typing', { 
      roomId, 
      userId: user.id, 
      isTyping 
    });
  }, [socket, roomId, user]);

  return {
    messages,
    isConnected,
    typingUsers,
    error,
    sendMessage,
    setTyping,
  };
};
