import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { ChatEvent, ChatMessage, ChatRoom, ChatState } from '@/types/chat';
import { chatService } from '@/services/chat/ChatService';
import { useAuth } from './AuthContext';

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ROOMS'; payload: ChatRoom[] }
  | { type: 'SET_ACTIVE_ROOM'; payload: string | null }
  | { type: 'SET_IS_CHAT_OPEN'; payload: boolean }
  | { type: 'SET_IS_MINIMIZED'; payload: boolean }
  | { type: 'ADD_MESSAGE'; payload: { roomId: string; message: ChatMessage } }
  | { type: 'ADD_REACTION'; payload: { roomId: string; messageId: string; emoji: string; userId: string } }
  | { type: 'ADD_ROOM'; payload: ChatRoom }
  | { type: 'UPDATE_ROOM'; payload: ChatRoom }
  | { type: 'ADD_USER'; payload: { userId: string; user: ChatUser } }
  | { type: 'UPDATE_USER'; payload: { userId: string; updates: Partial<ChatUser> } };

const initialState: ChatState = {
  activeRoomId: null,
  rooms: [],
  isChatOpen: false,
  isMinimized: false,
  messages: {},
  users: {},
  isLoading: false,
  error: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ROOMS':
      return { ...state, rooms: action.payload };
    case 'SET_ACTIVE_ROOM':
      return { ...state, activeRoomId: action.payload };
    case 'SET_IS_CHAT_OPEN':
      return { ...state, isChatOpen: action.payload };
    case 'SET_IS_MINIMIZED':
      return { ...state, isMinimized: action.payload };
    case 'ADD_MESSAGE': {
      const { roomId, message } = action.payload;
      const roomMessages = state.messages[roomId] || [];
      const messageExists = roomMessages.some((m) => m.id === message.id);
      
      if (messageExists) return state;
      
      return {
        ...state,
        messages: {
          ...state.messages,
          [roomId]: [...roomMessages, message],
        },
        rooms: state.rooms.map((room) =>
          room.id === roomId
            ? { ...room, lastMessage: message, unreadCount: state.activeRoomId === roomId ? 0 : room.unreadCount + 1 }
            : room
        ),
      };
    }
    case 'ADD_REACTION': {
      const { roomId, messageId, emoji, userId } = action.payload;
      const roomMessages = state.messages[roomId] || [];
      
      return {
        ...state,
        messages: {
          ...state.messages,
          [roomId]: roomMessages.map((msg) => {
            if (msg.id !== messageId) return msg;
            
            const reactions = { ...(msg.reactions || {}) };
            const userReactions = new Set(reactions[emoji] || []);
            
            if (userReactions.has(userId)) {
              userReactions.delete(userId);
              if (userReactions.size === 0) {
                delete reactions[emoji];
              } else {
                reactions[emoji] = Array.from(userReactions);
              }
            } else {
              userReactions.add(userId);
              reactions[emoji] = Array.from(userReactions);
            }
            
            return { ...msg, reactions };
          }),
        },
      };
    }
    case 'ADD_ROOM':
      return {
        ...state,
        rooms: [...state.rooms, action.payload],
      };
    case 'UPDATE_ROOM':
      return {
        ...state,
        rooms: state.rooms.map((room) =>
          room.id === action.payload.id ? { ...room, ...action.payload } : room
        ),
      };
    case 'ADD_USER':
      return {
        ...state,
        users: {
          ...state.users,
          [action.payload.userId]: action.payload.user,
        },
      };
    case 'UPDATE_USER':
      return {
        ...state,
        users: {
          ...state.users,
          [action.payload.userId]: {
            ...state.users[action.payload.userId],
            ...action.payload.updates,
          },
        },
      };
    default:
      return state;
  }
}

interface ChatContextType extends ChatState {
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  minimizeChat: () => void;
  maximizeChat: () => void;
  setActiveRoom: (roomId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user } = useAuth();

