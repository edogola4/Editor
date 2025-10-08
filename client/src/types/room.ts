export enum UserRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  GUEST = 'guest',
}

export interface RoomUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: UserRole;
  lastActive?: Date;
  isOnline: boolean;
}

export interface RoomSettings {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  password?: string;
  maxUsers: number;
  allowGuestAccess: boolean;
  allowFileUploads: boolean;
  allowScreenSharing: boolean;
  requireLogin: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  hasPassword: boolean;
  userCount: number;
  maxUsers: number;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  settings: Omit<RoomSettings, 'id' | 'ownerId'>;
  users: RoomUser[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomFormData {
  name: string;
  description: string;
  isPublic: boolean;
  password?: string;
  maxUsers: number;
  allowGuestAccess: boolean;
  allowFileUploads: boolean;
  allowScreenSharing: boolean;
  requireLogin: boolean;
}

export interface JoinRoomData {
  roomId: string;
  password?: string;
  username: string;
  email?: string;
  isGuest: boolean;
}

export interface RoomInvite {
  id: string;
  roomId: string;
  code: string;
  expiresAt: Date;
  maxUses?: number;
  usedCount: number;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

export interface RoomActivity {
  id: string;
  roomId: string;
  userId: string;
  action: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface RoomPermissions {
  canEdit: boolean;
  canInvite: boolean;
  canKick: boolean;
  canShareScreen: boolean;
  canUploadFiles: boolean;
  canManageRoom: boolean;
  canModerate: boolean;
}
