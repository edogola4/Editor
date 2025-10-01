import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { CustomError } from '../utils/errors';
import { authenticate, authorize as authz } from './auth';

type AuthorizeOptions = {
  resource?: string;
  action?: string;
  role?: string;
};

/**
 * Middleware to validate request using express-validator
 * @param validations Array of validation chains
 * @returns Middleware function
 */
export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const error = new CustomError('Validation failed', 400, {
      errors: errors.array(),
    });
    next(error);
  };
};

/**
 * Middleware to authorize user based on resource and action
 * @param options Authorization options
 * @returns Middleware function
 */
export const authorize = (options: string | AuthorizeOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // If options is a string, treat it as a role
    if (typeof options === 'string') {
      return authz([options])(req, res, next);
    }

    // Check for resource and action based authorization
    const { resource, action, role } = options as AuthorizeOptions;
    
    if (role) {
      return authz([role])(req, res, next);
    }

    if (!req.user) {
      return next(new CustomError('Authentication required', 401));
    }

    // Check if user is admin (bypass all other checks)
    if (req.user.role === 'admin') {
      return next();
    }

    // Check resource-based permissions
    if (resource && action) {
      // This is a simplified example - you would typically check against user permissions
      const hasPermission = req.user.permissions?.[resource]?.includes(action);
      if (!hasPermission) {
        return next(new CustomError('Insufficient permissions', 403));
      }
    }

    next();
  };
};

/**
 * Error handling middleware
 */
export const errorHandler = (
  err: Error | CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack }),
  });
};

/**
 * Middleware to handle 404 Not Found
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Middleware to handle async route handlers
 * @param fn Async route handler function
 * @returns Wrapped route handler with error handling
 */
export const asyncHandler = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export { authenticate } from './auth';

// Re-export validation middleware
export * from './validation';

// Re-export room validation
export * from './room.validation';
