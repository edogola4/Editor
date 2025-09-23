import { Pool, PoolConfig } from "pg";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME || "collaborative_editor",
  user: process.env.DB_USER || "editor_user",
  password: process.env.DB_PASSWORD || "editor_pass123",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
};

// Create a new pool of connections
const pool = new Pool(dbConfig);

// Test the database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("Successfully connected to PostgreSQL database");
    client.release();
    return true;
  } catch (error) {
    console.error("Error connecting to PostgreSQL database:", error);
    return false;
  }
};

// Run database migrations
const runMigrations = async () => {
  const client = await pool.connect();
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    // Get all migration files
    const migrationsDir = path.join(__dirname, "migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    // Run each migration that hasn't been run yet
    for (const file of migrationFiles) {
      const migrationName = path.basename(file, ".sql");

      const result = await client.query(
        "SELECT id FROM migrations WHERE name = $1",
        [migrationName],
      );

      if (result.rows.length === 0) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
        await client.query(sql);

        // Record the migration
        await client.query("INSERT INTO migrations (name) VALUES ($1)", [
          migrationName,
        ]);
      }
    }

    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  } finally {
    client.release();
  }
};

export { pool, testConnection, runMigrations };

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient: () => pool.connect(),
  testConnection,
  runMigrations,
};
