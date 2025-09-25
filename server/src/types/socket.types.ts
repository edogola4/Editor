import { Socket } from 'socket.io';
import { User } from './user.types';

export interface UserSocket extends Socket {
  user?: User;
  roomId?: string;
}

export interface RoomInfo {
  id: string;
  name: string;
  users: Map<string, User>; // userId -> User
  maxUsers: number;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPresence {
  userId: string;
  socketId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
}

// Client to Server events
export interface ClientToServerEvents {
  // Room events
  'room:join': (roomId: string, callback: (response: { success: boolean; message?: string }) => void) => void;
  'room:leave': (callback: (response: { success: boolean }) => void) => void;
  'room:create': (data: { name: string; isPrivate?: boolean }, callback: (response: { roomId?: string; error?: string }) => void) => void;
  'room:list': (callback: (rooms: Omit<RoomInfo, 'users'>[]) => void) => void;
  
  // Presence events
  'presence:update': (status: 'online' | 'away') => void;
  
  // Chat events
  'chat:message': (message: string, callback: (response: { success: boolean; timestamp: Date }) => void) => void;
  
  // Collaboration events
  'code:update': (data: { roomId: string; code: string; cursorPosition: { line: number; ch: number } }) => void;
  'cursor:move': (position: { line: number; ch: number }) => void;
  'selection:change': (selection: { start: { line: number; ch: number }; end: { line: number; ch: number } }) => void;
  
  // Whiteboard events
  'whiteboard:draw': (data: { x: number; y: number; type: 'start' | 'draw' | 'end'; color: string; size: number }) => void;
  'whiteboard:clear': () => void;
  
  // Admin events
  'admin:kick': (userId: string, reason?: string) => void;
  'admin:ban': (userId: string, reason?: string) => void;
}

// Server to Client events
export interface ServerToClientEvents {
  // Connection events
  'connection:connected': (data: { userId: string; socketId: string }) => void;
  'connection:error': (error: { message: string; code?: string }) => void;
  
  // Room events
  'room:joined': (data: { room: RoomInfo; users: User[] }) => void;
  'room:left': (data: { roomId: string; userId: string }) => void;
  'room:user-joined': (user: User) => void;
  'room:user-left': (userId: string) => void;
  'room:created': (room: Omit<RoomInfo, 'users'>) => void;
  'room:list': (rooms: Omit<RoomInfo, 'users'>[]) => void;
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
  
  // Collaboration events
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
  
  // Whiteboard events
  'whiteboard:drawn': (data: { 
    userId: string;
    x: number;
    y: number;
    type: 'start' | 'draw' | 'end';
    color: string;
    size: number;
  }) => void;
  
  'whiteboard:cleared': (data: { userId: string }) => void;
  
  // Admin events
  'admin:kicked': (data: { userId: string; reason?: string }) => void;
  'admin:banned': (data: { userId: string; reason?: string }) => void;
  'admin:error': (error: { message: string; code: string }) => void;
}

// Inter-server events (used with Redis adapter)
export interface InterServerEvents {
  ping: () => void;
}

// Socket data (stored in socket.data)
export interface SocketData {
  userId: string;
  username: string;
  role: 'user' | 'admin' | 'moderator';
  joinedAt: Date;
  lastActivity: Date;
}
