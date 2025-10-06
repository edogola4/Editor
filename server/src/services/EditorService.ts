import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { Operation } from 'ot-types';
import { diffMatchPatch } from 'diff-match-patch';

const dmp = new diffMatchPatch();

export interface CursorPosition {
  row: number;
  column: number;
}

export interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
  isBackward?: boolean;
}

export interface UserState {
  userId: string;
  username: string;
  color: string;
  cursor: CursorPosition | null;
  selection: SelectionRange | null;
  lastActive: number;
}

export interface DocumentState {
  content: string;
  version: number;
  operations: Operation[];
  users: Record<string, UserState>;
  language: string;
  theme: string;
}

export class EditorService {
  private static readonly DOCUMENT_PREFIX = 'document:';
  private static readonly USER_PREFIX = 'user:';
  private static readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private static readonly OPERATION_HISTORY_SIZE = 1000;
  private static readonly DEBOUNCE_DELAY = 50; // ms

  private redis: Redis;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private userColors: Map<string, string> = new Map();

  constructor(redis: Redis) {
    this.redis = redis;
  }

  private getDocumentKey(documentId: string): string {
    return `${EditorService.DOCUMENT_PREFIX}${documentId}`;
  }

  private getUserKey(userId: string): string {
    return `${EditorService.USER_PREFIX}${userId}`;
  }

  private getOperationKey(documentId: string): string {
    return `${this.getDocumentKey(documentId)}:operations`;
  }

  private getUsersKey(documentId: string): string {
    return `${this.getDocumentKey(documentId)}:users`;
  }

  private generateColor(userId: string): string {
    if (this.userColors.has(userId)) {
      return this.userColors.get(userId)!;
    }

    // Generate a consistent color based on user ID
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const hue = Math.abs(hash) % 360;
    const saturation = 70 + Math.abs(hash % 15); // 70-85%
    const lightness = 50 + Math.abs(hash % 10);  // 50-60%
    
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    this.userColors.set(userId, color);
    return color;
  }

  async initializeDocument(documentId: string, initialContent: string = '', language: string = 'plaintext', theme: string = 'github'): Promise<void> {
    const documentKey = this.getDocumentKey(documentId);
    const now = Date.now();
    
    await this.redis
      .multi()
      .hset(documentKey, {
        content: initialContent,
        version: 0,
        language,
        theme,
        updatedAt: now,
      })
      .del(this.getOperationKey(documentId))
      .del(this.getUsersKey(documentKey))
      .exec();
  }

  async getDocumentState(documentId: string): Promise<DocumentState | null> {
    const [docData, operations, users] = await Promise.all([
      this.redis.hgetall(this.getDocumentKey(documentId)),
      this.redis.lrange(this.getOperationKey(documentId), 0, -1),
      this.redis.hgetall(this.getUsersKey(documentId)),
    ]);

    if (!docData || !docData.content) return null;

    return {
      content: docData.content,
      version: parseInt(docData.version || '0', 10),
      operations: operations.map(op => JSON.parse(op)),
      users: Object.entries(users).reduce((acc, [userId, userData]) => {
        try {
          acc[userId] = JSON.parse(userData as string);
        } catch (e) {
          console.error(`Error parsing user data for ${userId}:`, e);
        }
        return acc;
      }, {} as Record<string, UserState>),
      language: docData.language || 'plaintext',
      theme: docData.theme || 'github',
    };
  }

