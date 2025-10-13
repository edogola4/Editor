import { Sequelize } from 'sequelize-typescript';
import { config } from './config.js';
import path from 'path';

// This will be initialized in initializeDatabase()
let _sequelize: Sequelize;

export const initializeDatabase = async (): Promise<Sequelize> => {
  if (_sequelize) {
    return _sequelize;
  }

  try {
    // Import the database initialization function
    const { dbInit } = await import('../utils/dbInit.ts');

    // Initialize the database and get the sequelize instance
    const sequelize = await dbInit();
    if (!sequelize) {
      throw new Error('Failed to initialize database: dbInit returned null');
    }
    _sequelize = sequelize;
    return _sequelize;
  } catch (error) {
    console.error('❌ Unable to connect to the database:');
    console.error(error);
    process.exit(1);
  }
};

// Export sequelize instance for direct access
/**
 * Get the initialized Sequelize instance
 * @throws {Error} If the database has not been initialized
 */
export const getSequelize = (): Sequelize => {
  if (typeof _sequelize === 'undefined') {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return _sequelize;
};
