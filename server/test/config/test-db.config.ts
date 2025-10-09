import { Sequelize } from 'sequelize-typescript';
import { User } from '../../src/models/User';
import { Document } from '../../src/models/Document';
import { DocumentVersion } from '../../src/models/DocumentVersion';
import { DocumentPermission } from '../../src/models/DocumentPermission';
import { Operation } from '../../src/models/Operation';

const TEST_DB_NAME = process.env.TEST_DB_NAME || `test_${Date.now()}`;

const testDbConfig = {
  database: TEST_DB_NAME,
  username: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  dialect: 'postgres' as const,
  logging: false,
  models: [User, Document, DocumentVersion, DocumentPermission, Operation],
};

/**
 * Create a test database connection
 */
export const createTestSequelize = () => {
  return new Sequelize({
    ...testDbConfig,
    models: testDbConfig.models,
  });
};

/**
 * Get the test database configuration
 */
export const getTestDbConfig = () => ({
  ...testDbConfig,
  // Add any additional test-specific configuration here
});

/**
 * Initialize the test database
 */
export const initializeTestDatabase = async () => {
  const sequelize = createTestSequelize();
  await sequelize.authenticate();
  return sequelize;
};

export default testDbConfig;
