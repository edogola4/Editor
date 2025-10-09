import { Sequelize } from 'sequelize';
import { config } from '../src/config/config';
import { User } from '../src/models/User';
import { Document } from '../src/models/Document';
import { DocumentVersion } from '../src/models/DocumentVersion';
import { DocumentPermission } from '../src/models/DocumentPermission';
import { Operation } from '../src/models/Operation';

// Test database configuration
const TEST_DB_NAME = `test_${Date.now()}`;

// Create a test database connection
export const createTestDb = async () => {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    username: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
    logging: false,
  });

  try {
    // Create a new test database
    await sequelize.query(`CREATE DATABASE ${TEST_DB_NAME};`);
    console.log(`Test database '${TEST_DB_NAME}' created successfully`);
  } catch (error) {
    console.error('Error creating test database:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Drop test database
export const dropTestDb = async () => {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    username: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
    logging: false,
  });

  try {
    // Close all connections to the test database
    await sequelize.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${TEST_DB_NAME}'
      AND pid <> pg_backend_pid();
    `);
    
    // Drop the test database
    await sequelize.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME};`);
    console.log(`Test database '${TEST_DB_NAME}' dropped successfully`);
  } catch (error) {
    console.error('Error dropping test database:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Initialize test environment
export const setupTestEnvironment = async () => {
  try {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DB_DATABASE = TEST_DB_NAME;
    
    // Create and initialize test database
    await createTestDb();
    
    // Initialize Sequelize with test database
    const sequelize = new Sequelize({
      dialect: 'postgres',
      database: TEST_DB_NAME,
      username: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'postgres',
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      logging: false,
      models: [User, Document, DocumentVersion, DocumentPermission, Operation],
    });
    
    // Sync all models
    await sequelize.sync({ force: true });
    
    return sequelize;
  } catch (error) {
    console.error('Error setting up test environment:', error);
    throw error;
  }
};
};

// Clean up test environment
export const cleanupTestEnvironment = async () => {
  // Close all connections
  await db.close();
  await rateLimiter.close();
  await monitoringService.close();
  
  // Drop the test database
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: config.db.host,
    port: config.db.port,
    username: config.db.username,
    password: config.db.password,
    database: TEST_DB_NAME,
    logging: false,
  });
  
  try {
    // Disconnect all connections to the test database
    await sequelize.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${TEST_DB_NAME}'
      AND pid <> pg_backend_pid();
    `);
    
    // Drop the test database
    await sequelize.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME};`);
    logger.info(`Test database '${TEST_DB_NAME}' dropped successfully`);
  } finally {
    await sequelize.close();
  }
};

// Helper function to create a test user
export const createTestUser = async (userData: any = {}) => {
  const User = db.getModel('User');
  return await User.create({
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'test123',
    ...userData,
  });
};

// Helper function to create a test room
export const createTestRoom = async (roomData: any = {}, userId?: string) => {
  const Room = db.getModel('Room');
  const room = await Room.create({
    name: `test-room-${Date.now()}`,
    description: 'Test room',
    isPrivate: false,
    createdBy: userId || (await createTestUser()).id,
    ...roomData,
  });
  
  // Add user to room
  if (userId) {
    await room.addUser(userId, { through: { role: 'owner' } });
  }
  
  return room;
};
