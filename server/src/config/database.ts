import { Sequelize } from "sequelize";
import { config } from "./config.js";

// Initialize Sequelize with PostgreSQL configuration
const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "collaborative_editor",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test the database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection has been established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    process.exit(1);
  }
};

export { sequelize, testConnection };
