import { Sequelize } from 'sequelize';
import { config } from '../src/config/config';
import { db } from '../src/services/database/DatabaseService';
import { rateLimiter } from '../src/services/rate-limiting/RateLimiterService';
import { monitoringService } from '../src/services/monitoring/MonitoringService';

export const TEST_DB_NAME = 'test_db';

// Create a test database connection
export const createTestDb = async () => {
  // Connect to the default database to create the test database
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: config.db.host,
    port: config.db.port,
    username: config.db.username,
    password: config.db.password,
    logging: false,
  });

  try {
    // Drop the test database if it exists
    await sequelize.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME};`);
    
    // Create a new test database
    await sequelize.query(`CREATE DATABASE ${TEST_DB_NAME};`);
    
    logger.info(`Test database '${TEST_DB_NAME}' created successfully`);
  } finally {
    await sequelize.close();
  }
};

// Initialize test environment
export const setupTestEnvironment = async () => {
  // Use a different database for tests
  process.env.NODE_ENV = 'test';
  process.env.DB_DATABASE = TEST_DB_NAME;
  
  // Create test database
  await createTestDb();
  
  // Initialize database
  await db.initialize();
  
  // Initialize rate limiter
  await rateLimiter.initialize();
  
  // Initialize monitoring service
  await monitoringService.initialize();
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
