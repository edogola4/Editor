import winston, { Logger, format, transports } from "winston";
import path from "path";
import { fileURLToPath } from "url";
import config from "../config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom log levels for the application
 */
const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Custom colors for log levels
 */
const customColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

// Add custom colors to winston
winston.addColors(customColors);

/**
 * Custom format for structured logging
 */
const structuredFormat = format.combine(
  format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  format.errors({ stack: true }),
  format.json(),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta,
    };

    // In development, use colored output for console
    if (config.env === "development") {
      return `${timestamp} [${level.toUpperCase()}] ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
      }`;
    }

    return JSON.stringify(logEntry);
  }),
);

/**
 * Development format with colors
 */
const developmentFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : "";
    return `${timestamp} ${level}: ${message}${metaStr}`;
  }),
);

/**
 * HTTP request logging format
 */
const httpFormat = format.combine(
  format.timestamp(),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const { method, url, statusCode, responseTime, ip } = meta;
    return `${timestamp} [${level.toUpperCase()}] ${method} ${url} ${statusCode} ${responseTime}ms - ${ip}`;
  }),
);

/**
 * Create console transport
 */
const createConsoleTransport = () => {
  if (config.env === "development") {
    return new transports.Console({
      level: "debug",
      format: developmentFormat,
      handleExceptions: true,
      handleRejections: true,
    });
  }

  return new transports.Console({
    level: "info",
    format: structuredFormat,
    handleExceptions: true,
    handleRejections: true,
  });
};

/**
 * Create file transports
 */
const createFileTransports = () => {
  const transportsList: winston.transport[] = [];

  // Error log file
  transportsList.push(
    new transports.File({
      filename: path.join(__dirname, "../../logs/error.log"),
      level: "error",
      format: structuredFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      handleExceptions: true,
      handleRejections: true,
    }),
  );

  // Combined log file
  transportsList.push(
    new transports.File({
      filename: path.join(__dirname, "../../logs/combined.log"),
      format: structuredFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );

  // HTTP access log
  transportsList.push(
    new transports.File({
      filename: path.join(__dirname, "../../logs/access.log"),
      level: "http",
      format: httpFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  );

  return transportsList;
};

/**
 * Create logger instance
 */
const createLogger = (): Logger => {
  const logger = winston.createLogger({
    level: config.env === "development" ? "debug" : "info",
    levels: customLevels,
    format: structuredFormat,
    defaultMeta: {
      service: "collaborative-editor-backend",
      version: process.env.npm_package_version || "1.0.0",
      environment: config.env,
    },
    transports: [createConsoleTransport()],
  });

  // Add file transports in production or if logs directory exists
  if (config.env === "production") {
    try {
      // Ensure logs directory exists
      const fs = await import("fs");
      const logsDir = path.join(__dirname, "../../logs");

      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      logger.add(...createFileTransports());
    } catch (error) {
      logger.warn("Failed to create file transports", { error: error.message });
    }
  }

  return logger;
};

/**
 * Logger instance
 */
export const logger = createLogger();

/**
 * HTTP request logger middleware
 */
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { method, url, ip } = req;
    const { statusCode } = res;

    const logData = {
      method,
      url,
      statusCode,
      responseTime: duration,
      ip: req.ip || req.connection?.remoteAddress || "unknown",
      userAgent: req.get("User-Agent"),
      contentLength: res.get("Content-Length"),
    };

    if (statusCode >= 400) {
      logger.warn("HTTP Request", logData);
    } else {
      logger.http("HTTP Request", logData);
    }
  });

  next();
};

/**
 * Database query logger
 */
export const dbLogger = (operation: string, collection: string, data?: any) => {
  logger.debug("Database Operation", {
    operation,
    collection,
    data: data ? JSON.stringify(data) : undefined,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Authentication logger
 */
export const authLogger = (action: string, userId?: string, metadata?: any) => {
  logger.info("Authentication Event", {
    action,
    userId,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Error logger with additional context
 */
export const errorLogger = (error: Error, context?: any) => {
  logger.error("Application Error", {
    message: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Performance logger
 */
export const performanceLogger = (
  operation: string,
  duration: number,
  metadata?: any,
) => {
  logger.info("Performance Metric", {
    operation,
    duration,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Security event logger
 */
export const securityLogger = (
  event: string,
  severity: "low" | "medium" | "high" | "critical",
  metadata: any,
) => {
  const logLevel =
    severity === "critical" ? "error" : severity === "high" ? "warn" : "info";

  logger[logLevel]("Security Event", {
    event,
    severity,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

// Export all logger utilities
export default {
  logger,
  httpLogger,
  dbLogger,
  authLogger,
  errorLogger,
  performanceLogger,
  securityLogger,
};
