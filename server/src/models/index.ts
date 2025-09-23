import { Sequelize } from "sequelize";
import config from "../config/config.js";
import User, { UserAttributes, UserInstance, UserModelStatic } from "./User.js";

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

// Set up associations (if any)
// Example: UserModel.associate(sequelize.models);

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
  testConnection,
} as const;

export { UserModel as User, UserAttributes, UserInstance };
export default db;
