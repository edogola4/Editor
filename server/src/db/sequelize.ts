import { Sequelize } from 'sequelize-typescript';
import { config } from '../config/config.js';

// Import models
import User from '../models/User.js';
import Document from '../models/Document.js';
import DocumentPermission from '../models/DocumentPermission.js';
import Operation from '../models/Operation.js';
import Room from '../models/Room.js';
import RoomMember from '../models/RoomMember.js';
import RoomActivity from '../models/RoomActivity.js';
import RoomInvitation from '../models/RoomInvitation.js';
import Session from '../models/Session.js';
import Log from '../models/Log.js';
import EnhancedUser from '../models/EnhancedUser.js';
import DocumentVersion from '../models/DocumentVersion.js';

// Initialize Sequelize with configuration
const sequelize = new Sequelize({
  database: config.db.name,
  username: config.db.user,
  password: config.db.password,
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  models: [
    User,
    Document,
    DocumentPermission,
    DocumentVersion,
    Operation,
    Room,
    RoomMember,
    RoomActivity,
    RoomInvitation,
    Session,
    Log,
    EnhancedUser
  ]
});

export default sequelize;
