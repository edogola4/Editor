// Import all models
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

// Export all models
export {
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

// Export default for backward compatibility
const models = {
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

export default models;
