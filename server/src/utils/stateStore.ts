import { IncomingMessage } from 'http';
import { Redis } from 'ioredis';
import { redisClient as redis } from '../config/redis.js';

interface StateData {
  state: string;
  meta: {
    returnTo?: string;
    userAgent?: string;
    ip?: string;
    [key: string]: any;
  };
  timestamp: number;
  clientId?: string;
}

const STATE_PREFIX = 'oauth:state:';
const STATE_INDEX_KEY = `${STATE_PREFIX}index`;
const STATE_TTL = 600; // 10 minutes in seconds

// Helper functions
const getStateKey = (state: string): string => `${STATE_PREFIX}${state}`;
const generateState = (): string => [
  Math.random().toString(36).substring(2, 15),
  Math.random().toString(36).substring(2, 15),
  Date.now().toString(36)
].join('_');

export class StateStore {
  private static instance: StateStore;
  private logContext = 'StateStore';
  private redis: Redis;

  private constructor() {
    this.redis = redis;
  }

  public static getInstance(): StateStore {
    if (!StateStore.instance) {
      StateStore.instance = new StateStore();
    }
    return StateStore.instance;
  }

  /**
   * Store OAuth state in Redis
   */
  async storeState(
    req: IncomingMessage,
    state: string | undefined,
    meta: any = {},
    callback: (err: Error | null, state?: string) => void
  ): Promise<void> {
    const method = 'storeState';
    const startTime = Date.now();
    
    try {
      // Generate a new state if not provided
      if (!state) {
        state = generateState();
      }
      
      const key = getStateKey(state);
      const stateData: StateData = {
        state,
        meta: {
          ...meta,
          userAgent: req.headers['user-agent'] || '',
          ip: this.getClientIp(req) || ''
        },
        timestamp: Date.now()
      };
      
      this.logDebug(method, 'Storing state', { key, state, meta: stateData.meta });
      
      // Store the state with expiration
      await this.redis.set(key, JSON.stringify(stateData), 'EX', STATE_TTL);
      
      this.logInfo(method, 'State stored successfully', { 
        key, 
        state, 
        duration: Date.now() - startTime 
      });
      
      return callback(null, state);
    } catch (error) {
      this.logError(method, 'Error storing state', error);
      return callback(error as Error);
    }
  }
  
  /**
   * Verify OAuth state from Redis
   */
  async verifyState(
    req: IncomingMessage,
    providedState: string | undefined,
    callback: (err: Error | null, ok: boolean, state?: string, meta?: any) => void
  ): Promise<void> {
    const method = 'verifyState';
    const startTime = Date.now();
    
    try {
      // Validate input
      if (!providedState) {
        const error = new Error('No state provided for verification');
        this.logError(method, 'Validation failed', error);
        return callback(error, false);
      }
      
      const key = getStateKey(providedState);
      this.logDebug(method, 'Verifying state', { key, state: providedState });
      
      try {
        // Get the state data from Redis
        const stateDataStr = await this.redis.get(key);
        
        // Delete the state immediately after retrieval
        await this.redis.del(key);
        
        // Check if state exists
        if (!stateDataStr) {
          await this.logAvailableStates(method);
          const error = new Error('Invalid or expired state');
          this.logError(method, 'State not found', { 
            key, 
            error: error.message 
          });
          return callback(error, false);
        }
        
        // Parse the state data
        const stateData = JSON.parse(stateDataStr) as StateData;
        
        // Verify the state matches
        if (stateData.state !== providedState) {
          const error = new Error('State verification failed');
          this.logError(method, 'State mismatch', {
            expected: providedState,
            actual: stateData.state,
            key
          });
          return callback(error, false);
        }
        
        // Verify timestamp (prevent replay attacks)
        const now = Date.now();
        const stateAge = now - stateData.timestamp;
        const maxAge = STATE_TTL * 1000; // Convert to ms
        
        if (stateAge > maxAge) {
          const error = new Error('State has expired');
          this.logError(method, 'State expired', {
            key,
            state: stateData.state,
            ageMs: stateAge,
            maxAgeMs: maxAge
          });
          return callback(error, false);
        }
        
        this.logInfo(method, 'State verified successfully', {
          key,
          state: stateData.state,
          duration: Date.now() - startTime,
          meta: stateData.meta
        });
        
        return callback(null, true, stateData.state, stateData.meta);
        
      } catch (error) {
        this.logError(method, 'Error verifying state', error);
        return callback(error as Error, false);
      }
    } catch (error) {
      this.logError(method, 'Error in verifyState', error);
      return callback(error as Error, false);
    }
  }
  
  /**
   * Clean up expired states (run periodically)
   */
  async cleanupExpiredStates(): Promise<number> {
    const method = 'cleanupExpiredStates';
    try {
      const keys = await this.redis.keys(getStateKey('*'));
      
      if (!keys.length) {
        this.logDebug(method, 'No states to clean up');
        return 0;
      }
      
      const pipeline = this.redis.pipeline();
      keys.forEach(key => {
        pipeline.del(key);
        pipeline.srem(STATE_INDEX_KEY, key);
      });
      
      const results = await pipeline.exec();
      const deletedCount = results?.filter(([err]) => !err).length || 0;
      
      this.logInfo(method, 'Cleaned up expired states', { 
        total: keys.length, 
        deleted: deletedCount 
      });
      
      return deletedCount;
    } catch (error) {
      this.logError(method, 'Error cleaning up expired states', error);
      return 0;
    }
  }
  
  // Helper methods
  private getClientIp(req: IncomingMessage): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
      (req.socket?.remoteAddress) || 
      'unknown'
    );
  }
  
  private getClientId(req: IncomingMessage): string | undefined {
    return (
      (req.headers['x-client-id'] as string) ||
      req.socket?.remoteAddress ||
      undefined
    );
  }
  
  private async logAvailableStates(method: string): Promise<void> {
    try {
      // Use SCAN instead of KEYS for better performance in production
      let cursor = '0';
      const states: Array<{key: string, state: string}> = [];
      
      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          getStateKey('*'),
          'COUNT',
          '100'
        ) as [string, string[]];
        
        cursor = nextCursor;
        
        // Get state data for each key
        for (const key of keys) {
          try {
            const stateData = await this.redis.get(key);
            if (stateData) {
              const stateDataParsed = JSON.parse(stateData) as StateData;
              states.push({ key, state: stateDataParsed.state });
            }
          } catch (err) {
            this.logError(method, `Error getting state data for key ${key}`, err);
          }
        }
      } while (cursor !== '0');
      
      this.logDebug(method, 'Available states in store', { 
        count: states.length,
        states: states.map(s => s.key) // Only log keys to avoid sensitive data
      });
    } catch (error) {
      // Don't throw, just log the error
      this.logError(method, 'Error in logAvailableStates', error);
    }
  }
  
  private logDebug(method: string, message: string, data?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${this.logContext}.${method}] ${message}`, data || '');
    }
  }
  
  private logInfo(method: string, message: string, data?: any): void {
    console.log(`[${this.logContext}.${method}] ${message}`, data || '');
  }
  
  private logError(method: string, message: string, error: any): void {
    console.error(`[${this.logContext}.${method}] ${message}`, {
      error: error?.message || String(error),
      stack: error?.stack,
      ...(error?.code && { code: error.code }),
      ...(error?.statusCode && { statusCode: error.statusCode })
    });
  }
}

export const stateStore = StateStore.getInstance();
