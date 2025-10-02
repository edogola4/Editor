import { createClient, RedisClientType } from 'redis';
import { promisify } from 'util';

let redisClient: RedisClientType;

beforeAll(async () => {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });
  await redisClient.connect();
  // Clear all test data
  await redisClient.flushAll();
});

afterAll(async () => {
  await redisClient.quit();
});

export const getTestRedisClient = (): RedisClientType => {
  return redisClient;
};

// Helper function to wait for a short time for async operations
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
