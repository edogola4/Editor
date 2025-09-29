import { Redis } from 'ioredis';

class RedisClient {
  private static instance: Redis;
  private static subscriber: Redis;

  private constructor() {}

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      RedisClient.instance.on('error', (error) => {
        console.error('Redis error:', error);
      });

      RedisClient.instance.on('connect', () => {
        console.log('Connected to Redis');
      });
    }
    return RedisClient.instance;
  }

  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      if (RedisClient.subscriber) {
        await RedisClient.subscriber.quit();
      }
    }
  }
}

export default RedisClient;
