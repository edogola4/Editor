import { vi, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Sequelize } from 'sequelize-typescript';
// Import models from the index file
import { 
  User, 
  Document, 
  DocumentVersion, 
  DocumentPermission, 
  Operation 
} from '../src/models';
import path from 'path';

// Mock Redis client
vi.mock('ioredis', () => {
  const IORedisMock = require('ioredis-mock');
  return {
    __esModule: true,
    default: IORedisMock,
    Redis: IORedisMock,
  };
});

// Mock external services
const handlers = [
  http.get('https://api.github.com/user', () => {
    return HttpResponse.json({
      id: 12345,
      login: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
    }, { status: 200 });
  }),
];

const server = setupServer(...handlers);

// Test database connection
const testDbName = `test_${Date.now()}`;
const sequelize = new Sequelize({
  dialect: 'postgres',
  username: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: testDbName,
  logging: false,
  models: [
    path.join(__dirname, '../src/models/User'),
    path.join(__dirname, '../src/models/Document'),
    path.join(__dirname, '../src/models/DocumentPermission'),
    path.join(__dirname, '../src/models/DocumentVersion'),
    path.join(__dirname, '../src/models/Operation'),
    path.join(__dirname, '../src/models/Room'),
    path.join(__dirname, '../src/models/RoomMember'),
    path.join(__dirname, '../src/models/RoomActivity'),
    path.join(__dirname, '../src/models/RoomInvitation'),
    path.join(__dirname, '../src/models/Session'),
    path.join(__dirname, '../src/models/Log'),
    path.join(__dirname, '../src/models/EnhancedUser')
  ],
});

// Global test setup
beforeAll(async () => {
  // Start MSW server
  await server.listen({ onUnhandledRequest: 'error' });
  
  // Create test database
  const adminSequelize = new Sequelize({
    dialect: 'postgres',
    username: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    logging: false,
  });
  
  await adminSequelize.query(`CREATE DATABASE ${testDbName};`);
  await adminSequelize.close();
  
  // Initialize models
  await sequelize.sync({ force: true });
  
  // Initialize test database
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

// Reset state between tests
beforeEach(async () => {
  // Clean all tables
  await Promise.all([
    User.destroy({ where: {}, force: true, truncate: { cascade: true } }),
    Document.destroy({ where: {}, force: true, truncate: { cascade: true } }),
    DocumentVersion?.destroy?.({ where: {}, force: true, truncate: { cascade: true } }),
    DocumentPermission.destroy({ where: {}, force: true, truncate: { cascade: true } }),
    Operation.destroy({ where: {}, force: true, truncate: { cascade: true } }),
  ]);
  
  // Reset all mocks
  vi.clearAllMocks();
  
  // Reset MSW handlers
  server.resetHandlers();
});

afterAll(async () => {
  // Close connections
  await sequelize.close();
  
  // Close MSW server
  server.close();
  
  // Drop test database
  const adminSequelize = new Sequelize({
    dialect: 'postgres',
    username: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    logging: false,
  });
  
  // Terminate all connections to the test database
  await adminSequelize.query(`
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '${testDbName}'
    AND pid <> pg_backend_pid();
  `);
  
  await adminSequelize.query(`DROP DATABASE IF EXISTS ${testDbName};`);
  await adminSequelize.close();
});

// Mock Redis client for testing
import Redis from 'ioredis-mock';

declare global {
  // eslint-disable-next-line no-var
  var redisClient: Redis;
}

global.redisClient = new Redis();

// Clean up on process exit
process.on('SIGINT', async () => {
  await Promise.all([
    global.redisClient.quit(),
    sequelize.close(),
  ]);
  process.exit(0);
});

// Export test utilities
export const testUtils = {
  createTestUser: async (userData = {}) => {
    return User.create({
      username: `testuser-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      ...userData,
    });
  },
  createTestDocument: async (documentData = {}, user) => {
    if (!user) {
      user = await testUtils.createTestUser();
    }
    
    const document = await Document.create({
      name: 'Test Document',
      content: 'Initial content',
      ownerId: user.id,
      language: 'plaintext',
      ...documentData,
    });
    
    await DocumentPermission.create({
      documentId: document.id,
      userId: user.id,
      permission: 'owner',
    });
    
    return document;
  },
};
