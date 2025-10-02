import { RedisClientType } from 'redis';
import { Operation, DocumentState } from '../../types/editor.types';

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

  constructor(redis: RedisClientType) {
    this.redis = redis;

  private async getAsync(key: string): Promise<string | null> {
    return this.redis.get(key).then(val => val ? val.toString() : null);
  }

  private async setAsync(key: string, value: string): Promise<void> {
    return this.redis.set(key, value);
  }

  private async zaddAsync(key: string, score: number, member: string): Promise<void> {
    return this.redis.zAdd(key, { score, value: member });
  }
{{ ... }}
    await this.setAsync(versionKey, JSON.stringify(versionData));
    await this.zaddAsync(this.getVersionsKey(docId), version, version.toString());
    await this.cleanupOldVersions(docId);
  }

  private async getVersionCount(docId: string): Promise<number> {
    const versionsKey = this.getVersionsKey(docId);
    return this.redis.zCard(versionsKey).then(val => val ? val.toNumber() : 0);
  }  
    if (count > this.VERSION_HISTORY_LIMIT) {
      const toRemove = count - this.VERSION_HISTORY_LIMIT;
      await this.redis.zRemRangeByRank(versionsKey, 0, toRemove - 1);
    }
{{ ... }}
  async getOperationsSince(
    docId: string,
    fromVersion: number
  ): Promise<{ operations: Operation[]; latestVersion: number }> {
    const versionsKey = this.getVersionsKey(docId);
    const versionStrings = await promisify(this.redis.zrangebyscore)
      .bind(this.redis)(versionsKey, fromVersion + 1, '+inf');
    
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

  private async getVersion(docId: string, version: number): Promise<DocumentVersion | null> {
    const versionKey = this.getVersionKey(docId, version);
    const data = await this.getAsync(versionKey);
    return data ? JSON.parse(data) : null;
  }
}
