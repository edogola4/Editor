import Redis from 'ioredis';
import { logger } from './LoggingService.js';
import { v4 as uuidv4 } from 'uuid';

interface RateLimitOptions {
  // Unique identifier for the rate limit (e.g., 'email:reset-password')
  namespace: string;
  // Maximum number of operations allowed within the time window
  max: number;
  // Time window in seconds
  window: number;
  // Unique identifier for the subject (e.g., user ID, IP address)
  id?: string;
  // Custom error message when rate limit is exceeded
  errorMessage?: string;
  // Whether to log rate limit events
  log?: boolean;
}

export class RateLimitService {
  private redis: Redis;
  private static instance: RateLimitService;

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: 'rate-limit:',
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error in RateLimitService:', error);
    });
  }

  public static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  /**
   * Check if a rate limit has been exceeded
   * @returns true if the rate limit is exceeded, false otherwise
   */
  public async isRateLimited(options: RateLimitOptions): Promise<{ isLimited: boolean; remaining: number; reset: number }> {
    const { namespace, max, window, id = 'global', errorMessage, log = true } = options;
    const key = `${namespace}:${id}`;
    const now = Math.floor(Date.now() / 1000);
    
    try {
      // Start a Redis transaction
      const multi = this.redis.multi();
      
      // Add the current timestamp to the sorted set
      const member = `${now}:${uuidv4()}`; // Unique member to handle concurrent requests
      multi.zadd(key, now, member);
      
      // Set expiration on the key (window + 1 second to handle edge cases)
      multi.expire(key, window + 1);
      
      // Get all members within the current time window
      multi.zremrangebyscore(key, 0, now - window);
      multi.zcard(key);
      
      const results = await multi.exec();
      
      if (!results) {
        throw new Error('Failed to execute Redis transaction');
      }
      
      // The last result is the count of operations in the current window
      const count = results[results.length - 1][1] as number;
      const remaining = Math.max(0, max - count);
      const reset = now + window;
      
      if (log && count > max) {
        logger.warn(`Rate limit exceeded: ${namespace} (${id}) - ${count} requests in ${window}s`, {
          namespace,
          id,
          count,
          max,
          window,
          remaining,
          reset,
        });
      }
      
      return {
        isLimited: count > max,
        remaining,
        reset,
      };
    } catch (error) {
      logger.error('Error checking rate limit:', error, { namespace, id });
      // In case of Redis failure, we don't want to block requests
      // This is a security vs. availability trade-off
      return {
        isLimited: false,
        remaining: max,
        reset: now + window,
      };
    }
  }

  /**
   * Middleware for Express routes
   */
  public middleware(options: Omit<RateLimitOptions, 'id'> & { id?: (req: any) => string }) {
    return async (req: any, res: any, next: any) => {
      const id = options.id ? options.id(req) : req.ip;
      
      const { isLimited, remaining, reset } = await this.isRateLimited({
        ...options,
        id,
      });
      
      // Set rate limit headers (RFC 6585)
      res.set('X-RateLimit-Limit', options.max.toString());
      res.set('X-RateLimit-Remaining', Math.max(0, remaining).toString());
      res.set('X-RateLimit-Reset', reset.toString());
      
      if (isLimited) {
        const retryAfter = Math.ceil((reset * 1000 - Date.now()) / 1000);
        res.set('Retry-After', retryAfter.toString());
        
        const message = options.errorMessage || 'Too many requests, please try again later.';
        
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message,
            retryAfter,
          },
        });
      }
      
      next();
    };
  }

  /**
   * Get the current rate limit status
   */
  public async getStatus(namespace: string, id: string): Promise<{
    current: number;
    remaining: number;
    reset: number;
    max: number;
    window: number;
  } | null> {
    const key = `${namespace}:${id}`;
    const now = Math.floor(Date.now() / 1000);
    
    try {
      // Get the time window from the TTL
      const ttl = await this.redis.ttl(key);
      if (ttl < 0) return null;
      
      const window = ttl;
      const reset = now + ttl;
      
      // Get the count of operations in the current window
      const count = await this.redis.zcount(key, now - window, now);
      
      // Get the max value from the key pattern
      const max = await this.getMaxForNamespace(namespace) || 60; // Default to 60 if not found
      
      return {
        current: count,
        remaining: Math.max(0, max - count),
        reset,
        max,
        window,
      };
    } catch (error) {
      logger.error('Error getting rate limit status:', error, { namespace, id });
      return null;
    }
  }

  /**
   * Helper method to get the max value for a namespace
   */
  private async getMaxForNamespace(namespace: string): Promise<number | null> {
    // This is a simplified example - in a real application, you might store
    // rate limit configurations in Redis or another configuration store
    const limits: Record<string, number> = {
      'api:auth:login': 10,          // 10 login attempts per window
      'api:auth:register': 5,        // 5 registration attempts per window
      'email:reset-password': 5,     // 5 password reset emails per day
      'email:verification': 3,       // 3 verification emails per hour
      'api:public': 100,             // 100 requests per minute for public endpoints
      'api:authenticated': 1000,     // 1000 requests per minute for authenticated users
    };
    
    return limits[namespace] || null;
  }
}

export default RateLimitService.getInstance();
