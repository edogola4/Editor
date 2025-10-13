import { Sequelize, Model, ModelStatic } from 'sequelize';
import type { UserModelStatic, UserInstance } from './EnhancedUser.js';
import type { Document } from './Document.js';
import type { DocumentPermission } from './DocumentPermission.js';
import type { Operation } from './Operation.js';
import type { Room } from './Room.js';
import type { RoomMember } from './RoomMember.js';
import type { RoomActivity } from './RoomActivity.js';
import type { RoomInvitation } from './RoomInvitation.js';
import type { Session } from './Session.js';
import type { Log } from './Log.js';
import type { DocumentVersion } from './DocumentVersion.js';

// Define model type mapping
interface ModelTypes {
  User: UserModelStatic;
  Document: ModelStatic<Document>;
  DocumentPermission: ModelStatic<DocumentPermission>;
  Operation: ModelStatic<Operation>;
  Room: ModelStatic<Room>;
  RoomMember: ModelStatic<RoomMember>;
  RoomActivity: ModelStatic<RoomActivity>;
  RoomInvitation: ModelStatic<RoomInvitation>;
  Session: ModelStatic<Session>;
  Log: ModelStatic<Log>;
  DocumentVersion: ModelStatic<DocumentVersion>;
  [key: string]: ModelStatic<Model>;
}

export const setupAssociations = (sequelize: Sequelize, models?: Record<string, any>) => {
  const modelsToUse = models || (sequelize.models as unknown as ModelTypes);
  console.log('🔗 Available models for associations:', Object.keys(modelsToUse));

  const getModel = <T extends Model>(name: string): ModelStatic<T> => {
    const model = modelsToUse[name];
    if (!model) {
      const availableModels = Object.keys(modelsToUse).join(', ');
      throw new Error(
        `Model ${name} not found. Available models: ${availableModels}`
      );
    }
    return model as ModelStatic<T>;
  };

  const safeAssociation = (setupFn: () => void, associationName: string) => {
    try {
      setupFn();
      console.log(`✅ Successfully set up ${associationName} associations`);
    } catch (error) {
      console.error(`❌ Error setting up ${associationName} association:`, error);
      throw error;
    }
  };

  try {
    console.log('🔗 Setting up model associations...');

    // Get model instances with proper typing
    const User = sequelize.model('User');
    if (!User) {
      throw new Error('User model not found in sequelize');
    }
    
    // Get other models
    const Document = sequelize.model('Document');
    const DocumentPermission = sequelize.model('DocumentPermission');
    const Operation = sequelize.model('Operation');
    const Room = sequelize.model('Room');
    const RoomMember = sequelize.model('RoomMember');
    const RoomActivity = sequelize.model('RoomActivity');
    const RoomInvitation = sequelize.model('RoomInvitation');
    const Session = sequelize.model('Session');
    const Log = sequelize.model('Log');
    const DocumentVersion = sequelize.model('DocumentVersion');

    // User Associations
    safeAssociation(() => {
      // User has many Documents
      // Note: The Document model already has @BelongsTo decorator for the owner
      User.hasMany(Document, {
        foreignKey: 'ownerId',
        as: 'documents',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // User has many Sessions
      User.hasMany(Session, {
        foreignKey: 'userId',
        as: 'sessions',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // User has many Rooms (as owner)
      User.hasMany(Room, {
        foreignKey: 'ownerId',
        as: 'ownedRooms',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // User has many RoomMemberships
      User.hasMany(RoomMember, {
        foreignKey: 'userId',
        as: 'roomMemberships',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }, 'User');

    // Document Associations
    safeAssociation(() => {
      // Document belongs to User (owner)
      Document.belongsTo(User, {
        foreignKey: 'ownerId',
        as: 'owner',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Document has many DocumentPermissions
      Document.hasMany(DocumentPermission, {
        foreignKey: 'documentId',
        as: 'permissions',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Document has many Operations
      Document.hasMany(Operation, {
        foreignKey: 'documentId',
        as: 'operations',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Document has many DocumentVersions
      Document.hasMany(DocumentVersion, {
        foreignKey: 'documentId',
        as: 'versions',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Document belongs to Room (optional)
      Document.belongsTo(Room, {
        foreignKey: 'roomId',
        as: 'room',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true
      });
    }, 'Document');

    // Room Associations
    safeAssociation(() => {
      // Room belongs to User (owner)
      Room.belongsTo(User, {
        foreignKey: 'ownerId',
        as: 'owner',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Room has many Documents
      Room.hasMany(Document, {
        foreignKey: 'roomId',
        as: 'documents',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Room has many RoomMembers
      Room.hasMany(RoomMember, {
        foreignKey: 'roomId',
        as: 'members',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Room has many RoomActivities
      Room.hasMany(RoomActivity, {
        foreignKey: 'roomId',
        as: 'activities',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Room has many RoomInvitations
      Room.hasMany(RoomInvitation, {
        foreignKey: 'roomId',
        as: 'invitations',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }, 'Room');

    console.log('✅ All model associations have been set up successfully');
  } catch (error) {
    console.error('❌ Error setting up model associations:', error);
    throw error;
  }
};
