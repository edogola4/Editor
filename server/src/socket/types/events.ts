import { Socket } from 'socket.io';

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  color?: string; // For cursor and selection color
  cursorPosition?: CursorPosition;
  selection?: SelectionRange;
}

export interface CursorPosition {
  line: number;
  ch: number;
}

export interface SelectionRange {
  anchor: CursorPosition;
  head: CursorPosition;
}

export interface TextFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  backgroundColor?: string;
  link?: string;
  // Add more formatting options as needed
}

export interface Room {
  id: string;
  name: string;
  owner: string;
  members: Set<string>;
  maxMembers: number;
  createdAt: Date;
}

export interface DocumentOperation {
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  text?: string;
  length?: number;
  version: number;
  clientId: string;
  timestamp: number;
  formatting?: TextFormatting;
  userId?: string; // For tracking who made the change
}

export interface ServerToClientEvents {
  // Connection events
  'connection:ack': (payload: { success: boolean; message?: string; user?: User }) => void;
  'room:joined': (payload: { room: Omit<Room, 'members'>; members: User[] }) => void;
  'room:left': (payload: { userId: string; roomId: string }) => void;
  'room:error': (payload: { error: string; code: string }) => void;
  
  // Document operations
  'document:operation': (operation: DocumentOperation) => void;
  'document:state': (state: { content: string; version: number }) => void;
  'document:error': (error: { message: string; code: string }) => void;
  
  // Presence
  'presence:update': (users: User[]) => void;
  'user:typing': (payload: { userId: string; isTyping: boolean }) => void;
  'cursor:update': (payload: { userId: string; position: CursorPosition; selection?: SelectionRange }) => void;
  'selection:update': (payload: { userId: string; selection: SelectionRange | null }) => void;
  'format:apply': (payload: { range: SelectionRange; formatting: TextFormatting }) => void;
  
  // System
  'error': (error: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  // Room events
  'room:join': (
    payload: { roomId: string; user: Omit<User, 'id'> },
    callback: (response: { success: boolean; message?: string; user?: User }) => void
  ) => void;
  'room:leave': (payload: { roomId: string }) => void;
  
  // Document operations
  'document:operation': (
    operation: Omit<DocumentOperation, 'clientId' | 'timestamp'>,
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;
  'cursor:move': (position: CursorPosition) => void;
  'selection:change': (selection: SelectionRange | null) => void;
  'format:text': (payload: { range: SelectionRange; formatting: TextFormatting }) => void;
  'document:sync': (payload: { version: number }) => void;
  
  // Presence
  'user:typing': (payload: { isTyping: boolean; roomId: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: User;
  roomId?: string;
  lastActivity: number;
  cursorPosition?: CursorPosition;
  selection?: SelectionRange | null;
  color: string;
}

export type CustomSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
