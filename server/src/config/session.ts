import session from 'express-session';
import { Redis } from 'ioredis';
import { RedisStore } from 'connect-redis';
import { config } from './config.js';
import { RequestHandler } from 'express';
import { redis } from './redis.js';

// Initialize Redis store
const redisStore = new (RedisStore as any)({
  client: redis as any,
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

// Initialize Redis client (already handled by redis.ts)
const initializeRedis = async (): Promise<void> => {
  // Redis is already initialized in redis.ts
  console.log('Redis client is ready for sessions');
};

// Graceful shutdown
const shutdownRedis = async (): Promise<void> => {
  // Redis client will be closed by the main process
  console.log('Redis client shutdown initiated for sessions');
};

export { sessionConfig, initializeRedis, shutdownRedis, redis };
