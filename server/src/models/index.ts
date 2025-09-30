import { Sequelize } from "sequelize";
import { config } from "../config/config.js";
import User, { UserAttributes, UserInstance, UserModelStatic } from "./User.js";
import Room, { RoomAttributes, RoomInstance } from "./Room.js";
import Document, { DocumentAttributes, DocumentInstance } from "./Document.js";
import DocumentVersion, { DocumentVersionAttributes, DocumentVersionInstance } from "./DocumentVersion.js";

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

// Set up associations
const models = {
  User: UserModel,
  Room: RoomModel,
  Document: DocumentModel,
  DocumentVersion: DocumentVersionModel,
};

// Call associate methods if they exist
Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

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
  testConnection,
} as const;

export { 
  UserModel as User, 
  RoomModel as Room,
  DocumentModel as Document, 
  DocumentVersionModel as DocumentVersion 
};
export type { 
  UserAttributes, 
  UserInstance, 
  RoomAttributes, 
  RoomInstance,
  DocumentAttributes, 
  DocumentInstance, 
  DocumentVersionAttributes, 
  DocumentVersionInstance 
};
export default db;
