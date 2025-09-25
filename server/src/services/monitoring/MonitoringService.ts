import { createClient } from 'redis';
import { config } from '../../../config/config';
import { logger } from '../../utils/logger';

type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

interface MetricOptions {
  type: MetricType;
  name: string;
  help?: string;
  labelNames?: string[];
  buckets?: number[];
  percentiles?: number[];
}

export class MonitoringService {
  private static instance: MonitoringService;
  private redisClient: any;
  private metrics: Map<string, any> = new Map();
  private isInitialized = false;
  private readonly METRIC_PREFIX = 'monitor:metrics:';
  private readonly AGGREGATION_INTERVAL = 60000; // 1 minute in ms
  private aggregationInterval?: NodeJS.Timeout;

  private constructor() {}

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create Redis client
      this.redisClient = createClient({
        url: config.redis.url,
      });

      await this.redisClient.connect();
      logger.info('Monitoring service Redis client connected');

      // Initialize default metrics
      this.initializeDefaultMetrics();

      // Start background tasks
      this.startBackgroundTasks();

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize monitoring service:', error);
      throw error;
    }
  }

  private initializeDefaultMetrics(): void {
    // Connection metrics
    this.registerMetric({
      type: 'counter',
      name: 'socket_connections_total',
      help: 'Total number of socket connections',
      labelNames: ['status'],
    });

    // Room metrics
    this.registerMetric({
      type: 'gauge',
      name: 'rooms_active',
      help: 'Number of active rooms',
    });

    this.registerMetric({
      type: 'counter',
      name: 'room_joins_total',
      help: 'Total number of room join events',
      labelNames: ['room_id'],
    });

    // Message metrics
    this.registerMetric({
      type: 'counter',
      name: 'messages_sent_total',
      help: 'Total number of messages sent',
      labelNames: ['room_id', 'type'],
    });

    // Code edit metrics
    this.registerMetric({
      type: 'counter',
      name: 'code_edits_total',
      help: 'Total number of code edits',
      labelNames: ['room_id'],
    });

    // Error metrics
    this.registerMetric({
      type: 'counter',
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'source'],
    });

    // Performance metrics
    this.registerMetric({
      type: 'histogram',
      name: 'request_duration_seconds',
      help: 'Request duration in seconds',
      labelNames: ['endpoint', 'method', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });
  }

  private startBackgroundTasks(): void {
    // Aggregate metrics periodically
    this.aggregationInterval = setInterval(
      () => this.aggregateMetrics(),
      this.AGGREGATION_INTERVAL
    );
  }

  private async aggregateMetrics(): Promise<void> {
    try {
      // In a real implementation, you would aggregate metrics here
      // For example, calculate averages, percentiles, etc.
      // and store them for historical analysis
      logger.debug('Aggregating metrics...');
    } catch (error) {
      logger.error('Error aggregating metrics:', error);
    }
  }

  public registerMetric(options: MetricOptions): void {
    if (this.metrics.has(options.name)) {
      logger.warn(`Metric ${options.name} already registered`);
      return;
    }

    this.metrics.set(options.name, {
      ...options,
      values: new Map(),
    });
  }

  public async increment(
    name: string,
    labels: Record<string, string> = {},
    value: number = 1
  ): Promise<void> {
    try {
      const metric = this.metrics.get(name);
      if (!metric) {
        logger.warn(`Metric ${name} not found`);
        return;
      }

      if (metric.type !== 'counter') {
        logger.warn(`Cannot increment non-counter metric: ${name}`);
        return;
      }

      const labelString = this.serializeLabels(labels);
      const key = `${this.METRIC_PREFIX}${name}${labelString}`;
      
      await this.redisClient.incrByFloat(key, value);
      
      // Set expiration to 1 day if this is a new key
      await this.redisClient.expire(key, 86400, 'NX');
    } catch (error) {
      logger.error(`Error incrementing metric ${name}:`, error);
    }
  }

  public async set(
    name: string,
    value: number,
    labels: Record<string, string> = {}
  ): Promise<void> {
    try {
      const metric = this.metrics.get(name);
      if (!metric) {
        logger.warn(`Metric ${name} not found`);
        return;
      }

      if (metric.type !== 'gauge') {
        logger.warn(`Cannot set non-gauge metric: ${name}`);
        return;
      }

      const labelString = this.serializeLabels(labels);
      const key = `${this.METRIC_PREFIX}${name}${labelString}`;
      
      await this.redisClient.set(key, value.toString());
      
      // Set expiration to 1 day if this is a new key
      await this.redisClient.expire(key, 86400, 'NX');
    } catch (error) {
      logger.error(`Error setting metric ${name}:`, error);
    }
  }

  public async observe(
    name: string,
    value: number,
    labels: Record<string, string> = {}
  ): Promise<void> {
    try {
      const metric = this.metrics.get(name);
      if (!metric) {
        logger.warn(`Metric ${name} not found`);
        return;
      }

      if (!['histogram', 'summary'].includes(metric.type)) {
        logger.warn(`Cannot observe value for non-histogram/summary metric: ${name}`);
        return;
      }

      const timestamp = Date.now();
      const labelString = this.serializeLabels(labels);
      const key = `${this.METRIC_PREFIX}${name}${labelString}:${timestamp}`;
      
      await this.redisClient.set(key, value.toString());
      
      // Set expiration to 1 day
      await this.redisClient.expire(key, 86400);
    } catch (error) {
      logger.error(`Error observing value for metric ${name}:`, error);
    }
  }

  public async getMetric(name: string, labels: Record<string, string> = {}): Promise<number | null> {
    try {
      const labelString = this.serializeLabels(labels);
      const key = `${this.METRIC_PREFIX}${name}${labelString}`;
      
      const value = await this.redisClient.get(key);
      return value ? parseFloat(value) : null;
    } catch (error) {
      logger.error(`Error getting metric ${name}:`, error);
      return null;
    }
  }

  public async getMetrics(): Promise<Record<string, any>> {
    try {
      const result: Record<string, any> = {};
      
      for (const [name, metric] of this.metrics.entries()) {
        const keys = await this.redisClient.keys(`${this.METRIC_PREFIX}${name}*`);
        
        if (keys.length === 0) continue;
        
        result[name] = {
          ...metric,
          values: {},
        };
        
        for (const key of keys) {
          // Skip timestamped keys (used for histograms/summaries)
          if (key.includes(':')) continue;
          
          const labelString = key
            .replace(`${this.METRIC_PREFIX}${name}`, '')
            .replace(/^\{/, '')
            .replace(/\}$/, '');
            
          const labels: Record<string, string> = {};
          
          if (labelString) {
            labelString.split(',').forEach(pair => {
              const [key, value] = pair.split('=');
              labels[key] = value.replace(/"/g, '');
            });
          }
          
          const value = await this.redisClient.get(key);
          
          if (Object.keys(labels).length > 0) {
            const labelKey = JSON.stringify(labels);
            result[name].values[labelKey] = parseFloat(value) || 0;
          } else {
            result[name].value = parseFloat(value) || 0;
          }
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Error getting metrics:', error);
      return {};
    }
  }

  public async trackError(error: Error, context: Record<string, any> = {}): Promise<void> {
    try {
      const errorId = `error:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
      const errorData = {
        id: errorId,
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        ...context,
      };

      // Store error details in Redis with 7-day expiration
      await this.redisClient.set(
        `monitor:errors:${errorId}`, 
        JSON.stringify(errorData),
        { EX: 7 * 24 * 60 * 60 } // 7 days
      );

      // Increment error counter
      await this.increment('errors_total', { 
        type: error.name || 'Error',
        source: context.source || 'unknown',
      });

      logger.error(`Error tracked: ${errorId}`, { error, context });
    } catch (logError) {
      logger.error('Failed to track error:', logError);
    }
  }

  public async trackEvent(eventName: string, properties: Record<string, any> = {}): Promise<void> {
    try {
      const eventId = `event:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
      const eventData = {
        id: eventId,
        name: eventName,
        timestamp: new Date().toISOString(),
        ...properties,
      };

      // Store event in Redis with 1-day expiration
      await this.redisClient.set(
        `monitor:events:${eventId}`,
        JSON.stringify(eventData),
        { EX: 24 * 60 * 60 } // 1 day
      );

      logger.info(`Event tracked: ${eventName}`, eventData);
    } catch (error) {
      logger.error('Failed to track event:', error);
    }
  }

  private serializeLabels(labels: Record<string, string>): string {
    if (Object.keys(labels).length === 0) return '';
    
    const labelStrings = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`);
      
    return `{${labelStrings.join(',')}}`;
  }

  public async close(): Promise<void> {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    
    if (this.redisClient) {
      await this.redisClient.quit();
      this.isInitialized = false;
      logger.info('Monitoring service Redis client disconnected');
    }
  }
}

export const monitoringService = MonitoringService.getInstance();
