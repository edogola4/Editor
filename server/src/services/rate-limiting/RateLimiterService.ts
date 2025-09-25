import { RateLimiterRedis } from 'rate-limiter-flexible';
import { createClient } from 'redis';
import { config } from '../../../config/config';
import { logger } from '../../utils/logger';

export class RateLimiterService {
  private static instance: RateLimiterService;
  private limiters: Map<string, RateLimiterRedis> = new Map();
  private redisClient: any;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create Redis client
      this.redisClient = createClient({
        url: config.redis.url,
      });

      await this.redisClient.connect();
      logger.info('Rate limiter Redis client connected');

      // Initialize default limiters
      this.initializeDefaultLimiters();

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize rate limiter:', error);
      throw error;
    }
  }

  private initializeDefaultLimiters(): void {
    // Global message rate limiter (per user)
    this.createLimiter('message:global', {
      points: 30, // 30 messages
      duration: 60, // per 60 seconds
      keyPrefix: 'rl_message_global',
    });

    // Room join/leave rate limiter
    this.createLimiter('room:join', {
      points: 20, // 20 joins
      duration: 300, // per 5 minutes
      keyPrefix: 'rl_room_join',
    });

    // Code update rate limiter (per room)
    this.createLimiter('code:update', {
      points: 100, // 100 updates
      duration: 10, // per 10 seconds
      keyPrefix: 'rl_code_update',
    });

    // Authentication rate limiter
    this.createLimiter('auth', {
      points: 5, // 5 attempts
      duration: 300, // per 5 minutes
      keyPrefix: 'rl_auth',
    });
  }

  public createLimiter(
    name: string,
    options: {
      points: number;
      duration: number;
      keyPrefix: string;
      blockDuration?: number;
    }
  ): RateLimiterRedis {
    if (this.limiters.has(name)) {
      return this.limiters.get(name)!;
    }

    const limiter = new RateLimiterRedis({
      storeClient: this.redisClient,
      points: options.points,
      duration: options.duration,
      keyPrefix: options.keyPrefix,
      blockDuration: options.blockDuration || 0, // Block for the rest of the duration by default
    });

    this.limiters.set(name, limiter);
    return limiter;
  }

  public getLimiter(name: string): RateLimiterRedis | undefined {
    return this.limiters.get(name);
  }

  public async consume(
    limiterName: string,
    key: string,
    points = 1
  ): Promise<{ success: boolean; remainingPoints: number; msBeforeNext: number }> {
    if (!this.isInitialized) {
      throw new Error('Rate limiter not initialized');
    }

    const limiter = this.limiters.get(limiterName);
    if (!limiter) {
      throw new Error(`Limiter '${limiterName}' not found`);
    }

    try {
      const res = await limiter.consume(key, points);
      return {
        success: true,
        remainingPoints: res.remainingPoints,
        msBeforeNext: res.msBeforeNext,
      };
    } catch (error: any) {
      if (error instanceof Error) {
        throw error;
      }
      
      // RateLimiterRes error
      return {
        success: false,
        remainingPoints: 0,
        msBeforeNext: error.msBeforeNext,
      };
    }
  }

  public async getRemainingPoints(limiterName: string, key: string): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('Rate limiter not initialized');
    }

    const limiter = this.limiters.get(limiterName);
    if (!limiter) {
      throw new Error(`Limiter '${limiterName}' not found`);
    }

    const res = await limiter.get(key);
    return res?.remainingPoints || 0;
  }

  public async deleteKey(limiterName: string, key: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Rate limiter not initialized');
    }

    const limiter = this.limiters.get(limiterName);
    if (!limiter) {
      throw new Error(`Limiter '${limiterName}' not found`);
    }

    return limiter.delete(key);
  }

  public async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.isInitialized = false;
      this.limiters.clear();
      logger.info('Rate limiter Redis client disconnected');
    }
  }
}

export const rateLimiter = RateLimiterService.getInstance();
