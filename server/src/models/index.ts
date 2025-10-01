import { Sequelize } from "sequelize";
import { config } from "../config/config.js";
import User, { UserAttributes, UserInstance, UserModelStatic } from "./User.js";
import Room, { RoomAttributes, RoomInstance, RoomModelStatic, UserRole, InvitationStatus } from "./Room.js";
import Document, { DocumentAttributes, DocumentInstance } from "./Document.js";
import DocumentVersion, { DocumentVersionAttributes, DocumentVersionInstance } from "./DocumentVersion.js";
import RoomMember, { RoomMemberAttributes, RoomMemberInstance } from "./RoomMember.js";
import RoomInvitation, { RoomInvitationAttributes, RoomInvitationInstance } from "./RoomInvitation.js";
import RoomActivity, { RoomActivityAttributes, RoomActivityInstance, ActivityType } from "./RoomActivity.js";

// Initialize Sequelize with configuration
const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
);

// Initialize models
const UserModel = User(sequelize);
const RoomModel = Room(sequelize);
const DocumentModel = Document(sequelize);
const DocumentVersionModel = DocumentVersion(sequelize);
const RoomMemberModel = RoomMember(sequelize);
const RoomInvitationModel = RoomInvitation(sequelize);
const RoomActivityModel = RoomActivity(sequelize);

// Set up associations
const models = {
  User: UserModel,
  Room: RoomModel,
  Document: DocumentModel,
  DocumentVersion: DocumentVersionModel,
  RoomMember: RoomMemberModel,
  RoomInvitation: RoomInvitationModel,
  RoomActivity: RoomActivityModel,
};

// Set up model associations
const setupAssociations = () => {
  // Room - User (Owner) association
  RoomModel.belongsTo(UserModel, {
    foreignKey: 'ownerId',
    as: 'owner',
    onDelete: 'CASCADE',
  });

  // Room - RoomMember associations
  RoomModel.hasMany(RoomMemberModel, {
    foreignKey: 'roomId',
    as: 'members',
    onDelete: 'CASCADE',
  });
  
  RoomMemberModel.belongsTo(RoomModel, {
    foreignKey: 'roomId',
    as: 'room',
  });
  
  RoomMemberModel.belongsTo(UserModel, {
    foreignKey: 'userId',
    as: 'user',
  });

  // Room - RoomInvitation associations
  RoomModel.hasMany(RoomInvitationModel, {
    foreignKey: 'roomId',
    as: 'invitations',
    onDelete: 'CASCADE',
  });
  
  RoomInvitationModel.belongsTo(RoomModel, {
    foreignKey: 'roomId',
    as: 'room',
  });
  
  RoomInvitationModel.belongsTo(UserModel, {
    foreignKey: 'invitedBy',
    as: 'inviter',
  });

  // Room - RoomActivity associations
  RoomModel.hasMany(RoomActivityModel, {
    foreignKey: 'roomId',
    as: 'activities',
    onDelete: 'CASCADE',
  });
  
  RoomActivityModel.belongsTo(RoomModel, {
    foreignKey: 'roomId',
    as: 'room',
  });
  
  RoomActivityModel.belongsTo(UserModel, {
    foreignKey: 'userId',
    as: 'user',
  });

  // User - Room associations
  UserModel.hasMany(RoomModel, {
    foreignKey: 'ownerId',
    as: 'ownedRooms',
  });
  
  UserModel.hasMany(RoomMemberModel, {
    foreignKey: 'userId',
    as: 'roomMemberships',
  });
  
  UserModel.hasMany(RoomInvitationModel, {
    foreignKey: 'invitedBy',
    as: 'sentInvitations',
  });
  
  UserModel.hasMany(RoomActivityModel, {
    foreignKey: 'userId',
    as: 'activities',
  });
};

// Call associate methods if they exist
Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

// Set up associations
setupAssociations();

// Test the database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

const db = {
  sequelize,
  Sequelize,
  User: UserModel,
  Room: RoomModel,
  Document: DocumentModel,
  DocumentVersion: DocumentVersionModel,
  RoomMember: RoomMemberModel,
  RoomInvitation: RoomInvitationModel,
  RoomActivity: RoomActivityModel,
  testConnection,
};

export default db;

// Export types and enums
export type {
  UserAttributes,
  UserInstance,
  UserModelStatic,
  RoomAttributes,
  RoomInstance,
  RoomModelStatic,
  DocumentAttributes,
  DocumentInstance,
  DocumentVersionAttributes,
  DocumentVersionInstance,
  RoomMemberAttributes,
  RoomMemberInstance,
  RoomInvitationAttributes,
  RoomInvitationInstance,
  RoomActivityAttributes,
  RoomActivityInstance,
};

// Export enums
export { UserRole, InvitationStatus, ActivityType };

// Export models
export {
  sequelize,
  Sequelize,
  UserModel as User,
  RoomModel as Room,
  DocumentModel as Document,
  DocumentVersionModel as DocumentVersion,
  RoomMemberModel as RoomMember,
  RoomInvitationModel as RoomInvitation,
  RoomActivityModel as RoomActivity,
};
