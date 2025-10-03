import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from '../../src/config/config.js';

const { Client } = pg;

// Get database configuration
const dbConfig = config.database;

// Validate required configuration
if (!dbConfig || !dbConfig.username || !dbConfig.host || !dbConfig.database || !dbConfig.port) {
  console.error('❌ Database configuration is missing or incomplete');
  console.error('Please check your .env file and ensure all required database variables are set');
  process.exit(1);
}

console.log('🔧 Database configuration:');
console.log(`- Host: ${dbConfig.host}`);
console.log(`- Port: ${dbConfig.port}`);
console.log(`- Database: ${dbConfig.database}`);
console.log(`- User: ${dbConfig.username}`);

// Create a new client instance
const client = new Client({
  user: dbConfig.username,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
  ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
});

// Connect to the database
async function connect() {
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (error) {
    console.error('Error connecting to the database', error);
    process.exit(1);
  }
}

// Run the migration
async function runMigration() {
  try {
    await connect();
    
    // Start a transaction
    await client.query('BEGIN');
    
    console.log('Dropping existing indexes...');
    await client.query(`
      DROP INDEX IF EXISTS "rooms_name_owner_id";
    `);
    
    console.log('Renaming columns to snake_case...');
    // Rename columns to snake_case
    await client.query(`
      ALTER TABLE rooms RENAME COLUMN "ownerId" TO owner_id;
      ALTER TABLE rooms RENAME COLUMN "isPrivate" TO is_private;
      ALTER TABLE rooms RENAME COLUMN "maxUsers" TO max_users;
      ALTER TABLE rooms RENAME COLUMN "lastActivityAt" TO last_activity_at;
      ALTER TABLE rooms RENAME COLUMN "totalSessions" TO total_sessions;
      ALTER TABLE rooms RENAME COLUMN "totalEdits" TO total_edits;
      ALTER TABLE rooms RENAME COLUMN "averageSessionDuration" TO average_session_duration;
      ALTER TABLE rooms RENAME COLUMN "activeUsers" TO active_users;
      ALTER TABLE rooms RENAME COLUMN "lastActive" TO last_active;
    `);
    
    console.log('Recreating indexes...');
    // Recreate index with new column names
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS rooms_name_owner_id 
      ON rooms (name, owner_id);
    `);
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    // Rollback the transaction in case of an error
    await client.query('ROLLBACK');
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await client.end();
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('❌ Migration failed with error:', error);
  process.exit(1);
});
