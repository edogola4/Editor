import { Redis, RedisOptions } from 'ioredis';
import { config } from 'dotenv';

config();

export class RedisClient {
  private static instance: Redis;
  private static pub: Redis;
  private static sub: Redis;

  private constructor() {}

  public static getInstance(): { redis: Redis; pub: Redis; sub: Redis } {
    if (!RedisClient.instance) {
      const redisOptions: RedisOptions = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            console.log('Redis connection error, attempting to reconnect...');
            return true;
          }
          return false;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
      };

      RedisClient.instance = new Redis(redisOptions);
      RedisClient.pub = new Redis(redisOptions);
      RedisClient.sub = new Redis(redisOptions);

      RedisClient.setupEventHandlers(RedisClient.instance, 'Redis');
      RedisClient.setupEventHandlers(RedisClient.pub, 'Redis Pub');
      RedisClient.setupEventHandlers(RedisClient.sub, 'Redis Sub');
    }

    return {
      redis: RedisClient.instance,
      pub: RedisClient.pub,
      sub: RedisClient.sub,
    };
  }

  private static setupEventHandlers(redis: Redis, name: string): void {
    redis.on('connect', () => console.log(`✅ ${name} client connected`));
    redis.on('ready', () => console.log(`✅ ${name} client ready`));
    redis.on('error', (error) => console.error(`❌ ${name} error:`, error));
    redis.on('reconnecting', (delay) => 
      console.log(`🔄 ${name} reconnecting in ${delay}ms`)
    );
    redis.on('end', () => console.log(`❌ ${name} connection closed`));
  }

  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await Promise.all([
        RedisClient.instance.quit(),
        RedisClient.pub.quit(),
        RedisClient.sub.quit(),
      ]);
      RedisClient.instance = null as any;
      RedisClient.pub = null as any;
      RedisClient.sub = null as any;
    }
  }
}

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down Redis connections...');
  await RedisClient.disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default RedisClient.getInstance();
