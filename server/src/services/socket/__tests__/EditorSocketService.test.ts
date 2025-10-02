import { Server } from 'http';
import { Server as SocketServer } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { AddressInfo } from 'net';
import { RedisClientType } from 'redis';
import { DocumentHistoryService } from '../../editor/DocumentHistoryService.new';
import { EditorSocketService } from '../EditorSocketService';
import { getTestRedisClient } from '../../../tests/setup';

describe('EditorSocketService', () => {
  let httpServer: Server;
  let io: SocketServer;
  let editorSocketService: EditorSocketService;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;
  let documentHistoryService: DocumentHistoryService;
  const testDocId = 'test-doc-1';
  const testUserId1 = 'user-1';
  const testUserId2 = 'user-2';

  beforeAll((done) => {
    httpServer = new Server();
    io = new SocketServer(httpServer);
    
    const redis = getTestRedisClient() as unknown as RedisClientType;
    documentHistoryService = new DocumentHistoryService(redis);
    editorSocketService = new EditorSocketService(io, redis);
    
    httpServer.listen(() => {
      const port = (httpServer.address() as AddressInfo).port;
      
      // Setup first client
      clientSocket1 = Client(`http://localhost:${port}`, {
        query: { documentId: testDocId, userId: testUserId1, username: 'User1' },
        transports: ['websocket']
      });
      
      // Setup second client
      clientSocket2 = Client(`http://localhost:${port}`, {
        query: { documentId: testDocId, userId: testUserId2, username: 'User2' },
        transports: ['websocket']
      });
      
      // Wait for both clients to connect
      Promise.all([
        new Promise(resolve => clientSocket1.on('connect', resolve)),
        new Promise(resolve => clientSocket2.on('connect', resolve))
      ]).then(() => done());
    });
  });

  afterAll(() => {
    io.close();
    httpServer.close();
    clientSocket1.close();
    clientSocket2.close();
  });

  afterEach((done) => {
    // Clean up test data
    const redis = getTestRedisClient();
    Promise.all([
      redis.del(`doc:${testDocId}`),
      redis.del(`doc:${testDocId}:versions`),
      redis.del(`presence:doc:${testDocId}:users`),
      redis.del(`presence:user:${testUserId1}`),
      redis.del(`presence:user:${testUserId2}`)
    ]).then(() => done());
  });

  describe('document collaboration', () => {
    it('should broadcast operations to all clients', (done) => {
      const operation = {
        type: 'insert' as const,
        position: 0,
        text: 'Hello',
        version: 1,
        userId: testUserId1,
        timestamp: Date.now()
      };

      clientSocket2.on('operation', (data) => {
        expect(data.operations).toHaveLength(1);
        expect(data.operations[0].text).toBe('Hello');
        done();
      });

      clientSocket1.emit('operation', {
        documentId: testDocId,
        operations: [operation]
      });
    });

    it('should synchronize cursor positions', (done) => {
      const cursorPosition = { line: 5, ch: 10 };
      
      clientSocket2.on('cursor', (data) => {
        expect(data.userId).toBe(testUserId1);
        expect(data.position).toEqual(cursorPosition);
        done();
      });

      clientSocket1.emit('cursor', {
        documentId: testDocId,
        position: cursorPosition
      });
    });
  });

  describe('presence', () => {
    it('should track user presence', (done) => {
      clientSocket2.on('presence', (data) => {
        expect(data.users).toHaveProperty(testUserId1);
        expect(data.users[testUserId1].username).toBe('User1');
        done();
      });
    });
  });
});