  async applyOperation(
    documentId: string,
    userId: string,
    username: string,
    operation: Operation,
    cursor: CursorPosition | null = null,
    selection: SelectionRange | null = null
  ): Promise<{ version: number; operations: Operation[] }> {
    const documentKey = this.getDocumentKey(documentId);
    const operationKey = this.getOperationKey(documentId);
    const usersKey = this.getUsersKey(documentId);

    // Start a transaction
    const multi = this.redis.multi();
    
    // Get current document state
    const [currentContent, version] = await this.redis
      .multi()
      .hget(documentKey, 'content')
      .hget(documentKey, 'version')
      .exec()
      .then(results => [
        results[0][1] as string,
        parseInt(results[1][1] as string, 10) || 0,
      ]);

    // Apply operation to get new content
    const patches = dmp.patch_make(currentContent || '', operation);
    const [newContent] = dmp.patch_apply(patches, currentContent || '');

    // Update document state
    const newVersion = version + 1;
    multi
      .hset(documentKey, {
        content: newContent,
        version: newVersion,
        updatedAt: Date.now(),
      })
      .rpush(operationKey, JSON.stringify(operation))
      .ltrim(operationKey, -EditorService.OPERATION_HISTORY_SIZE, -1);

    // Update user state
    await this.updateUserState(documentId, userId, username, cursor, selection);

    // Execute transaction
    await multi.exec();

    // Get recent operations to return
    const operations = await this.redis.lrange(operationKey, -10, -1);

    return {
      version: newVersion,
      operations: operations.map(op => JSON.parse(op)),
    };
  }

  async updateUserState(
    documentId: string,
    userId: string,
    username: string,
    cursor: CursorPosition | null = null,
    selection: SelectionRange | null = null
  ): Promise<void> {
    const usersKey = this.getUsersKey(documentId);
    const now = Date.now();
    
    const userState: UserState = {
      userId,
      username,
      color: this.generateColor(userId),
      cursor,
      selection,
      lastActive: now,
    };

    await this.redis.hset(usersKey, userId, JSON.stringify(userState));
    
    // Clean up inactive users (those who haven't sent a heartbeat in 2x the interval)
    this.cleanupInactiveUsers(documentId).catch(console.error);
  }

  private async cleanupInactiveUsers(documentId: string): Promise<void> {
    const usersKey = this.getUsersKey(documentId);
    const users = await this.redis.hgetall(usersKey);
    const now = Date.now();
    const inactiveThreshold = now - (EditorService.HEARTBEAT_INTERVAL * 2);

    const multi = this.redis.multi();
    let hasInactiveUsers = false;

    for (const [userId, userData] of Object.entries(users)) {
      try {
        const userState = JSON.parse(userData);
        if (userState.lastActive < inactiveThreshold) {
          multi.hdel(usersKey, userId);
          hasInactiveUsers = true;
        }
      } catch (e) {
        console.error(`Error parsing user data for cleanup ${userId}:`, e);
      }
    }

    if (hasInactiveUsers) {
      await multi.exec();
    }
  }

  async setLanguage(documentId: string, language: string): Promise<void> {
    await this.redis.hset(this.getDocumentKey(documentId), {
      language,
      updatedAt: Date.now(),
    });
  }

  async setTheme(documentId: string, theme: string): Promise<void> {
    await this.redis.hset(this.getDocumentKey(documentId), {
      theme,
      updatedAt: Date.now(),
    });
  }

  async deleteDocument(documentId: string): Promise<void> {
    const documentKey = this.getDocumentKey(documentId);
    await this.redis
      .multi()
      .del(documentKey)
      .del(this.getOperationKey(documentId))
      .del(this.getUsersKey(documentId))
      .exec();
  }

  // Debounced version of updateUserState for cursor/selection updates
  debouncedUpdateUserState = async (
    documentId: string,
    userId: string,
    username: string,
    cursor: CursorPosition | null = null,
    selection: SelectionRange | null = null
  ): Promise<void> => {
    const key = `${documentId}:${userId}`;
    
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timer = setTimeout(async () => {
      try {
        await this.updateUserState(documentId, userId, username, cursor, selection);
      } catch (error) {
        console.error('Error in debounced updateUserState:', error);
      } finally {
        this.debounceTimers.delete(key);
      }
    }, EditorService.DEBOUNCE_DELAY);

    this.debounceTimers.set(key, timer);
  };

  // Clean up resources
  async disconnect(): Promise<void> {
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    
    // Note: Don't close the Redis connection here as it might be shared
  }
}