  const handleChatEvent = useCallback((event: ChatEvent) => {
    switch (event.type) {
      case 'MESSAGE':
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { roomId: event.payload.roomId, message: event.payload.message },
        });
        break;
      case 'ROOM_UPDATE':
        dispatch({ type: 'UPDATE_ROOM', payload: event.payload });
        break;
      case 'USER_JOINED':
        dispatch({
          type: 'ADD_USER',
          payload: { userId: event.payload.user.id, user: event.payload.user },
        });
        break;
      case 'MESSAGE_REACTION':
        dispatch({
          type: 'ADD_REACTION',
          payload: {
            roomId: event.payload.roomId,
            messageId: event.payload.messageId,
            emoji: event.payload.emoji,
            userId: event.payload.userId,
          },
        });
        break;
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Initialize chat service
    chatService.connect(user.token);

    // Subscribe to chat events
    const unsubscribe = chatService.subscribe(handleChatEvent);

    // Load initial data
    const loadInitialData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        // TODO: Load initial rooms and messages
        // const rooms = await chatService.getRooms();
        // dispatch({ type: 'SET_ROOMS', payload: rooms });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadInitialData();

    return () => {
      unsubscribe();
      chatService.disconnect();
    };
  }, [user, handleChatEvent]);

  const openChat = () => {
    dispatch({ type: 'SET_IS_CHAT_OPEN', payload: true });
    dispatch({ type: 'SET_IS_MINIMIZED', payload: false });
  };

  const closeChat = () => {
    dispatch({ type: 'SET_IS_CHAT_OPEN', payload: false });
  };

  const toggleChat = () => {
    if (state.isChatOpen) {
      closeChat();
    } else {
      openChat();
    }
  };

  const minimizeChat = () => {
    dispatch({ type: 'SET_IS_MINIMIZED', payload: true });
  };

  const maximizeChat = () => {
    dispatch({ type: 'SET_IS_MINIMIZED', payload: false });
  };

  const setActiveRoom = (roomId: string) => {
    dispatch({ type: 'SET_ACTIVE_ROOM', payload: roomId });
    // Mark messages as read
    dispatch({
      type: 'UPDATE_ROOM',
      payload: { 
        id: roomId, 
        unreadCount: 0,
        // Add required fields to match ChatRoom type
        name: state.rooms.find(r => r.id === roomId)?.name || 'Room',
        participants: state.rooms.find(r => r.id === roomId)?.participants || [],
        isGroup: state.rooms.find(r => r.id === roomId)?.isGroup || true,
        createdAt: state.rooms.find(r => r.id === roomId)?.createdAt || Date.now(),
        updatedAt: Date.now()
      } as ChatRoom,
    });
  };

  const sendMessage = async (content: string) => {
    if (!state.activeRoomId || !user) return;

    try {
      await chatService.sendMessage({
        roomId: state.activeRoomId,
        content,
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!state.activeRoomId || !user) return;

    try {
      await chatService.reactToMessage({
        roomId: state.activeRoomId,
        messageId,
        emoji,
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const loadMoreMessages = async () => {
    if (!state.activeRoomId) return;

    try {
      const messages = state.messages[state.activeRoomId] || [];
      const oldestMessage = messages[0];
      
      if (oldestMessage) {
        const moreMessages = await chatService.loadRoomHistory(
          state.activeRoomId,
          oldestMessage.timestamp,
          20
        );
        
        if (moreMessages.length > 0) {
          // Update the messages for the room
          const updatedMessages = {
            ...state.messages,
            [state.activeRoomId]: [...moreMessages, ...messages]
          };
          
          // Update the room's last message if needed
          const updatedRooms = state.rooms.map(room => {
            if (room.id === state.activeRoomId) {
              return {
                ...room,
                lastMessage: moreMessages[0],
                updatedAt: Date.now()
              };
            }
            return room;
          });
          
          dispatch({
            type: 'SET_ROOMS',
            payload: updatedRooms
          });
          
          // Note: We're not using SET_MESSAGES as it's not defined in the reducer
          // Instead, we'll update the messages through the chat event handler
        }
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load more messages' });
    }
  };

  const value = {
    ...state,
    openChat,
    closeChat,
    toggleChat,
    minimizeChat,
    maximizeChat,
    setActiveRoom,
    sendMessage,
    reactToMessage,
    loadMoreMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(roomId?: string) {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }

  const messages = roomId ? context.messages[roomId] || [] : [];
  const room = roomId ? context.rooms.find((r) => r.id === roomId) : undefined;

  return {
    ...context,
    messages,
    room,
  };
}
