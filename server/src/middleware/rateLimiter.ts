import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../services/RedisClient';
import { TooManyRequestsError } from '../utils/errors';

// Rate limiting configuration
const rateLimiter = new RateLimiterRedis({
  storeClient: redis.redis,
  keyPrefix: 'rate_limit',
  points: 100, // 100 requests
  duration: 60, // per 60 seconds by IP
  blockDuration: 60 * 5, // Block for 5 minutes if limit is exceeded
});

// Rate limiting middleware for API endpoints
export const apiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  
  rateLimiter.consume(clientIp)
    .then(() => {
      next();
    })
    .catch(() => {
      next(new TooManyRequestsError('Too many requests, please try again later.'));
    });
};

// Rate limiting for WebSocket connections
export const wsRateLimiter = async (socket: any, next: (err?: Error) => void) => {
  try {
    const clientIp = socket.handshake.address || 'unknown';
    await rateLimiter.consume(`ws:${clientIp}`);
    next();
  } catch (error) {
    next(new Error('Too many WebSocket connection attempts. Please try again later.'));
  }
};

// Rate limiting for document operations
export const documentOperationLimiter = new RateLimiterRedis({
  storeClient: redis.redis,
  keyPrefix: 'doc_op_limit',
  points: 300, // 300 operations
  duration: 60, // per 60 seconds per document per user
  blockDuration: 60 * 5, // Block for 5 minutes if limit is exceeded
});

export const checkDocumentOperationLimit = async (userId: string, documentId: string) => {
  const key = `doc:${documentId}:user:${userId}`;
  try {
    await documentOperationLimiter.consume(key);
    return { allowed: true };
  } catch (error) {
    return { 
      allowed: false, 
      retryAfter: error.msBeforeNext / 1000, // Convert to seconds
      message: 'Too many operations. Please slow down.'
    };
  }
};
