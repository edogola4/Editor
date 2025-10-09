import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { io as clientIo, Socket as ClientSocket } from 'socket.io-client';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { EnhancedSocketService } from '../EnhancedSocketService';
import { SocketEvent } from '../types';

describe('EnhancedSocketService Integration', () => {
  let io: any;
  let serverSocket: any;
  let httpServer: any;
  let clientSocket: ClientSocket;
  let socketService: EnhancedSocketService;
  const testPort = 3001;

  beforeAll((done) => {
    // Create HTTP server
    httpServer = createServer();
    
    // Create Socket.IO server
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Start listening
    httpServer.listen(testPort, () => {
      // Create client connection
      clientSocket = clientIo(`http://localhost:${testPort}`);
      
      // Set up server-side socket handling
      io.on('connection', (socket: any) => {
        serverSocket = socket;
        
        // Echo back any received events
        socket.onAny((event: string, ...args: any[]) => {
          socket.emit(event, ...args);
        });
        
        // Special handling for ping/pong
        socket.on('ping', (cb: () => void) => {
          if (cb) cb();
        });
      });
      
      // Initialize the service
      socketService = new EnhancedSocketService({
        url: `http://localhost:${testPort}`,
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 100,
        reconnectionDelayMax: 1000,
        timeout: 5000,
      });
      
      done();
    });
  });

  afterAll(() => {
    // Clean up
    io.close();
    httpServer.close();
    if (clientSocket) clientSocket.close();
    if (socketService) socketService.dispose();
  });

  it('should connect to the server', async () => {
    await socketService.connect();
    expect(socketService.state.isConnected).toBe(true);
  });

  it('should send and receive messages', async () => {
    const testMessage = { text: 'Hello, server!' };
    const messagePromise = new Promise((resolve) => {
      const handler = (data: any) => {
        serverSocket.off('chat:message', handler);
        resolve(data);
      };
      serverSocket.on('chat:message', handler);
    });
    
    await socketService.connect();
    socketService.emit('chat:message', testMessage);
    
    const receivedData = await messagePromise;
    expect(receivedData).toEqual(testMessage);
  });

  it('should handle document operations', async () => {
    const operation = { type: 'insert', position: 0, text: 'test' };
    const operationPromise = new Promise((resolve) => {
      const handler = (data: any) => {
        serverSocket.off(SocketEvent.DOCUMENT_CHANGE, handler);
        resolve(data);
      };
      serverSocket.on(SocketEvent.DOCUMENT_CHANGE, handler);
    });
    
    await socketService.connect();
    socketService.sendOperation(operation);
    
    const receivedOperation = await operationPromise;
    expect(receivedOperation).toEqual(operation);
  });

  it('should handle cursor updates with throttling', async () => {
    const cursorUpdatePromise = new Promise((resolve) => {
      let updateCount = 0;
      const handler = (data: any) => {
        updateCount++;
        if (updateCount >= 2) {
          serverSocket.off(SocketEvent.CURSOR_UPDATE, handler);
          resolve(updateCount);
        }
      };
      serverSocket.on(SocketEvent.CURSOR_UPDATE, handler);
    });
    
    await socketService.connect();
    
    // Send multiple cursor updates quickly
    for (let i = 0; i < 10; i++) {
      socketService.sendCursorUpdate({ x: i, y: i });
    }
    
    // Wait for updates to be processed
    const updateCount = await cursorUpdatePromise;
    
    // Should have received fewer updates than sent due to throttling
    expect(updateCount).toBeLessThan(10);
  });

  it('should handle disconnection and reconnection', async () => {
    await socketService.connect();
    expect(socketService.state.isConnected).toBe(true);
    
    // Simulate server disconnection
    serverSocket.disconnect(true);
    
    // Wait for client to detect disconnection
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(socketService.state.isConnected).toBe(false);
    
    // Should attempt to reconnect
    expect(socketService.state.isReconnecting).toBe(true);
  });
});
