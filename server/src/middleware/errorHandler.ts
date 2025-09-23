import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'sequelize';
import jwt from 'jsonwebtoken';
import { CustomError } from '../utils/errors.js';

interface ErrorResponse {
  statusCode: number;
  message: string;
  errors?: any[];
  stack?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errorResponse: ErrorResponse = {
    statusCode: 500,
    message: 'Internal Server Error',
  };

  // Handle different types of errors
  if (err instanceof CustomError) {
    errorResponse.statusCode = err.statusCode;
    errorResponse.message = err.message;
  } else if (err instanceof ValidationError) {
    errorResponse.statusCode = 400;
    errorResponse.message = 'Validation Error';
    errorResponse.errors = err.errors.map((e) => ({
      message: e.message,
      type: e.type,
      path: e.path,
      value: e.value,
    }));
  } else if (err.name === 'JsonWebTokenError') {
    errorResponse.statusCode = 401;
    errorResponse.message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    errorResponse.statusCode = 401;
    errorResponse.message = 'Token expired';
  }

  // Log the error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
    errorResponse.stack = err.stack;
  }

  // Send the error response
  res.status(errorResponse.statusCode).json({
    success: false,
    message: errorResponse.message,
    errors: errorResponse.errors,
    ...(process.env.NODE_ENV === 'development' && { stack: errorResponse.stack }),
  });
};

// 404 Not Found middleware
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};
