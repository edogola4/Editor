import { Redis, type RedisOptions } from 'ioredis';
import { testConnection } from './database';

// Redis connection options
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
      return true; // Reconnect on READONLY errors
    }
    return false;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
};

// Create and export the Redis client
export const redisClient = new Redis(redisOptions);

// Connection event handlers
redisClient.on('connect', () => {
  console.log('✅ Redis client connected');  
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('error', (error) => {
  console.error('❌ Redis error:', error);
});

redisClient.on('reconnecting', (delay) => {
  console.log(`🔄 Redis reconnecting in ${delay}ms`);
});

redisClient.on('end', () => {
  console.log('❌ Redis connection closed');
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down Redis connection...');
  try {
    await redisClient.quit();
    console.log('Redis connection closed gracefully');
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  } finally {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Test the connection on startup
const testConnection = async () => {
  try {
    await redisClient.ping();
    console.log('Redis connection test successful');
  } catch (error) {
    console.error('Redis connection test failed:', error);
    process.exit(1);
  }
};

testConnection().catch(console.error);

export { redisOptions };
