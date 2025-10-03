import { IncomingMessage } from 'http';
import { redis } from '../config/redis.js';

type StateData = {
  state: string;
  meta?: any;
};

const STATE_PREFIX = 'oauth:state:';
const STATE_TTL = 600; // 10 minutes in seconds

export class StateStore {
  private static instance: StateStore;

  private constructor() {}

  public static getInstance(): StateStore {
    if (!StateStore.instance) {
      StateStore.instance = new StateStore();
    }
    return StateStore.instance;
  }

  public async storeState(
    req: IncomingMessage,
    state: string | undefined,
    meta: any,
    callback: (err: Error | null, state?: string) => void
  ): Promise<void> {
    try {
      if (!state) {
        state = Math.random().toString(36).substring(2, 15);
      }
      
      const stateData: StateData = { state, meta };
      const key = `${STATE_PREFIX}${state}`;
      
      console.log('Storing state in Redis:', { key, state, meta });
      
      // Store in Redis with expiration
      await redis.setex(
        key,
        STATE_TTL,
        JSON.stringify(stateData)
      );
      
      // Verify the state was stored
      const storedData = await redis.get(key);
      const verification = {
        key,
        stored: !!storedData,
        matches: storedData === JSON.stringify(stateData)
      };
      
      console.log('State stored successfully. Verification:', verification);
      
      if (!verification.stored || !verification.matches) {
        throw new Error('Failed to verify state storage');
      }
      
      return callback(null, state);
    } catch (err) {
      console.error('Error storing state:', err);
      return callback(err as Error);
    }
  }

  public async verifyState(
    req: IncomingMessage,
    providedState: string | undefined,
    callback: (err: Error | null, ok: boolean, state?: string, meta?: any) => void
  ): Promise<void> {
    try {
      if (!providedState) {
        const error = new Error('No state provided for verification');
        console.error(error.message);
        return callback(error, false);
      }
      
      const key = `${STATE_PREFIX}${providedState}`;
      console.log('Verifying state with key:', key);
      
      // Get the state data from Redis
      const stateDataStr = await redis.get(key);
      
      if (!stateDataStr) {
        // Get all keys for debugging purposes only
        const allKeys = await redis.keys(`${STATE_PREFIX}*`);
        console.error('State not found in store. Available keys:', allKeys);
        return callback(new Error('Invalid or expired state'), false);
      }
      
      try {
        const stateData: StateData = JSON.parse(stateDataStr);
        
        // Verify the state matches
        if (stateData.state !== providedState) {
          console.error('State mismatch:', {
            expected: providedState,
            actual: stateData.state
          });
          return callback(new Error('State verification failed'), false);
        }
        
        console.log('State verification successful:', { 
          key,
          state: stateData.state,
          meta: stateData.meta 
        });
        
        // Delete the state after successful verification
        await redis.del(key).catch(err => {
          console.error('Error deleting state from Redis:', err);
        });
        
        return callback(null, true, stateData.state, stateData.meta);
      } catch (parseError) {
        console.error('Error parsing state data:', parseError);
        return callback(parseError as Error, false);
      }
    } catch (err) {
      console.error('Error in verifyState:', err);
      return callback(err as Error, false);
    }
  }
}

export const stateStore = StateStore.getInstance();
