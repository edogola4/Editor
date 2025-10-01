import { Sequelize } from 'sequelize';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the database configuration
const dbConfig = JSON.parse(readFileSync(new URL('../db/config.json', import.meta.url)));
const env = process.env.NODE_ENV || 'development';
const { username, password, database, host, port, dialect } = dbConfig[env];

// Initialize Sequelize
const sequelize = new Sequelize(database, username, password, {
  host,
  port,
  dialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

// Run migrations
async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');

    console.log('🔄 Running migrations...');
    
    // Get the query interface
    const queryInterface = sequelize.getQueryInterface();
    
    // Import and run migrations in order
    try {
      // Initial database setup
      console.log('Running initial database setup...');
      try {
        const { up: initialUp } = await import('../db/migrations/20241001000000_init_database.js');
        await initialUp(queryInterface, Sequelize);
      } catch (error) {
        if (!error.message.includes('already exists') && !error.parent?.code === '42P07') {
          throw error;
        }
        console.log('  - Database already initialized, skipping...');
      }
      
      // Add auth fields
      console.log('Adding auth fields...');
      const { up: authFieldsUp } = await import('../db/migrations/20240924_add_auth_fields_to_users.js');
      try {
        await authFieldsUp(queryInterface, Sequelize);
      } catch (error) {
        if (!error.message.includes('already exists') && !error.parent?.code === '42701') {
          throw error;
        }
        console.log('  - Auth fields already exist, skipping...');
      }
      
      // Add new feature
      console.log('Adding new feature...');
      const { up: newFeatureUp } = await import('../db/migrations/20250922130216_add_new_feature.js');
      try {
        await newFeatureUp(queryInterface, Sequelize);
      } catch (error) {
        if (!error.message.includes('already exists') && !error.parent?.code === '42701') {
          throw error;
        }
        console.log('  - New feature field already exists, skipping...');
      }
      
      console.log('✅ All migrations have been run successfully.');
      process.exit(0);
    } catch (migrationError) {
      console.error('❌ Error during migration:', migrationError);
      throw migrationError;
    }
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
