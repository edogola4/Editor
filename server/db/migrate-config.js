// @ts-check

import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

export default {
  database: process.env.DB_NAME || "collaborative_editor",
  user: process.env.DB_USER || "editor_user",
  password: process.env.DB_PASSWORD || "editor_pass123",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  migrationsTable: "pgmigrations",
  dir: "migrations",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
};

// This file configures the database connection for migrations
// It uses environment variables with sensible defaults for development
