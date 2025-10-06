import { Redis, RedisOptions } from 'ioredis';

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

const redis = new Redis(redisOptions);

// Connection event handlers
redis.on('connect', () => {
  console.log('✅ Redis client connected');  
});

redis.on('ready', () => {
  console.log('✅ Redis client ready');
});

redis.on('error', (error) => {
  console.error('❌ Redis error:', error);
});

redis.on('reconnecting', (delay) => {
  console.log(`🔄 Redis reconnecting in ${delay}ms`);
});

redis.on('end', () => {
  console.log('❌ Redis connection closed');
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down Redis connection...');
  try {
    await redis.quit();
    console.log('Redis connection closed gracefully');
    process.exit(0);
  } catch (error) {
    console.error('Error closing Redis connection:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Test the connection on startup
(async () => {
  try {
    await redis.ping();
    console.log('✅ Redis connection test successful');
  } catch (error) {
    console.error('❌ Redis connection test failed:', error);
  }
})();

export { redis, redisOptions };
