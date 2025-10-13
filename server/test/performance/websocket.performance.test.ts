import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { io as Client } from 'socket.io-client';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { AddressInfo } from 'net';
import { app } from '../../src/app';
import { setupTestEnvironment, cleanupTestEnvironment } from '../test-utils';

describe('WebSocket Performance Tests', () => {
  let httpServer: any;
  let io: any;
  let serverAddr: AddressInfo;
  const PORT = 3000;
  const NUM_CLIENTS = 100;
  const MESSAGES_PER_CLIENT = 100;
  
  beforeAll(async () => {
    await setupTestEnvironment();
    
    // Create HTTP server
    httpServer = createServer(app);
    io = new Server(httpServer);
    
    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(PORT, () => {
        serverAddr = httpServer.address() as AddressInfo;
        resolve();
      });
    });
    
    // Set up basic socket.io event handlers
    io.on('connection', (socket: any) => {
      socket.on('echo', (data: any, callback: any) => {
        if (callback) {
          callback(data);
        }
      });
      
      socket.on('joinRoom', (roomId: string) => {
        socket.join(roomId);
      });
      
      socket.on('chatMessage', (data: any) => {
        socket.to(data.roomId).emit('chatMessage', data);
      });
    });
  });
  
  afterAll(async () => {
    // Close server
    await new Promise<void>((resolve) => {
      io.close(() => {
        httpServer.close(() => {
          resolve();
        });
      });
    });
    
    await cleanupTestEnvironment();
  });
  
  describe('Connection Handling', () => {
    it(`should handle ${NUM_CLIENTS} concurrent connections`, async () => {
      const clients = [];
      const connectPromises = [];
      
      // Create and connect multiple clients
      for (let i = 0; i < NUM_CLIENTS; i++) {
        const connectPromise = new Promise((resolve) => {
          const client = Client(`http://localhost:${PORT}`, {
            transports: ['websocket'],
            reconnection: false,
            timeout: 10000,
          });
          
          client.on('connect', () => {
            clients.push(client);
            resolve(client);
          });
          
          client.on('connect_error', (err: any) => {
            console.error('Connection error:', err);
            resolve(null);
          });
        });
        
        connectPromises.push(connectPromise);
      }
      
      // Wait for all clients to connect or timeout
      const results = await Promise.all(connectPromises);
      const connectedClients = results.filter(Boolean);
      
      // Verify all clients connected successfully
      expect(connectedClients.length).toBe(NUM_CLIENTS);
      
      // Clean up
      connectedClients.forEach((client: any) => client.disconnect());
    }, 30000); // Increased timeout for this test
  });
  
  describe('Message Throughput', () => {
    it(`should handle ${MESSAGES_PER_CLIENT} messages from ${NUM_CLIENTS} clients`, async () => {
      const MESSAGE = 'test';
      const ROOM_ID = 'test-room';
      const clients = [];
      const messagePromises = [];
      
      // Create and connect clients
      for (let i = 0; i < NUM_CLIENTS; i++) {
        const client = Client(`http://localhost:${PORT}`, {
          transports: ['websocket'],
          reconnection: false,
        });
        
        await new Promise<void>((resolve) => {
          client.on('connect', () => {
            clients.push(client);
            client.emit('joinRoom', ROOM_ID);
            resolve();
          });
        });
      }
      
      // Start time measurement
      const startTime = Date.now();
      
      // Send messages from each client
      for (let i = 0; i < NUM_CLIENTS; i++) {
        const client = clients[i];
        
        for (let j = 0; j < MESSAGES_PER_CLIENT; j++) {
          const messagePromise = new Promise((resolve) => {
            client.emit('chatMessage', {
              roomId: ROOM_ID,
              text: `${MESSAGE}-${i}-${j}`,
              timestamp: Date.now(),
            }, resolve);
          });
          
          messagePromises.push(messagePromise);
        }
      }
      
      // Wait for all messages to be sent
      await Promise.all(messagePromises);
      
      // Calculate metrics
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000; // in seconds
      const totalMessages = NUM_CLIENTS * MESSAGES_PER_CLIENT;
      const messagesPerSecond = totalMessages / totalTime;
      
      console.log(`\nPerformance Metrics:`);
      console.log(`Total Messages: ${totalMessages}`);
      console.log(`Total Time: ${totalTime.toFixed(2)}s`);
      console.log(`Messages per Second: ${messagesPerSecond.toFixed(2)}`);
      
      // Basic performance assertion
      expect(messagesPerSecond).toBeGreaterThan(100); // At least 100 messages per second
      
      // Clean up
      clients.forEach((client) => client.disconnect());
    }, 60000); // Increased timeout for this test
  });
  
  describe('Latency', () => {
    it('should maintain low latency for echo responses', async () => {
      const client = Client(`http://localhost:${PORT}`, {
        transports: ['websocket'],
      });
      
      // Measure round-trip time for echo
      const startTime = process.hrtime();
      const TEST_MESSAGE = { test: 'performance' };
      
      await new Promise<void>((resolve) => {
        client.emit('echo', TEST_MESSAGE, (response: any) => {
          const [seconds, nanoseconds] = process.hrtime(startTime);
          const latencyMs = (seconds * 1000) + (nanoseconds / 1000000);
          
          console.log(`\nEcho Latency: ${latencyMs.toFixed(2)}ms`);
          
          expect(response).toEqual(TEST_MESSAGE);
          expect(latencyMs).toBeLessThan(100); // Less than 100ms latency
          
          client.disconnect();
          resolve();
        });
      });
    });
  });
});
