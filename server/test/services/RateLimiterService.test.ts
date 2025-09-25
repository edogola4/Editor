import { describe, beforeAll, afterAll, it, expect, jest } from '@jest/globals';
import { setupTestEnvironment, cleanupTestEnvironment } from '../test-utils';
import { rateLimiter } from '../../src/services/rate-limiting/RateLimiterService';

describe('RateLimiterService', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  beforeEach(async () => {
    // Clear all rate limits before each test
    const keys = await rateLimiter['redisClient'].keys('rl_*');
    if (keys.length > 0) {
      await rateLimiter['redisClient'].del(keys);
    }
  });

  describe('consume()', () => {
    it('should allow consuming points within limit', async () => {
      const key = 'test-consume';
      const limiterName = 'message:global';
      
      // Consume points up to the limit
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.consume(limiterName, key);
        expect(result.success).toBe(true);
        expect(result.remainingPoints).toBe(30 - (i + 1));
      }
    });

    it('should reject when rate limit is exceeded', async () => {
      const key = 'test-limit-exceeded';
      const limiterName = 'message:global';
      
      // Consume all available points
      for (let i = 0; i < 30; i++) {
        await rateLimiter.consume(limiterName, key);
      }
      
      // Next consume should fail
      const result = await rateLimiter.consume(limiterName, key);
      expect(result.success).toBe(false);
      expect(result.remainingPoints).toBe(0);
    });

    it('should respect different keys independently', async () => {
      const limiterName = 'message:global';
      
      // Consume points for key1
      const result1 = await rateLimiter.consume(limiterName, 'key1');
      expect(result1.success).toBe(true);
      expect(result1.remainingPoints).toBe(29);
      
      // Consume points for key2 should be independent
      const result2 = await rateLimiter.consume(limiterName, 'key2');
      expect(result2.success).toBe(true);
      expect(result2.remainingPoints).toBe(29);
    });
  });

  describe('getRemainingPoints()', () => {
    it('should return remaining points', async () => {
      const key = 'test-remaining-points';
      const limiterName = 'message:global';
      
      // Check initial points
      let remaining = await rateLimiter.getRemainingPoints(limiterName, key);
      expect(remaining).toBe(30);
      
      // Consume some points
      await rateLimiter.consume(limiterName, key, 5);
      
      // Check remaining points
      remaining = await rateLimiter.getRemainingPoints(limiterName, key);
      expect(remaining).toBe(25);
    });
  });

  describe('deleteKey()', () => {
    it('should delete rate limit for a key', async () => {
      const key = 'test-delete-key';
      const limiterName = 'message:global';
      
      // Consume some points
      await rateLimiter.consume(limiterName, key, 10);
      
      // Delete the key
      const deleted = await rateLimiter.deleteKey(limiterName, key);
      expect(deleted).toBe(true);
      
      // Should be able to consume full limit again
      const result = await rateLimiter.consume(limiterName, key);
      expect(result.remainingPoints).toBe(29);
    });
  });

  describe('custom limiters', () => {
    it('should create and use custom limiters', async () => {
      const customLimiter = 'custom:limiter';
      const key = 'test-custom-limiter';
      
      // Create a custom limiter
      rateLimiter.createLimiter(customLimiter, {
        points: 5,
        duration: 60,
        keyPrefix: 'rl_custom_test',
      });
      
      // Use the custom limiter
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.consume(customLimiter, key);
        expect(result.success).toBe(true);
      }
      
      // Next consume should fail
      const result = await rateLimiter.consume(customLimiter, key);
      expect(result.success).toBe(false);
    });
  });

  describe('block duration', () => {
    it('should block for the specified duration', async () => {
      const limiterName = 'auth';
      const key = 'test-block-duration';
      
      // Set a short block duration for testing (1 second)
      rateLimiter.createLimiter('test:block', {
        points: 3,
        duration: 1, // 1 second
        blockDuration: 1, // Block for 1 second
        keyPrefix: 'rl_test_block',
      });
      
      // Exceed the limit
      for (let i = 0; i < 3; i++) {
        await rateLimiter.consume('test:block', key);
      }
      
      // Should be blocked
      let result = await rateLimiter.consume('test:block', key);
      expect(result.success).toBe(false);
      
      // Wait for block to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be able to consume again
      result = await rateLimiter.consume('test:block', key);
      expect(result.success).toBe(true);
    }, 10000); // Increase timeout for this test
  });
});
