import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { CustomError } from '../utils/errors';

// Rate limiting options for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Only count failed requests
  keyGenerator: (req) => {
    // Use the IP address and the request path as the key
    return `${req.ip}:${req.path}`;
  },
  handler: (req, res) => {
    throw new CustomError('Too many requests, please try again later', 429);
  },
});

// Rate limiting for public API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new CustomError('Too many requests, please try again later', 429);
  },
});

// Rate limiting for sensitive operations (password reset, etc.)
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per hour
  message: 'Too many attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    throw new CustomError('Too many attempts, please try again later', 429);
  },
});

// Middleware to apply rate limiting based on route
const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Apply different rate limits based on the path
  if (req.path.startsWith('/api/auth/login') || req.path.startsWith('/api/auth/register')) {
    return authLimiter(req, res, next);
  }
  
  if (req.path.startsWith('/api/auth/forgot-password') || req.path.startsWith('/api/auth/reset-password')) {
    return sensitiveLimiter(req, res, next);
  }
  
  // Default rate limiter for other API routes
  if (req.path.startsWith('/api/')) {
    return apiLimiter(req, res, next);
  }
  
  next();
};

export { rateLimiter, authLimiter, apiLimiter, sensitiveLimiter };
