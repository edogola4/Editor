import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Repository } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../models/index.js';
import { redisClient } from '../../config/redis.js';
import { ChatRepository } from '../repositories/chat.repository.js';
import { 
  ChatMessage, 
  ChatRoom, 
  ChatUser, 
  ChatEvent, 
  ChatServerEvent, 
  SendMessagePayload, 
  ReactToMessagePayload,
  ChatResponse,
  ChatError,
  ChatServiceOptions
} from '../../types/chat';

// Default configuration for the chat service
export const DEFAULT_CHAT_OPTIONS: ChatServiceOptions = {
  maxMessagesPerRoom: 1000,
  maxMessageLength: 5000,
  maxReactionsPerMessage: 20,
  maxRoomsPerUser: 50,
  maxUsersPerRoom: 100,
  messageRetentionPeriod: 30 * 24 * 60 * 60, // 30 days in seconds
  enableHistory: true,
  maxHistoryMessages: 100,
  enableTypingIndicators: true,
  enableReadReceipts: true,
  enableReactions: true,
  enableReplies: true,
  enableMentions: true,
  enableFileUploads: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
};

// Rate limiting configuration for chat messages
const messageRateLimiter = new RateLimiterMemory({
  points: 10, // 10 messages
  duration: 60, // per 60 seconds per user
});

// Rate limiting for reactions
const reactionRateLimiter = new RateLimiterMemory({
  points: 30, // 30 reactions
  duration: 60, // per 60 seconds per user
});

// In-memory storage for chat rooms (in production, use a database)
const chatRooms = new Map<string, ChatRoom>();
const userSessions = new Map<string, { userId: string; socketId: string }>();
const typingUsers = new Map<string, NodeJS.Timeout>(); // userId -> timeout

// Initialize default chat room
const DEFAULT_ROOM_ID = 'general';

