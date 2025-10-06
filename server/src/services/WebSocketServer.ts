import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { redis } from './RedisClient';
import { SocketService } from './SocketService';
import { wsRateLimiter } from '../middleware/rateLimiter';

class WebSocketServer {
  private io: SocketIOServer;
  private socketService: SocketService;
  private static instance: WebSocketServer;

  private constructor(server: HttpServer | HttpsServer) {
    // Initialize Socket.IO server with CORS and other options
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 10000,
      pingInterval: 5000,
      transports: ['websocket', 'polling'],
      allowEIO3: true,
    });

    // Initialize SocketService with Redis
    this.socketService = new SocketService(server, redis.redis);

    this.setupEventHandlers();
  }

  public static getInstance(server?: HttpServer | HttpsServer): WebSocketServer {
    if (!WebSocketServer.instance && server) {
      WebSocketServer.instance = new WebSocketServer(server);
    } else if (!WebSocketServer.instance) {
      throw new Error('WebSocketServer not initialized. Please provide an HTTP server instance.');
    }
    return WebSocketServer.instance;
  }

  private setupEventHandlers(): void {
    // Middleware for rate limiting
    this.io.use((socket, next) => {
      wsRateLimiter(socket, next);
    });

    // Connection event
    this.io.on('connection', (socket) => {
      console.log(`New connection: ${socket.id}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  public getSocketService(): SocketService {
    return this.socketService;
  }

  public async close(): Promise<void> {
    try {
      // Close all socket connections
      this.io.sockets.sockets.forEach((socket) => {
        socket.disconnect(true);
      });

      // Close the Socket.IO server
      await new Promise<void>((resolve) => {
        this.io.close(() => {
          console.log('WebSocket server closed');
          resolve();
        });
      });
    } catch (error) {
      console.error('Error closing WebSocket server:', error);
      throw error;
    }
  }
}

export { WebSocketServer };

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down WebSocket server...');
  try {
    if (WebSocketServer['instance']) {
      await WebSocketServer['instance'].close();
    }
    process.exit(0);
  } catch (error) {
    console.error('Error during WebSocket server shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
