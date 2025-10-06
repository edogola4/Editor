import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Redis from 'ioredis-mock';
import { RateLimitService } from '../../src/services/RateLimitService.js';

// Mock the Redis client
vi.mock('ioredis', () => {
  const RedisMock = vi.fn().mockImplementation(() => ({
    // Mock Redis methods used in the tests
    multi: vi.fn().mockReturnThis(),
    zadd: vi.fn().mockReturnThis(),
    expire: vi.fn().mockReturnThis(),
    zremrangebyscore: vi.fn().mockReturnThis(),
    zcard: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue([[null, 1], [null, 1], [null, 1], [null, 1]]),
    ttl: vi.fn().mockResolvedValue(60),
    zcount: vi.fn().mockResolvedValue(1),
    on: vi.fn(),
  }));
  
  return {
    default: RedisMock,
  };
});

describe('RateLimitService', () => {
  let rateLimitService: any;
  const testNamespace = 'test:namespace';
  const testId = 'test-id';
  const testMax = 5;
  const testWindow = 60; // 1 minute

  beforeEach(() => {
    // Get a fresh instance for each test
    rateLimitService = new (RateLimitService as any).constructor();
  });

  afterEach(async () => {
    // Clean up Redis after each test
    const redis = new Redis();
    await redis.flushall();
  });

  describe('isRateLimited', () => {
    it('should allow requests under the limit', async () => {
      // Make 4 requests (under the limit of 5)
      for (let i = 0; i < 4; i++) {
        const result = await rateLimitService.isRateLimited({
          namespace: testNamespace,
          max: testMax,
          window: testWindow,
          id: testId,
        });
        expect(result.isLimited).to.be.false;
        expect(result.remaining).to.equal(testMax - i - 1);
      }
    });

    it('should block requests over the limit', async () => {
      // Make 5 requests (at the limit)
      for (let i = 0; i < testMax; i++) {
        await rateLimitService.isRateLimited({
          namespace: testNamespace,
          max: testMax,
          window: testWindow,
          id: testId,
        });
      }

      // Next request should be limited
      const result = await rateLimitService.isRateLimited({
        namespace: testNamespace,
        max: testMax,
        window: testWindow,
        id: testId,
      });

      expect(result.isLimited).to.be.true;
      expect(result.remaining).to.equal(0);
    });

    it('should respect the time window', async () => {
      // Set up a mock for Date.now()
      const now = Date.now();
      const realDateNow = Date.now.bind(global.Date);
      global.Date.now = jest.fn(() => now);

      // Make requests to reach the limit
      for (let i = 0; i < testMax; i++) {
        await rateLimitService.isRateLimited({
          namespace: testNamespace,
          max: testMax,
          window: testWindow,
          id: testId,
        });
      }

      // Move time forward to just before the window expires
      global.Date.now = jest.fn(() => now + (testWindow * 1000 - 1000));
      
      // Should still be limited
      let result = await rateLimitService.isRateLimited({
        namespace: testNamespace,
        max: testMax,
        window: testWindow,
        id: testId,
      });
      expect(result.isLimited).to.be.true;

      // Move time forward past the window
      global.Date.now = jest.fn(() => now + (testWindow * 1000 + 1000));
      
      // Should no longer be limited
      result = await rateLimitService.isRateLimited({
        namespace: testNamespace,
        max: testMax,
        window: testWindow,
        id: testId,
      });
      expect(result.isLimited).to.be.false;

      // Restore the original Date.now
      global.Date.now = realDateNow;
    });
  });

  describe('middleware', () => {
    it('should set rate limit headers', async () => {
      const req = { ip: '127.0.0.1' };
      const res = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = rateLimitService.middleware({
        namespace: testNamespace,
        max: testMax,
        window: testWindow,
      });

      await middleware(req, res, next);

      // Check that the rate limit headers were set
      expect(res.set).toHaveBeenCalledWith('X-RateLimit-Limit', testMax.toString());
      expect(res.set).toHaveBeenCalledWith('X-RateLimit-Remaining', (testMax - 1).toString());
      // Use a more specific expectation for the reset timestamp
      const resetCall = res.set.mock.calls.find(call => call[0] === 'X-RateLimit-Reset');
      expect(resetCall).toBeDefined();
      expect(Number(resetCall[1])).toBeGreaterThan(0);
      
      // Should call next() when not rate limited
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should return 429 when rate limited', async () => {
      const req = { ip: '127.0.0.1' };
      const res = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = rateLimitService.middleware({
        namespace: testNamespace,
        max: 0, // Set max to 0 to force rate limiting
        window: testWindow,
        errorMessage: 'Custom error message',
      });

      await middleware(req, res, next);

      // Should not call next() when rate limited
      expect(next).toHaveBeenCalledTimes(0);
      
      // Should set status to 429
      expect(res.status).toHaveBeenCalledWith(429);
      
      // Should include the custom error message
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Custom error message',
          retryAfter: expect.any(Number),
        },
      });
    });
  });

  describe('getStatus', () => {
    it('should return null when no rate limit exists', async () => {
      const status = await rateLimitService.getStatus('nonexistent', 'id');
      expect(status).to.be.null;
    });

    it('should return the current rate limit status', async () => {
      // Make a request to create a rate limit
      await rateLimitService.isRateLimited({
        namespace: testNamespace,
        max: testMax,
        window: testWindow,
        id: testId,
      });

      const status = await rateLimitService.getStatus(testNamespace, testId);
      
      expect(status).to.include({
        current: 1,
        remaining: testMax - 1,
        max: testMax,
        window: testWindow,
      });
      expect(status?.reset).to.be.a('number');
    });
  });
});
