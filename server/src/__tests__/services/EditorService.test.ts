import { Redis } from 'ioredis-mock';
import { EditorService } from '../../services/EditorService';

describe('EditorService', () => {
  let redis: Redis;
  let editorService: EditorService;
  const documentId = 'test-doc';
  const userId = 'user-1';
  const username = 'Test User';

  beforeEach(async () => {
    redis = new Redis();
    editorService = new EditorService(redis);
    await editorService.initializeDocument(documentId);
  });

  afterEach(async () => {
    await editorService.deleteDocument(documentId);
  });

  test('should initialize document', async () => {
    const state = await editorService.getDocumentState(documentId);
    expect(state).not.toBeNull();
    expect(state?.content).toBe('');
    expect(state?.version).toBe(0);
  });

  test('should apply operation', async () => {
    const operation = ['insert', 'Hello'];
    const result = await editorService.applyOperation(
      documentId,
      userId,
      username,
      operation,
      { row: 0, column: 5 }
    );

    expect(result.version).toBe(1);
    
    const state = await editorService.getDocumentState(documentId);
    expect(state?.content).toContain('Hello');
    expect(state?.version).toBe(1);
  });

  test('should update user cursor', async () => {
    const cursor = { row: 0, column: 5 };
    await editorService.updateUserState(documentId, userId, username, cursor);
    
    const state = await editorService.getDocumentState(documentId);
    expect(state?.users[userId]?.cursor).toEqual(cursor);
  });

  test('should handle concurrent operations', async () => {
    const op1 = ['insert', 'Hello'];
    const op2 = ['insert', ' World'];

    await Promise.all([
      editorService.applyOperation(documentId, 'user-1', 'User 1', op1),
      editorService.applyOperation(documentId, 'user-2', 'User 2', op2)
    ]);

    const state = await editorService.getDocumentState(documentId);
    expect(state?.content).toContain('Hello');
    expect(state?.content).toContain('World');
    expect(state?.version).toBe(2);
  });

  test('should clean up inactive users', async () => {
    const now = Date.now();
    const userState = {
      userId,
      username,
      color: '#000000',
      cursor: { row: 0, column: 0 },
      lastActive: now - 100000, // Old timestamp
    };

    await redis.hset(
      `document:${documentId}:users`,
      userId,
      JSON.stringify(userState)
    );

    // This should trigger cleanup
    await editorService.updateUserState(
      documentId,
      'user-2',
      'New User',
      { row: 0, column: 0 }
    );

    const state = await editorService.getDocumentState(documentId);
    expect(state?.users[userId]).toBeUndefined();
  });
});
