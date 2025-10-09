import { describe, it, expect, beforeAll, afterAll, vi, afterEach } from 'vitest';
import { io, Socket } from 'socket.io-client';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupTestServer, createAuthenticatedUser } from '../helpers/api-client';
import { Document } from '../../../src/models/Document';
import { DocumentPermission } from '../../../src/models/DocumentPermission';

describe('Document Collaboration', () => {
  let httpServer: ReturnType<typeof createServer>;
  let ioServer: Server;
  let clientSockets: Socket[] = [];
  let testDocument: Document;
  let user1: any;
  let user2: any;
  let user1Token: string;
  let user2Token: string;
  const testPort = 3001;

  // Setup test server and database
  beforeAll(async () => {
    // Setup HTTP server
    httpServer = createServer();
    ioServer = new Server(httpServer);
    
    await new Promise<void>((resolve) => {
      httpServer.listen(testPort, resolve);
    });

    // Create test users
    const user1Data = await createAuthenticatedUser();
    const user2Data = await createAuthenticatedUser();
    
    user1 = user1Data.user;
    user2 = user2Data.user;
    user1Token = user1Data.tokens.accessToken;
    user2Token = user2Data.tokens.accessToken;

    // Create a test document
    testDocument = await Document.create({
      title: 'Collaboration Test Document',
      content: 'Initial content',
      createdById: user1.id,
    });

    // Grant user2 read/write access
    await DocumentPermission.create({
      documentId: testDocument.id,
      userId: user2.id,
      permission: 'write',
    });
  });

  afterEach(() => {
    // Clean up socket connections
    clientSockets.forEach(socket => socket.disconnect());
    clientSockets = [];
  });

  afterAll(async () => {
    // Clean up
    await new Promise<void>((resolve, reject) => {
      ioServer.close((err) => (err ? reject(err) : resolve()));
    });
    
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  const connectClient = async (token: string): Promise<Socket> => {
    return new Promise((resolve, reject) => {
      const socket = io(`http://localhost:${testPort}`, {
        auth: { token },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        clientSockets.push(socket);
        resolve(socket);
      });

      socket.on('connect_error', (err) => {
        reject(err);
      });
    });
  };

  it('should allow multiple users to collaborate on a document', async () => {
    // User 1 connects and joins the document
    const user1Socket = await connectClient(user1Token);
    const user1JoinPromise = new Promise((resolve) => {
      user1Socket.emit('joinDocument', { documentId: testDocument.id }, resolve);
    });
    
    await user1JoinPromise;

    // User 2 connects and joins the document
    const user2Socket = await connectClient(user2Token);
    const user2JoinPromise = new Promise((resolve) => {
      user2Socket.emit('joinDocument', { documentId: testDocument.id }, resolve);
    });
    
    await user2JoinPromise;

    // User 1 makes an edit
    const user1Edit = {
      documentId: testDocument.id,
      operation: {
        type: 'insert',
        position: 8,
        text: 'Collaborative ',
      },
      version: 1,
    };

    const user1EditPromise = new Promise<any>((resolve) => {
      user1Socket.emit('edit', user1Edit, resolve);
    });

    // User 2 makes a concurrent edit
    const user2Edit = {
      documentId: testDocument.id,
      operation: {
        type: 'insert',
        position: 0,
        text: 'Collaboration: ',
      },
      version: 1,
    };

    const user2EditPromise = new Promise<any>((resolve) => {
      user2Socket.emit('edit', user2Edit, resolve);
    });

    // Wait for both edits to be processed
    const [user1Result, user2Result] = await Promise.all([
      user1EditPromise,
      user2EditPromise,
    ]);

    // Verify both users received the same final state
    expect(user1Result).toMatchObject({
      success: true,
      document: {
        id: testDocument.id,
        content: 'Collaboration: Initial Collaborative content',
        version: 3, // Initial + 2 edits
      },
    });

    expect(user2Result).toMatchObject({
      success: true,
      document: {
        id: testDocument.id,
        content: 'Collaboration: Initial Collaborative content',
        version: 3, // Initial + 2 edits
      },
    });

    // Verify the document was updated in the database
    const updatedDoc = await Document.findByPk(testDocument.id);
    expect(updatedDoc?.content).toBe('Collaboration: Initial Collaborative content');
    expect(updatedDoc?.version).toBe(3);
  });

  it('should handle concurrent edits with operational transformation', async () => {
    // Reset document content
    await testDocument.update({ content: 'The quick brown fox', version: 1 });

    // User 1 connects and joins the document
    const user1Socket = await connectClient(user1Token);
    await new Promise((resolve) => {
      user1Socket.emit('joinDocument', { documentId: testDocument.id }, resolve);
    });

    // User 2 connects and joins the document
    const user2Socket = await connectClient(user2Token);
    await new Promise((resolve) => {
      user2Socket.emit('joinDocument', { documentId: testDocument.id }, resolve);
    });

    // User 1 makes an edit (insert at position 4)
    const user1Edit = {
      documentId: testDocument.id,
      operation: {
        type: 'insert',
        position: 4,
        text: 'very ',
      },
      version: 1,
    };

    // User 2 makes a concurrent edit (delete 'quick ')
    const user2Edit = {
      documentId: testDocument.id,
      operation: {
        type: 'delete',
        position: 4,
        length: 6, // 'quick '
      },
      version: 1,
    };

    // Send both edits
    const [user1Result, user2Result] = await Promise.all([
      new Promise<any>((resolve) => {
        user1Socket.emit('edit', user1Edit, resolve);
      }),
      new Promise<any>((resolve) => {
        user2Socket.emit('edit', user2Edit, resolve);
      }),
    ]);

    // Verify both users received the same final state
    expect(user1Result).toMatchObject({
      success: true,
      document: {
        content: 'The very brown fox',
        version: 3,
      },
    });

    expect(user2Result).toMatchObject({
      success: true,
      document: {
        content: 'The very brown fox',
        version: 3,
      },
    });

    // Verify the document was updated in the database
    const updatedDoc = await Document.findByPk(testDocument.id);
    expect(updatedDoc?.content).toBe('The very brown fox');
    expect(updatedDoc?.version).toBe(3);
  });

  it('should handle user disconnection', async () => {
    // User 1 connects and joins the document
    const user1Socket = await connectClient(user1Token);
    await new Promise((resolve) => {
      user1Socket.emit('joinDocument', { documentId: testDocument.id }, resolve);
    });

    // User 2 connects and joins the document
    const user2Socket = await connectClient(user2Token);
    await new Promise((resolve) => {
      user2Socket.emit('joinDocument', { documentId: testDocument.id }, resolve);
    });

    // User 1 disconnects
    user1Socket.disconnect();

    // User 2 should receive a userLeft event
    const userLeftPromise = new Promise<any>((resolve) => {
      user2Socket.once('userLeft', (data) => {
        resolve(data);
      });
    });

    const userLeftData = await userLeftPromise;
    expect(userLeftData).toMatchObject({
      userId: user1.id,
      documentId: testDocument.id,
    });
  });
});
