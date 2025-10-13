import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { redisClient } from '../utils/redis';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { validationResult } from 'express-validator';
import { sanitize } from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Redis-based rate limiter for stricter limits
let redisRateLimiter: RateLimiterRedis | null = null;

if (redisClient) {
  redisRateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rate_limit',
    points: 200, // 200 requests
    duration: 60, // per 60 seconds by IP
    blockDuration: 60 * 5, // block for 5 minutes if exceeded
  });
}

// Apply security headers
const securityHeaders = [
  helmet(),
  helmet.hsts({
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  }),
  helmet.frameguard({ action: 'deny' }),
  helmet.xssFilter(),
  helmet.noSniff(),
  helmet.ieNoOpen(),
  helmet.referrerPolicy({ policy: 'same-origin' }),
  // Content Security Policy
  (req: Request, res: Response, next: NextFunction) => {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com data:",
      "connect-src 'self' ws: wss: https://api.github.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'"
    ];

    res.setHeader('Content-Security-Policy', csp.join('; '));
    next();
  }
];

// Prevent HTTP Parameter Pollution
const httpParamProtection = hpp({
  whitelist: [
    'page',
    'limit',
    'sort',
    'fields'
  ]
});

// Sanitize request data
const sanitizeInput = [
  // Sanitize request body, query, and params
  sanitize(),
  
  // Prevent XSS attacks
  xss(),
  
  // Sanitize user input
  (req: Request, res: Response, next: NextFunction) => {
    // Sanitize request body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }
    
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = (req.query[key] as string).trim();
        }
      });
    }
    
    next();
  }
];

// Validate request
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      status: 'error',
      errors: errors.array()
    });
  }
  next();
};

// Rate limiting middleware
const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  if (!redisRateLimiter) {
    return next();
  }

  try {
    const clientIp = req.ip || req.connection.remoteAddress || '';
    const rateLimitKey = `rate_limit:${clientIp}`;
    
    await redisRateLimiter.consume(rateLimitKey);
    next();
  } catch (error) {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later.'
    });
  }
};

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    /.*\.yourdomain\.com$/
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token'
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export {
  securityHeaders,
  httpParamProtection,
  sanitizeInput,
  validateRequest,
  rateLimiter,
  apiLimiter,
  corsOptions
};
