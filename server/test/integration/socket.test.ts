import { io as Client, Socket } from 'socket.io-client';
import { createServer, Server as HttpServer } from 'http';
import { AddressInfo } from 'net';
import { app } from '../../src/app';
import { setupTestEnvironment, cleanupTestEnvironment, createTestUser, createTestRoom } from '../test-utils';
import { db } from '../../src/services/database/DatabaseService';
import { Server } from 'socket.io';

describe('Socket.IO', () => {
  let httpServer: HttpServer;
  let io: Server;
  let clientSocket1: Socket;
  let clientSocket2: Socket;
  let serverAddr: AddressInfo;
  let testUser1: any;
  let testUser2: any;
  let testRoom: any;
  let user1Token: string;
  let user2Token: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    
    // Create test users
    testUser1 = await createTestUser({
      username: 'socketuser1',
      email: 'socket1@example.com',
    });
    
    testUser2 = await createTestUser({
      username: 'socketuser2',
      email: 'socket2@example.com',
    });

    // Create a test room
    testRoom = await createTestRoom({
      name: 'Test Room',
      description: 'A test room for socket testing',
    }, testUser1.id);

    // Get authentication tokens
    const loginRes1 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'socket1@example.com',
        password: 'password',
      });
    
    const loginRes2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'socket2@example.com',
        password: 'password',
      });
    
    user1Token = loginRes1.body.tokens.accessToken;
    user2Token = loginRes2.body.tokens.accessToken;

    // Set up Socket.IO server
    httpServer = createServer(app);
    io = new Server(httpServer);
    
    // Start server on a random port
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        serverAddr = httpServer.address() as AddressInfo;
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Close connections
    if (clientSocket1) clientSocket1.close();
    if (clientSocket2) clientSocket2.close();
    
    await new Promise<void>((resolve) => {
      io.close(() => {
        httpServer.close(() => {
          resolve();
        });
      });
    });
    
    await cleanupTestEnvironment();
  });

  beforeEach(() => {
    // Set up client connections before each test
    clientSocket1 = Client(`http://localhost:${serverAddr.port}`, {
      auth: { token: user1Token },
      transports: ['websocket'],
    });

    clientSocket2 = Client(`http://localhost:${serverAddr.port}`, {
      auth: { token: user2Token },
      transports: ['websocket'],
    });
  });

  afterEach(() => {
    // Disconnect clients after each test
    if (clientSocket1.connected) clientSocket1.disconnect();
    if (clientSocket2.connected) clientSocket2.disconnect();
  });

  describe('Connection', () => {
    it('should connect with valid token', (done) => {
      clientSocket1.on('connect', () => {
        expect(clientSocket1.connected).toBe(true);
        done();
      });
    });

    it('should not connect with invalid token', (done) => {
      const invalidClient = Client(`http://localhost:${serverAddr.port}`, {
        auth: { token: 'invalid-token' },
        transports: ['websocket'],
      });

      invalidClient.on('connect_error', (err) => {
        expect(err.message).toContain('Authentication error');
        invalidClient.close();
        done();
      });
    });
  });

  describe('Room Events', () => {
    it('should allow joining a room', (done) => {
      clientSocket1.emit('joinRoom', { roomId: testRoom.id });
      
      // The server should acknowledge the join
      clientSocket1.on('roomJoined', (data) => {
        expect(data.roomId).toBe(testRoom.id);
        expect(data.userId).toBe(testUser1.id);
        done();
      });
    });
  });

  describe('Collaboration Events', () => {
    it('should broadcast text changes to other clients in the same room', (done) => {
      // Both users join the room
      clientSocket1.emit('joinRoom', { roomId: testRoom.id });
      clientSocket2.emit('joinRoom', { roomId: testRoom.id });

      // User 2 listens for text changes
      clientSocket2.on('textChange', (data) => {
        expect(data.roomId).toBe(testRoom.id);
        expect(data.userId).toBe(testUser1.id);
        expect(data.delta).toEqual({ ops: [{ insert: 'Hello' }] });
        done();
      });

      // User 1 makes a change
      clientSocket1.emit('textChange', {
        roomId: testRoom.id,
        delta: { ops: [{ insert: 'Hello' }] },
      });
    });

    it('should not broadcast to users not in the room', (done) => {
      // User 1 joins the room, User 2 does not
      clientSocket1.emit('joinRoom', { roomId: testRoom.id });

      // This should not be called
      clientSocket2.on('textChange', () => {
        fail('User 2 should not receive this event');
      });

      // User 1 makes a change
      clientSocket1.emit('textChange', {
        roomId: testRoom.id,
        delta: { ops: [{ insert: 'Hello' }] },
      });

      // Wait to ensure no events are received
      setTimeout(done, 100);
    });
  });

  describe('Cursor Position', () => {
    it('should broadcast cursor position to other users in the room', (done) => {
      // Both users join the room
      clientSocket1.emit('joinRoom', { roomId: testRoom.id });
      clientSocket2.emit('joinRoom', { roomId: testRoom.id });

      // User 2 listens for cursor position changes
      clientSocket2.on('cursorMove', (data) => {
        expect(data.userId).toBe(testUser1.id);
        expect(data.position).toBe(5);
        expect(data.roomId).toBe(testRoom.id);
        done();
      });

      // User 1 moves cursor
      clientSocket1.emit('cursorMove', {
        roomId: testRoom.id,
        position: 5,
      });
    });
  });

  describe('Disconnection', () => {
    it('should handle user disconnection', (done) => {
      // User 1 joins the room
      clientSocket1.emit('joinRoom', { roomId: testRoom.id });
      
      // User 2 joins and listens for user left event
      clientSocket2.emit('joinRoom', { roomId: testRoom.id });
      clientSocket2.on('userLeft', (data) => {
        expect(data.userId).toBe(testUser1.id);
        expect(data.roomId).toBe(testRoom.id);
        done();
      });

      // User 1 disconnects
      clientSocket1.disconnect();
    });
  });
});
