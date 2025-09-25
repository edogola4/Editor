import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { logger } from '../../utils/logger';

export class RedisAdapterService {
  private static instance: RedisAdapterService;
  private pubClient: any;
  private subClient: any;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): RedisAdapterService {
    if (!RedisAdapterService.instance) {
      RedisAdapterService.instance = new RedisAdapterService();
    }
    return RedisAdapterService.instance;
  }

  public async initialize(redisUrl: string): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Redis adapter is already initialized');
      return;
    }

    try {
      // Create Redis clients
      this.pubClient = createClient({ url: redisUrl });
      this.subClient = this.pubClient.duplicate();

      // Handle connection events
      await Promise.all([
        new Promise((resolve, reject) => {
          this.pubClient.on('connect', () => {
            logger.info('Redis pub client connected');
            resolve(true);
          });
          this.pubClient.on('error', (err: Error) => {
            logger.error('Redis pub client error:', err);
            reject(err);
          });
        }),
        new Promise((resolve, reject) => {
          this.subClient.on('connect', () => {
            logger.info('Redis sub client connected');
            resolve(true);
          });
          this.subClient.on('error', (err: Error) => {
            logger.error('Redis sub client error:', err);
            reject(err);
          });
        })
      ]);

      await this.pubClient.connect();
      await this.subClient.connect();

      this.isInitialized = true;
      logger.info('Redis adapter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Redis adapter:', error);
      throw error;
    }
  }

  public attachToServer(io: Server): void {
    if (!this.isInitialized) {
      throw new Error('Redis adapter is not initialized. Call initialize() first.');
    }

    io.adapter(createAdapter(this.pubClient, this.subClient));
    logger.info('Redis adapter attached to Socket.IO server');
  }

  public async close(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await Promise.all([
        this.pubClient.quit(),
        this.subClient.quit()
      ]);
      this.isInitialized = false;
      logger.info('Redis adapter connections closed');
    } catch (error) {
      logger.error('Error closing Redis connections:', error);
      throw error;
    }
  }

  public getPubClient() {
    if (!this.isInitialized) {
      throw new Error('Redis adapter is not initialized');
    }
    return this.pubClient;
  }

  public getSubClient() {
    if (!this.isInitialized) {
      throw new Error('Redis adapter is not initialized');
    }
    return this.subClient;
  }
}
