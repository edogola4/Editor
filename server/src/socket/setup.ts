import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { SocketService } from './socket.service.js';
import RedisClient from '../config/redis.js';

export const setupSocketIO = (server: HttpServer): SocketService => {
  // Initialize Redis client
  const redisClient = RedisClient.getInstance();
  
  // Create and return the SocketService instance
  return new SocketService(server, redisClient);
};

export const cleanupSocketIO = async (): Promise<void> => {
  await RedisClient.disconnect();
};
