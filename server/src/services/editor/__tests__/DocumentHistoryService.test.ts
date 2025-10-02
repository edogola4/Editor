import { DocumentHistoryService } from '../DocumentHistoryService.new';
import { getTestRedisClient } from '../../../tests/setup';
import { Operation } from '../../../types/editor.types';
import { RedisClientType } from 'redis';

describe('DocumentHistoryService', () => {
  let service: DocumentHistoryService;
  const testDocId = 'test-doc-1';
  const testUserId = 'user-123';
  
  beforeAll(async () => {
    const redis = getTestRedisClient() as unknown as RedisClientType;
    service = new DocumentHistoryService(redis);
  });

  afterEach(async () => {
    // Clean up test data after each test
    const redis = getTestRedisClient();
    const keys = await redis.keys(`*${testDocId}*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  });

  describe('recordVersion', () => {
    it('should record a new document version', async () => {
      const operation: Operation = {
        type: 'insert',
        position: 0,
        text: 'Hello',
        version: 1,
        userId: testUserId,
        timestamp: Date.now(),
      };

      await service.recordVersion(testDocId, [operation], 1, testUserId);
      const version = await service.getVersion(testDocId, 1);
      
      expect(version).toBeDefined();
      expect(version?.version).toBe(1);
      expect(version?.operations).toHaveLength(1);
      expect(version?.operations[0].text).toBe('Hello');
    });

    it('should retrieve operations since a specific version', async () => {
      // Record initial version
      const op1: Operation = {
        type: 'insert',
        position: 0,
        text: 'Hello',
        version: 1,
        userId: testUserId,
        timestamp: Date.now(),
      };
      await service.recordVersion(testDocId, [op1], 1, testUserId);

      // Record second version
      const op2: Operation = {
        type: 'insert',
        position: 5,
        text: ' World',
        version: 2,
        userId: testUserId,
        timestamp: Date.now() + 1000,
      };
      await service.recordVersion(testDocId, [op2], 2, testUserId);

      // Get operations since version 1
      const result = await service.getOperationsSince(testDocId, 1);
      
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].text).toBe(' World');
      expect(result.latestVersion).toBe(2);
    });
  });

  describe('version management', () => {
    it('should get the latest version number', async () => {
      // Record multiple versions
      for (let i = 1; i <= 3; i++) {
        const op: Operation = {
          type: 'insert',
          position: 0,
          text: `v${i}`,
          version: i,
          userId: testUserId,
          timestamp: Date.now() + i,
        };
        await service.recordVersion(testDocId, [op], i, testUserId);
      }

      const latestVersion = await service.getLatestVersion(testDocId);
      expect(latestVersion).toBe(3);
    });
  });

  describe('cleanup', () => {
    it('should clean up old versions when limit is reached', async () => {
      const VERSION_LIMIT = 10; // Default limit in the service
      
      // Record more versions than the limit
      for (let i = 1; i <= VERSION_LIMIT + 5; i++) {
        const op: Operation = {
          type: 'insert',
          position: 0,
          text: `v${i}`,
          version: i,
          userId: testUserId,
          timestamp: Date.now() + i,
        };
        await service.recordVersion(testDocId, [op], i, testUserId);
      }

      // The oldest versions should be cleaned up
      const latestVersion = await service.getLatestVersion(testDocId);
      expect(latestVersion).toBe(VERSION_LIMIT + 5);
      
      // The first few versions should be gone
      const earlyVersion = await service.getVersion(testDocId, 1);
      expect(earlyVersion).toBeNull();
      
      // Recent versions should still exist
      const recentVersion = await service.getVersion(testDocId, VERSION_LIMIT + 3);
      expect(recentVersion).toBeDefined();
    });
  });
});
