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
  clientId?: string; // For optimistic updates
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
  createdAt?: number;
  updatedAt?: number;
}

export type ChatEvent = {
  type: 'MESSAGE' | 'MESSAGE_UPDATE' | 'MESSAGE_DELETE' | 'TYPING' | 'USER_JOIN' | 'USER_LEAVE' | 'ROOM_UPDATE' | 'ERROR';
  payload: any;
  timestamp: number;
};

export type ChatClientEvent = {
  type: 'SEND_MESSAGE' | 'EDIT_MESSAGE' | 'DELETE_MESSAGE' | 'TYPING_START' | 'TYPING_END' | 'JOIN_ROOM' | 'LEAVE_ROOM' | 'REACT_TO_MESSAGE' | 'MARK_AS_READ';
  payload: any;
  requestId?: string;
};

export type ChatServerEvent = {
  type: 'MESSAGE' | 'MESSAGE_UPDATE' | 'MESSAGE_DELETE' | 'TYPING' | 'USER_JOIN' | 'USER_LEAVE' | 'ROOM_UPDATE' | 'ERROR' | 'MESSAGE_REACTION' | 'MESSAGE_READ' | 'PRESENCE_UPDATE';
  payload: any;
  requestId?: string;
};

export interface SendMessagePayload {
  roomId: string;
  content: string;
  mentions?: string[];
  isCodeSnippet?: boolean;
  codeLanguage?: string;
  replyTo?: string;
  clientId?: string;
}

export interface EditMessagePayload {
  roomId: string;
  messageId: string;
  content: string;
}

export interface DeleteMessagePayload {
  roomId: string;
  messageId: string;
}

export interface ReactToMessagePayload {
  roomId: string;
  messageId: string;
  emoji: string;
  userId: string;
}

export interface MarkAsReadPayload {
  roomId: string;
  messageId: string;
  userId: string;
}

export interface TypingIndicatorPayload {
  roomId: string;
  isTyping: boolean;
}

export interface JoinRoomPayload {
  roomId: string;
  userId: string;
}

export interface LeaveRoomPayload {
  roomId: string;
  userId: string;
}

export interface ChatError {
  code: string;
  message: string;
  details?: any;
}

export interface ChatSuccessResponse<T = any> {
  success: true;
  data: T;
  requestId?: string;
}

export interface ChatErrorResponse {
  success: false;
  error: ChatError;
  requestId?: string;
}

export type ChatResponse<T = any> = ChatSuccessResponse<T> | ChatErrorResponse;

export interface ChatServiceOptions {
  /** Maximum number of messages to keep in memory per room */
  maxMessagesPerRoom?: number;
  /** Maximum number of characters per message */
  maxMessageLength?: number;
  /** Maximum number of reactions per message */
  maxReactionsPerMessage?: number;
  /** Maximum number of rooms a user can join */
  maxRoomsPerUser?: number;
  /** Maximum number of users per room (0 for unlimited) */
  maxUsersPerRoom?: number;
  /** Message retention period in seconds (0 for unlimited) */
  messageRetentionPeriod?: number;
  /** Whether to enable message history */
  enableHistory?: boolean;
  /** Maximum number of messages to return in history */
  maxHistoryMessages?: number;
  /** Whether to enable typing indicators */
  enableTypingIndicators?: boolean;
  /** Whether to enable read receipts */
  enableReadReceipts?: boolean;
  /** Whether to enable message reactions */
  enableReactions?: boolean;
  /** Whether to enable message replies */
  enableReplies?: boolean;
  /** Whether to enable user mentions */
  enableMentions?: boolean;
  /** Whether to enable file uploads */
  enableFileUploads?: boolean;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Allowed file types */
  allowedFileTypes?: string[];
}
