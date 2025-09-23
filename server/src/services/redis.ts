import Redis from "ioredis";
import { logger } from "./utils/logger.js";
import config from "./config/config.js";

/**
 * Redis connection configuration interface
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  reconnectOnError: (error: Error) => boolean;
}

/**
 * Extended Redis client interface for type safety
 */
export interface RedisClient extends Redis {
  // Add custom methods if needed
  setex(key: string, seconds: number, value: string): Promise<string>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  del(...keys: string[]): Promise<number>;
  exists(...keys: string[]): Promise<number>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<string>;
  mget(...keys: string[]): Promise<Array<string | null>>;
  mset(...keyValues: string[]): Promise<string>;
}

/**
 * Redis service class for managing Redis connections and operations
 */
export class RedisService {
  private client: RedisClient;
  private isConnected: boolean = false;

  constructor() {
    this.client = this.createClient();
    this.initializeEventHandlers();
  }

  /**
   * Create Redis client with configuration
   */
  private createClient(): RedisClient {
    const redisConfig: RedisConfig = {
      host: config.redis.host,
      port: config.redis.port,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0", 10),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      reconnectOnError: (error: Error) => {
        logger.warn("Redis reconnect on error", { error: error.message });
        return error.message.includes("READONLY");
      },
    };

    return new Redis(redisConfig) as RedisClient;
  }

  /**
   * Initialize Redis event handlers
   */
  private initializeEventHandlers(): void {
    this.client.on("connect", () => {
      logger.info("Redis client connecting...");
    });

    this.client.on("ready", () => {
      logger.info("Redis client ready and connected");
      this.isConnected = true;
    });

    this.client.on("error", (error: Error) => {
      logger.error("Redis client error", {
        error: error.message,
        stack: error.stack,
      });
      this.isConnected = false;
    });

    this.client.on("close", () => {
      logger.warn("Redis client connection closed");
      this.isConnected = false;
    });

    this.client.on("reconnecting", (delay: number) => {
      logger.info(`Redis client reconnecting in ${delay}ms`);
    });

    this.client.on("+node", (node: any) => {
      logger.info("Redis cluster node added", { node });
    });

    this.client.on("-node", (node: any) => {
      logger.info("Redis cluster node removed", { node });
    });
  }

  /**
   * Connect to Redis server
   */
  public async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
      }
    } catch (error) {
      logger.error("Failed to connect to Redis", {
        error: error.message,
        host: config.redis.host,
        port: config.redis.port,
      });
      throw error;
    }
  }

  /**
   * Disconnect from Redis server
   */
  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      this.isConnected = false;
      logger.info("Redis client disconnected");
    } catch (error) {
      logger.error("Error disconnecting from Redis", { error: error.message });
    }
  }

  /**
   * Test Redis connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error("Redis connection test failed", { error: error.message });
      return false;
    }
  }

  /**
   * Get Redis client instance
   */
  public getClient(): RedisClient {
    return this.client;
  }

  /**
   * Check if Redis is connected
   */
  public isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Set a key-value pair with optional expiration
   */
  public async set(
    key: string,
    value: string,
    expireInSeconds?: number,
  ): Promise<void> {
    try {
      if (expireInSeconds) {
        await this.client.setex(key, expireInSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      logger.debug("Redis SET operation", { key, expireInSeconds });
    } catch (error) {
      logger.error("Redis SET operation failed", { key, error: error.message });
      throw error;
    }
  }

  /**
   * Get a value by key
   */
  public async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      logger.debug("Redis GET operation", { key, found: value !== null });
      return value;
    } catch (error) {
      logger.error("Redis GET operation failed", { key, error: error.message });
      throw error;
    }
  }

  /**
   * Delete a key
   */
  public async delete(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      const deleted = result > 0;
      logger.debug("Redis DELETE operation", { key, deleted });
      return deleted;
    } catch (error) {
      logger.error("Redis DELETE operation failed", {
        key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete multiple keys
   */
  public async deleteMultiple(keys: string[]): Promise<number> {
    try {
      if (keys.length === 0) return 0;
      const result = await this.client.del(...keys);
      logger.debug("Redis DELETE MULTIPLE operation", {
        keys,
        deleted: result,
      });
      return result;
    } catch (error) {
      logger.error("Redis DELETE MULTIPLE operation failed", {
        keys,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      const exists = result > 0;
      logger.debug("Redis EXISTS operation", { key, exists });
      return exists;
    } catch (error) {
      logger.error("Redis EXISTS operation failed", {
        key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Set expiration time for a key
   */
  public async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      const success = result === 1;
      logger.debug("Redis EXPIRE operation", { key, seconds, success });
      return success;
    } catch (error) {
      logger.error("Redis EXPIRE operation failed", {
        key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get time to live for a key
   */
  public async getTTL(key: string): Promise<number> {
    try {
      const ttl = await this.client.ttl(key);
      logger.debug("Redis TTL operation", { key, ttl });
      return ttl;
    } catch (error) {
      logger.error("Redis TTL operation failed", { key, error: error.message });
      throw error;
    }
  }

  /**
   * Get multiple values by keys
   */
  public async getMultiple(keys: string[]): Promise<Array<string | null>> {
    try {
      if (keys.length === 0) return [];
      const values = await this.client.mget(...keys);
      logger.debug("Redis MGET operation", {
        keys,
        found: values.filter((v) => v !== null).length,
      });
      return values;
    } catch (error) {
      logger.error("Redis MGET operation failed", {
        keys,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Set multiple key-value pairs
   */
  public async setMultiple(keyValues: Record<string, string>): Promise<void> {
    try {
      const entries = Object.entries(keyValues);
      if (entries.length === 0) return;

      const args: string[] = [];
      for (const [key, value] of entries) {
        args.push(key, value);
      }

      await this.client.mset(...args);
      logger.debug("Redis MSET operation", { count: entries.length });
    } catch (error) {
      logger.error("Redis MSET operation failed", { error: error.message });
      throw error;
    }
  }

  /**
   * Get all keys matching a pattern
   */
  public async getKeys(pattern: string = "*"): Promise<string[]> {
    try {
      const keys = await this.client.keys(pattern);
      logger.debug("Redis KEYS operation", { pattern, count: keys.length });
      return keys;
    } catch (error) {
      logger.error("Redis KEYS operation failed", {
        pattern,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Flush all data (use with caution)
   */
  public async flushAll(): Promise<void> {
    try {
      await this.client.flushall();
      logger.warn("Redis FLUSHALL executed - all data cleared");
    } catch (error) {
      logger.error("Redis FLUSHALL operation failed", { error: error.message });
      throw error;
    }
  }
}

// Create and export singleton instance
export const redisService = new RedisService();

// Export Redis client for direct access if needed
export const redisClient = redisService.getClient();
