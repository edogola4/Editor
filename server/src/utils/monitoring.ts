import { Request, Response, NextFunction } from 'express';
import { performance, PerformanceObserver } from 'node:perf_hooks';
import { redisClient } from './redis';
import { logger } from './logger';

// Performance monitoring
const performanceObserver = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    if (entry.duration > 1000) { // Log slow operations (>1s)
      logger.warn(`Slow operation detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
    }
  });
});

performanceObserver.observe({ entryTypes: ['measure'] });

// Track API response times
export const trackPerformance = (req: Request, res: Response, next: NextFunction) => {
  const start = performance.now();
  const requestId = req.headers['x-request-id'] || Date.now().toString(36);
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn(`Slow request: ${method} ${originalUrl} - ${statusCode} (${duration.toFixed(2)}ms)`);
    }
    
    // Track metrics in Redis if available
    if (redisClient) {
      const key = `metrics:${method}:${originalUrl.split('?')[0]}`;
      const timestamp = Date.now();
      
      // Store request metrics
      redisClient.multi()
        .hIncrBy('api:requests:total', 'count', 1)
        .hIncrBy(`api:requests:${statusCode}`, 'count', 1)
        .zAdd('api:response_times', [
          { score: timestamp, value: `${key}:${duration}:${timestamp}` }
        ])
        .expire('api:response_times', 86400) // Keep for 24 hours
        .exec()
        .catch(err => logger.error('Error tracking metrics:', err));
    }
  });
  
  next();
};

// Memory usage monitoring
const checkMemoryUsage = () => {
  const memoryUsage = process.memoryUsage();
  const memoryUsageInMB = {
    rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
    heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
    heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
    external: (memoryUsage.external / 1024 / 1024).toFixed(2) + ' MB',
  };
  
  // Log if memory usage is high
  if (memoryUsage.heapUsed / 1024 / 1024 > 500) { // 500MB threshold
    logger.warn('High memory usage detected:', memoryUsageInMB);
  }
  
  return memoryUsageInMB;
};

// Garbage collection monitoring
if (global.gc) {
  setInterval(() => {
    const before = process.memoryUsage().heapUsed;
    global.gc!();
    const after = process.memoryUsage().heapUsed;
    const freed = (before - after) / 1024 / 1024;
    
    if (freed > 10) { // Only log if more than 10MB was collected
      logger.info(`Garbage collected: ${freed.toFixed(2)} MB`);
    }
  }, 60000); // Run every minute
}

// Track event loop lag
let lastLoop = Date.now();
const monitorEventLoop = () => {
  const now = Date.now();
  const lag = now - lastLoop - 1000; // Expected 1 second interval
  
  if (lag > 100) { // Log if lag is more than 100ms
    logger.warn(`Event loop lag detected: ${lag}ms`);
  }
  
  lastLoop = now;
  setTimeout(monitorEventLoop, 1000);
};

// Start monitoring
setInterval(checkMemoryUsage, 300000); // Check every 5 minutes
monitorEventLoop();

// Track unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Track in monitoring system
  if (redisClient) {
    redisClient.incr('errors:unhandled_rejections').catch(console.error);
  }
});

// Track uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Track in monitoring system
  if (redisClient) {
    redisClient.incr('errors:uncaught_exceptions').catch(console.error);
  }
  // Consider whether to restart the process in production
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Track process signals
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    logger.info(`Received ${signal}. Gracefully shutting down...`);
    // Perform cleanup
    process.exit(0);
  });
});

export const monitoring = {
  trackPerformance,
  checkMemoryUsage,
  performance: {
    start: (name: string) => performance.mark(`${name}-start`),
    end: (name: string) => {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
    }
  }
};
