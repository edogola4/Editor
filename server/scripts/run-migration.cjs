const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'collaborative_editor',
  process.env.DB_USER || 'brandon',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
  }
);

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Run the migration
    const migration = require('../db/migrations/20241006_create_sessions_table.cjs');
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration();
