import { Request } from 'express';
import { LogLevel, LogType } from '../models/Log.js';

// Interface for log entry
interface User {
  id?: string;
  email?: string;
  username?: string;
}

interface LogEntry {
  level: LogLevel;
  type: LogType;
  message: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

export class LoggingService {
  private static instance: LoggingService;
  
  private constructor() {}

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Log an information message
   */
  public async info(
    message: string, 
    type: LogType, 
    req?: Request,
    metadata?: Record<string, any>
  ) {
    return this.log({
      level: LogLevel.INFO,
      type,
      message,
      ...this.extractRequestData(req),
      metadata
    });
  }

  /**
   * Log a warning message
   */
  public async warn(
    message: string, 
    type: LogType, 
    req?: Request,
    metadata?: Record<string, any>
  ) {
    return this.log({
      level: LogLevel.WARNING,
      type,
      message,
      ...this.extractRequestData(req),
      metadata
    });
  }

  /**
   * Log an error message
   */
  public async error(
    message: string, 
    type: LogType, 
    error?: Error,
    req?: Request,
    metadata?: Record<string, any>
  ) {
    return this.log({
      level: LogLevel.ERROR,
      type,
      message,
      error,
      ...this.extractRequestData(req),
      metadata: {
        ...metadata,
        ...(error ? { 
          errorName: error.name,
          errorMessage: error.message,
          stack: error.stack 
        } : {})
      }
    });
  }

  /**
   * Log a security-related event
   */
  public async security(
    message: string, 
    type: LogType,
    req?: Request,
    metadata?: Record<string, any>
  ) {
    return this.log({
      level: LogLevel.SECURITY,
      type,
      message,
      ...this.extractRequestData(req),
      metadata
    });
  }

  /**
   * Log a debug message
   */
  public async debug(
    message: string, 
    type: LogType,
    req?: Request,
    metadata?: Record<string, any>
  ) {
    if (process.env.NODE_ENV !== 'production') {
      return this.log({
        level: LogLevel.DEBUG,
        type,
        message,
        ...this.extractRequestData(req),
        metadata
      });
    }
  }

  /**
   * Internal method to handle the actual logging
   */
  private async log(entry: LogEntry) {
    try {
      const logData = {
        level: entry.level,
        type: entry.type,
        message: entry.message,
        userId: entry.userId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        metadata: entry.metadata || {},
        error: entry.error ? {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack
        } : null
      };

      // Log to console in development
      if (process.env.NODE_ENV !== 'production') {
        const timestamp = new Date().toISOString();
        const levelStr = `[${entry.level.toUpperCase()}]`.padEnd(10);
        const typeStr = `[${entry.type}]`.padEnd(20);
        console.log(`${timestamp} ${levelStr} ${typeStr} ${entry.message}`);
        
        if (entry.error) {
          console.error(entry.error);
        }
      }

      // Log to console for now
      const timestamp = new Date().toISOString();
      const levelStr = `[${logData.level.toUpperCase()}]`.padEnd(10);
      const typeStr = `[${logData.type}]`.padEnd(20);
      console.log(`${timestamp} ${levelStr} ${typeStr} ${logData.message}`);
      
      if (logData.error) {
        console.error(logData.error);
      }
      
      // TODO: Add external logging service integration (e.g., Sentry, Loggly)
      
    } catch (error) {
      console.error('Failed to log event:', error);
      // Fallback to console if database logging fails
      console.error('Original log entry:', JSON.stringify(entry, null, 2));
    }
  }

  /**
   * Extract relevant data from the request object
   */
  private extractRequestData(req?: Request) {
    if (!req) return {};

    return {
      userId: (req.user as User)?.id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };
  }

  /**
   * Log user login event
   */
  public async logLogin(userId: string, req: Request, isSuccessful: boolean) {
    return this.security(
      `User ${isSuccessful ? 'logged in successfully' : 'failed login attempt'}`,
      'AUTHENTICATION',
      req,
      { userId, isSuccessful }
    );
  }

  /**
   * Log user logout event
   */
  public async logLogout(userId: string, req: Request) {
    return this.security(
      'User logged out',
      'AUTHENTICATION',
      req,
      { userId }
    );
  }

  /**
   * Log password reset request
   */
  public async logPasswordResetRequest(userId: string, req: Request) {
    return this.security(
      'Password reset requested',
      'AUTHENTICATION',
      req,
      { userId }
    );
  }

  /**
   * Log password change
   */
  public async logPasswordChange(userId: string, req: Request) {
    return this.security(
      'Password changed',
      'AUTHENTICATION',
      req,
      { userId }
    );
  }

  /**
   * Log role/permission changes
   */
  public async logRoleChange(
    targetUserId: string, 
    newRole: string, 
    changedBy: string, 
    req: Request
  ) {
    return this.security(
      `User role changed to ${newRole}`,
      'AUTHORIZATION',
      req,
      { targetUserId, newRole, changedBy }
    );
  }

  /**
   * Log access denied events
   */
  public async logAccessDenied(
    userId: string, 
    resource: string, 
    action: string, 
    req: Request
  ) {
    return this.security(
      `Access denied: ${action} on ${resource}`,
      'AUTHORIZATION',
      req,
      { userId, resource, action }
    );
  }

  /**
   * Log system events
   */
  public async logSystemEvent(
    message: string, 
    type: LogType = 'SYSTEM',
    metadata?: Record<string, any>
  ) {
    return this.log({
      level: LogLevel.INFO,
      type,
      message,
      metadata
    });
  }
}

export const logger = LoggingService.getInstance();

export default logger;
