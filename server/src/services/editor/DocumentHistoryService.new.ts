import { RedisClientType } from 'redis';
import { Operation } from '../../types/editor.types';

interface DocumentVersion {
  version: number;
  operations: Operation[];
  timestamp: number;
  userId: string;
  snapshot?: string;
}

export class DocumentHistoryService {
  private redis: RedisClientType;
  private readonly VERSION_HISTORY_LIMIT = 100;
  private readonly SNAPSHOT_INTERVAL = 10;

  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  private getVersionKey(docId: string, version: number): string {
    return `doc:${docId}:v${version}`;
  }

  private getVersionsKey(docId: string): string {
    return `doc:${docId}:versions`;
  }

  private async getAsync(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  private async setAsync(key: string, value: string): Promise<void> {
    await this.redis.set(key, value);
  }

  private async zaddAsync(key: string, score: number, member: string): Promise<void> {
    await this.redis.zAdd(key, { score, value: member });
  }

  private async zrangeAsync(key: string, start: number, stop: number): Promise<string[]> {
    return this.redis.zRange(key, start, stop);
  }

  private async zrangeByScore(key: string, min: number, max: number): Promise<string[]> {
    return this.redis.zRangeByScore(key, min, max);
  }

  private async zremrangebyrankAsync(key: string, start: number, stop: number): Promise<void> {
    await this.redis.zRemRangeByRank(key, start, stop);
  }

  private async getVersionCount(docId: string): Promise<number> {
    const versionsKey = this.getVersionsKey(docId);
    return this.redis.zCard(versionsKey);
  }

  async recordVersion(
    docId: string,
    operations: Operation[],
    version: number,
    userId: string,
    snapshot?: string
  ): Promise<void> {
    const versionKey = this.getVersionKey(docId, version);
    const versionData: DocumentVersion = {
      version,
      operations,
      timestamp: Date.now(),
      userId,
      snapshot
    };

    await this.setAsync(versionKey, JSON.stringify(versionData));
    await this.zaddAsync(this.getVersionsKey(docId), version, version.toString());
    await this.cleanupOldVersions(docId);
  }

  private async cleanupOldVersions(docId: string): Promise<void> {
    const versionsKey = this.getVersionsKey(docId);
    const count = await this.getVersionCount(docId);
    
    if (count > this.VERSION_HISTORY_LIMIT) {
      const toRemove = count - this.VERSION_HISTORY_LIMIT;
      await this.zremrangebyrankAsync(versionsKey, 0, toRemove - 1);
    }
  }

  async getVersion(docId: string, version: number): Promise<DocumentVersion | null> {
    const versionKey = this.getVersionKey(docId, version);
    const data = await this.getAsync(versionKey);
    return data ? JSON.parse(data) : null;
  }

  async getOperationsSince(
    docId: string,
    fromVersion: number
  ): Promise<{ operations: Operation[]; latestVersion: number }> {
    const versionsKey = this.getVersionsKey(docId);
    const versionStrings = await this.zrangeByScore(versionsKey, fromVersion + 1, '+inf');
    
    const operations: Operation[] = [];
    for (const versionStr of versionStrings) {
      const version = parseInt(versionStr, 10);
      const versionData = await this.getVersion(docId, version);
      if (versionData) {
        operations.push(...versionData.operations);
      }
    }
    
    const latestVersion = versionStrings.length > 0 
      ? parseInt(versionStrings[versionStrings.length - 1], 10) 
      : fromVersion;
      
    return { operations, latestVersion };
  }

  async getLatestVersion(docId: string): Promise<number> {
    const versionsKey = this.getVersionsKey(docId);
    const result = await this.zrangeAsync(versionsKey, -1, -1);
    return result.length > 0 ? parseInt(result[0], 10) : 0;
  }

  async getDocumentAtVersion(docId: string, targetVersion: number): Promise<string> {
    const snapshot = await this.findNearestSnapshot(docId, targetVersion);
    let content = '';
    let startVersion = 0;
    
    if (snapshot) {
      content = snapshot.snapshot || '';
      startVersion = snapshot.version;
    }
    
    const { operations } = await this.getOperationsSince(docId, startVersion);
    
    // Apply operations to get to target version
    for (const op of operations) {
      if (op.version > targetVersion) break;
      content = this.applyOperation(content, op);
    }
    
    return content;
  }

  private applyOperation(content: string, operation: Operation): string {
    if (operation.type === 'insert' && operation.text) {
      return content.slice(0, operation.position) + operation.text + content.slice(operation.position);
    } else if (operation.type === 'delete') {
      return content.slice(0, operation.position) + 
             content.slice(operation.position + (operation.length || 0));
    }
    return content;
  }

  private async findNearestSnapshot(
    docId: string, 
    maxVersion: number
  ): Promise<{ version: number; snapshot: string } | null> {
    const versionsKey = this.getVersionsKey(docId);
    const versionStrings = await this.zrangeByScore(versionsKey, 0, maxVersion);
    
    // Find the most recent snapshot
    for (let i = versionStrings.length - 1; i >= 0; i--) {
      const version = parseInt(versionStrings[i], 10);
      const versionData = await this.getVersion(docId, version);
      if (versionData?.snapshot) {
        return {
          version,
          snapshot: versionData.snapshot
        };
      }
    }
    
    return null;
  }
}