const initializeDefaultRoom = () => {
  if (!chatRooms.has(DEFAULT_ROOM_ID)) {
    chatRooms.set(DEFAULT_ROOM_ID, {
      id: DEFAULT_ROOM_ID,
      name: 'General Chat',
      participants: [],
      unreadCount: 0,
      isGroup: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
};

/**
 * ChatService handles real-time chat functionality including:
 * - Room management
 * - Message sending/receiving
 * - Typing indicators
 * - Message reactions
 * - User presence
 */
@Injectable()
export class ChatService {
  private userId: string | null = null;

  constructor(
    private readonly chatRepository: ChatRepository,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject('IO_SERVER')
    private readonly io: Server,
    @Inject('SOCKET')
    private readonly socket: any, // Using any to avoid type complexity
    @Inject('CHAT_OPTIONS')
    private readonly options: ChatServiceOptions = DEFAULT_CHAT_OPTIONS
  ) {
    this.initialize();
  }

  onModuleInit() {
    // Initialize default room if it doesn't exist
    initializeDefaultRoom();
  }

  /**
   * Initialize the chat service with event handlers and authentication
   */
  public initialize(): void {
    // Middleware to authenticate user
    this.socket.use(async (packet, next) => {
      const token = packet[1]?.token;
      if (!token) return next(new Error('Authentication error: No token provided'));

      try {
        // In a real app, verify the token and get user info from auth service
        // For now, we'll just use the token as the user ID
        this.userId = token;
        
        // Store user session
        userSessions.set(this.socket.id, { 
          userId: this.userId, 
          socketId: this.socket.id 
        });
        
        next();
      } catch (error) {
        console.error('Authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Register event handlers
    this.registerEventHandlers();
    
    // Join default room
    this.socket.once('connect', () => {
      if (this.userId) {
        this.handleJoinRoom({ roomId: DEFAULT_ROOM_ID }, (response) => {
          if (!response.success) {
            console.error('Failed to join default room:', response.error);
          }
        });
      }
    });
  }

  private registerEventHandlers(): void {
    this.socket.on('join_room', this.handleJoinRoom.bind(this));
    this.socket.on('leave_room', this.handleLeaveRoom.bind(this));
    this.socket.on('send_message', this.handleSendMessage.bind(this));
    this.socket.on('react_to_message', this.handleReactToMessage.bind(this));
    this.socket.on('typing', this.handleTyping.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
  }

  private async handleJoinRoom(
    { roomId }: { roomId: string },
    callback: (response: { success: boolean; error?: string; room?: ChatRoom }) => void
  ): Promise<void> {
    if (!this.userId) {
      return callback({ success: false, error: 'Not authenticated' });
    }

    try {
      // Get or create room
      let room = chatRooms.get(roomId);
      if (!room) {
        room = {
          id: roomId,
          name: roomId,
          participants: [this.userId],
          unreadCount: 0,
          isGroup: true,
        };
        chatRooms.set(roomId, room);
      } else if (!room.participants.includes(this.userId)) {
        room.participants.push(this.userId);
      }

      // Join the socket room
      this.socket.join(roomId);
      
      // Store user session
      userSessions.set(this.socket.id, { userId: this.userId, socketId: this.socket.id });

      // Notify room that user joined
      this.io.to(roomId).emit('chat_event', {
        type: 'USER_JOINED',
        payload: {
          roomId,
          user: await this.getUserInfo(this.userId),
        },
      });

      callback({ success: true, room });
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ success: false, error: 'Failed to join room' });
    }
  }

  private async handleLeaveRoom(
    { roomId }: { roomId: string },
    callback: (response: { success: boolean; error?: string }) => void
  ): Promise<void> {
    if (!this.userId) {
      return callback({ success: false, error: 'Not authenticated' });
    }

    try {
      const room = chatRooms.get(roomId);
      if (room) {
        room.participants = room.participants.filter((id) => id !== this.userId);
        
        // Remove room if empty
        if (room.participants.length === 0 && room.id !== DEFAULT_ROOM_ID) {
          chatRooms.delete(roomId);
        }
      }

      // Leave the socket room
      this.socket.leave(roomId);

      // Notify room that user left
      this.io.to(roomId).emit('chat_event', {
        type: 'USER_LEFT',
        payload: {
          roomId,
          userId: this.userId,
        },
      });

      callback({ success: true });
    } catch (error) {
      console.error('Error leaving room:', error);
      callback({ success: false, error: 'Failed to leave room' });
    }
  }

  private async handleSendMessage(
    { roomId, content, mentions = [], isCodeSnippet = false, codeLanguage }: 
    { roomId: string; content: string; mentions?: string[]; isCodeSnippet?: boolean; codeLanguage?: string },
    callback: (response: { success: boolean; error?: string; message?: ChatMessage }) => void
  ): Promise<void> {
    if (!this.userId) {
      return callback({ success: false, error: 'Not authenticated' });
    }

    try {
      const room = chatRooms.get(roomId);
      if (!room) {
        return callback({ success: false, error: 'Room not found' });
      }

      if (!room.participants.includes(this.userId)) {
        return callback({ success: false, error: 'Not a member of this room' });
      }

      const message: ChatMessage = {
        id: uuidv4(),
        userId: this.userId,
        username: `User${this.userId.slice(0, 5)}`, // In a real app, get from user service
        content,
        timestamp: Date.now(),
        isCodeSnippet,
        codeLanguage,
        mentions,
      };

      // Store message in Redis (in a real app, you might use a database)
      const messageKey = `chat:${roomId}:messages`;
      await redisClient.lpush(messageKey, JSON.stringify(message));
      await redisClient.ltrim(messageKey, 0, 999); // Keep last 1000 messages

      // Update last message in room
      room.lastMessage = message;
      room.unreadCount += 1;

      // Emit message to room
      this.io.to(roomId).emit('chat_event', {
        type: 'MESSAGE',
        payload: {
          roomId,
          message,
        },
      });

      // Notify mentioned users
      if (mentions.length > 0) {
        const mentionedSockets = Array.from(userSessions.entries())
          .filter(([_, session]) => mentions.includes(session.userId))
          .map(([socketId]) => socketId);

        if (mentionedSockets.length > 0) {
          this.io.to(mentionedSockets).emit('chat_event', {
            type: 'MENTION',
            payload: {
              roomId,
              messageId: message.id,
              mentionedBy: this.userId,
            },
          });
        }
      }

      callback({ success: true, message });
    } catch (error) {
      console.error('Error sending message:', error);
      callback({ success: false, error: 'Failed to send message' });
    }
  }

  private async handleReactToMessage(
    { roomId, messageId, emoji }: { roomId: string; messageId: string; emoji: string },
    callback: (response: { success: boolean; error?: string }) => void
  ): Promise<void> {
    if (!this.userId) {
      return callback({ success: false, error: 'Not authenticated' });
    }

    try {
      const messageKey = `chat:${roomId}:messages`;
      const messages = await redisClient.lrange(messageKey, 0, -1);
      const messageIndex = messages.findIndex((msg) => {
        const parsed = JSON.parse(msg);
        return parsed.id === messageId;
      });

      if (messageIndex === -1) {
        return callback({ success: false, error: 'Message not found' });
      }

      const message: ChatMessage = JSON.parse(messages[messageIndex]);
      if (!message.reactions) {
        message.reactions = {};
      }
      if (!message.reactions[emoji]) {
        message.reactions[emoji] = [];
      }

      // Toggle reaction
      const reactionIndex = message.reactions[emoji].indexOf(this.userId);
      if (reactionIndex === -1) {
        message.reactions[emoji].push(this.userId);
      } else {
        message.reactions[emoji].splice(reactionIndex, 1);
        if (message.reactions[emoji].length === 0) {
          delete message.reactions[emoji];
        }
      }

      // Update message in Redis
      await redisClient.lset(messageKey, messageIndex, JSON.stringify(message));

      // Emit reaction to room
      this.io.to(roomId).emit('chat_event', {
        type: 'MESSAGE_REACTION',
        payload: {
          roomId,
          messageId,
          emoji,
          userId: this.userId,
        },
      });

      callback({ success: true });
    } catch (error) {
      console.error('Error reacting to message:', error);
      callback({ success: false, error: 'Failed to react to message' });
    }
  }

  private handleTyping({ roomId, isTyping }: { roomId: string; isTyping: boolean }): void {
    if (!this.userId) return;
    
    this.socket.to(roomId).emit('chat_event', {
      type: 'USER_TYPING',
      payload: {
        roomId,
        userId: this.userId,
        isTyping,
      },
    });
  }

  private handleDisconnect(): void {
    if (!this.userId) return;
    
    // Remove user session
    userSessions.delete(this.socket.id);
    
    // Notify all rooms the user was in
    for (const [roomId, room] of chatRooms.entries()) {
      if (room.participants.includes(this.userId!)) {
        this.io.to(roomId).emit('chat_event', {
          type: 'USER_LEFT',
          payload: {
            roomId,
            userId: this.userId,
          },
        });
      }
    }
  }

  private async getUserInfo(userId: string): Promise<ChatUser> {
    // In a real app, fetch user info from the database
    return {
      id: userId,
      username: `User${userId.slice(0, 5)}`,
      color: `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')}`,
      isOnline: true,
    };
  }
}
