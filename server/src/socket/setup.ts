import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { SocketService } from './socket.service.js';
import { redis as redisClient } from '../config/redis.js';

export const setupSocketIO = (server: HttpServer): SocketService => {
  // Use the Redis client directly
  return new SocketService(server, redisClient);
};

export const cleanupSocketIO = async (): Promise<void> => {
  await redisClient.quit();
};
