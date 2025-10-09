// Re-export models
export { default as User } from './User.js';
export { default as Document } from './Document.js';
export { default as DocumentPermission } from './DocumentPermission.js';
export { default as Operation } from './Operation.js';
export { default as Room } from './Room.js';
export { default as RoomMember } from './RoomMember.js';
export { default as RoomActivity } from './RoomActivity.js';
export { default as RoomInvitation } from './RoomInvitation.js';
export { default as Session } from './Session.js';
export { default as Log } from './Log.js';
export { default as EnhancedUser } from './EnhancedUser.js';
export { default as DocumentVersion } from './DocumentVersion.js';

// Export types and enums
export * from './types.js';

// Import models to create db object (avoiding circular dependencies by importing after exports)
import User from './User.js';
import Document from './Document.js';
import DocumentPermission from './DocumentPermission.js';
import Operation from './Operation.js';
import Room from './Room.js';
import RoomMember from './RoomMember.js';
import RoomActivity from './RoomActivity.js';
import RoomInvitation from './RoomInvitation.js';
import Session from './Session.js';
import Log from './Log.js';
import EnhancedUser from './EnhancedUser.js';
import DocumentVersion from './DocumentVersion.js';

// Create db object with all models
const db = {
  User,
  Document,
  DocumentPermission,
  Operation,
  Room,
  RoomMember,
  RoomActivity,
  RoomInvitation,
  Session,
  Log,
  EnhancedUser,
  DocumentVersion
};

export default db;
export { db };
