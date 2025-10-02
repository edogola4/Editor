import { RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import { Operation, DocumentState, CursorPosition, UserPresence } from '../../types/editor.types';

interface EditorConfig {
  redis: RedisClientType;
  debounceTime?: number;
  batchSize?: number;
}

export class EditorService {
  private redis: RedisClientType;
  private debounceTime: number;
  private batchSize: number;
  private batchQueue: Map<string, Operation[]> = new Map();
  private batchTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private userColors: Map<string, string> = new Map();
{{ ... }}
    this.batchSize = config.batchSize || 10;
  }

  // Redis operation helpers
  private async getAsync(key: string): Promise<string | null> {
    return this.redis.get(key).then(val => val ? val.toString() : null);
  }

  private async setAsync(key: string, value: string): Promise<void> {
    await this.redis.set(key, value);
  }

  private async delAsync(key: string): Promise<void> {
    await this.redis.del(key);
{{ ... }}

  // Document state management
  async getDocumentState(docId: string): Promise<DocumentState | null> {
    const doc = await this.getAsync(`doc:${docId}`);
    return doc ? JSON.parse(doc) : null;
  }

  async updateDocumentState(docId: string, operations: Operation[]): Promise<void> {
    const docKey = `doc:${docId}`;
    const version = (this.documentVersions.get(docId) || 0) + 1;
    
    await Promise.all([
      this.setAsync(docKey, JSON.stringify({
        content: await this.applyOperations(docId, operations),
        version,
        updatedAt: new Date().toISOString()
      })),
      this.redis.publish(`doc:${docId}:updates`, JSON.stringify({
        type: 'operations',
        operations,
        version,
        timestamp: Date.now()
      }))
    ]);

    this.documentVersions.set(docId, version);
  }

  // Operation processing
  private async applyOperations(docId: string, operations: Operation[]): Promise<string> {
    const docState = await this.getDocumentState(docId) || { content: '', version: 0 };
    let content = docState.content;
    
    for (const op of operations) {
      // Apply operation to content
      // This is a simplified implementation - you'll need to implement
      // proper operational transform based on your editor's needs
      if (op.type === 'insert') {
        content = content.slice(0, op.position) + op.text + content.slice(op.position);
      } else if (op.type === 'delete') {
        content = content.slice(0, op.position) + content.slice(op.position + op.length);
      }
    }
    
    return content;
  }

  // User presence and cursor tracking
  updateCursorPosition(userId: string, docId: string, position: CursorPosition): void {
    this.userCursors.set(`${userId}:${docId}`, position);
    this.redis.publish(`user:${userId}:${docId}:cursor`, JSON.stringify({
      userId,
      position,
      timestamp: Date.now()
    }));
  }

  updateUserSelection(userId: string, docId: string, selection: any): void {
    this.userSelections.set(`${userId}:${docId}`, selection);
    this.redis.publish(`user:${userId}:${docId}:selection`, JSON.stringify({
      userId,
      selection,
      timestamp: Date.now()
    }));
  }

  // User color management
  getUserColor(userId: string): string {
    if (!this.userColors.has(userId)) {
      const color = this.COLOR_PALETTE[this.userColors.size % this.COLOR_PALETTE.length];
      this.userColors.set(userId, color);
    }
    return this.userColors.get(userId)!;
  }

  // Batch operations for performance
  queueOperation(docId: string, operation: Operation): void {
    if (!this.batchQueue.has(docId)) {
      this.batchQueue.set(docId, []);
    }

    const queue = this.batchQueue.get(docId)!;
    queue.push(operation);

    if (queue.length >= this.batchSize) {
      this.flushOperations(docId);
      return;
    }

    if (!this.batchTimeouts.has(docId)) {
      const timeout = setTimeout(() => this.flushOperations(docId), this.debounceTime);
      this.batchTimeouts.set(docId, timeout);
    }
  }

  private async flushOperations(docId: string): Promise<void> {
    const queue = this.batchQueue.get(docId) || [];
    if (queue.length === 0) return;

    this.batchQueue.set(docId, []);
    const timeout = this.batchTimeouts.get(docId);
    if (timeout) {
      clearTimeout(timeout);
      this.batchTimeouts.delete(docId);
    }

    await this.updateDocumentState(docId, queue);
  }

  // Cleanup
  async cleanupDocument(docId: string): Promise<void> {
    this.batchQueue.delete(docId);
    const timeout = this.batchTimeouts.get(docId);
    if (timeout) {
      clearTimeout(timeout);
      this.batchTimeouts.delete(docId);
    }
    await this.delAsync(`doc:${docId}`);
  }

  // Document recovery
  async getDocumentHistory(docId: string, limit: number = 10): Promise<DocumentState[]> {
    // Implementation for document history/versioning
    // This would typically use Redis streams or a separate history store
    return [];
  }
}
