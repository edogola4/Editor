import { Server } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { AddressInfo } from 'net';
import { createServer } from 'http';
import { WebSocketServer } from '../../services/WebSocketServer';
import { redis } from '../../services/RedisClient';

let httpServer: Server;
let wsServer: WebSocketServer;
let clientSocket1: ClientSocket;
let clientSocket2: ClientSocket;
const documentId = 'test-doc';
const token = 'test-token';

beforeAll((done) => {
  httpServer = createServer();
  wsServer = WebSocketServer.getInstance(httpServer);
  
  httpServer.listen(() => {
    const port = (httpServer.address() as AddressInfo).port;
    const clientUrl = `http://localhost:${port}`;
    
    // Connect first client
    clientSocket1 = Client(clientUrl, {
      auth: { token },
      query: { documentId },
      transports: ['websocket'],
    });
    
    // Connect second client
    clientSocket2 = Client(clientUrl, {
      auth: { token },
      query: { documentId },
      transports: ['websocket'],
    });
    
    // Wait for both clients to connect
    Promise.all([
      new Promise<void>((resolve) => clientSocket1.on('connect', resolve)),
      new Promise<void>((resolve) => clientSocket2.on('connect', resolve)),
    ]).then(() => done());
  });
});

afterAll(() => {
  clientSocket1.close();
  clientSocket2.close();
  wsServer.close();
  httpServer.close();
  redis.redis.flushall();
});

describe('WebSocket Integration', () => {
  test('should broadcast operations to all clients', (done) => {
    const operation = ['insert', 'Hello'];
    
    clientSocket2.on('operation', (data) => {
      expect(data.operation).toEqual(operation);
      expect(data.version).toBe(1);
      done();
    });
    
    clientSocket1.emit('operation', {
      documentId,
      operation,
      version: 0,
    });
  });
  
  test('should broadcast cursor updates', (done) => {
    const cursor = { row: 0, column: 5 };
    
    clientSocket2.on('cursor:update', (data) => {
      expect(data.userId).toBeDefined();
      expect(data.cursor).toEqual(cursor);
      done();
    });
    
    clientSocket1.emit('cursor:update', {
      documentId,
      cursor,
      selection: null,
    });
  });
  
  test('should handle user join/leave events', (done) => {
    clientSocket2.on('user:joined', (data) => {
      expect(data.userId).toBeDefined();
      expect(data.username).toBeDefined();
      expect(data.color).toBeDefined();
      
      // Test user leave
      clientSocket1.on('user:left', (leaveData) => {
        expect(leaveData.userId).toBe(data.userId);
        done();
      });
      
      clientSocket1.disconnect();
    });
  });
});
