export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: number;
  isCodeSnippet?: boolean;
  codeLanguage?: string;
  mentions?: string[];
  reactions?: {
    [emoji: string]: string[]; // emoji -> array of user IDs
  };
}

export interface ChatUser {
  id: string;
  username: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  lastSeen?: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isGroup: boolean;
}

export interface ChatState {
  activeRoomId: string | null;
  rooms: ChatRoom[];
  isChatOpen: boolean;
  isMinimized: boolean;
  messages: {
    [roomId: string]: ChatMessage[];
  };
  users: {
    [userId: string]: ChatUser;
  };
  isLoading: boolean;
  error: string | null;
}

export type ChatEvent =
  | { type: 'MESSAGE'; payload: { roomId: string; message: ChatMessage } }
  | { type: 'ROOM_UPDATE'; payload: ChatRoom }
  | { type: 'USER_JOINED'; payload: { roomId: string; user: ChatUser } }
  | { type: 'USER_LEFT'; payload: { roomId: string; userId: string } }
  | { type: 'MESSAGE_REACTION'; payload: { roomId: string; messageId: string; emoji: string; userId: string } };

export interface SendMessagePayload {
  roomId: string;
  content: string;
  mentions?: string[];
  isCodeSnippet?: boolean;
  codeLanguage?: string;
}

export interface ReactToMessagePayload {
  roomId: string;
  messageId: string;
  emoji: string;
}
