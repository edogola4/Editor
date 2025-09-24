import session from 'express-session';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';
import { config } from './config.js';
import { RequestHandler } from 'express';

// Initialize Redis client
const redisClient = createClient({
  url: config.redis.url,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 2000)
  },
});

// Initialize Redis store
const redisStore = new (RedisStore as any)({
  client: redisClient as any,
  prefix: 'sess:',
  disableTouch: false,
});

// Configure session middleware
const sessionConfig: session.SessionOptions = {
  store: redisStore as any,
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  name: config.session.name,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: config.session.cookieMaxAge,
  },
};

// Initialize Redis client
const initializeRedis = async (): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('Redis client connected');
    }
  } catch (error) {
    console.error('Redis connection error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdownRedis = async () => {
  try {
    await redisClient.quit();
    console.log('Redis client disconnected');
  } catch (error) {
    console.error('Error disconnecting Redis:', error);
  }
};

export { sessionConfig, initializeRedis, shutdownRedis, redisClient };
