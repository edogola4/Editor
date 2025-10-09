import { io, Socket } from 'socket.io-client';
import { ChatEvent, ChatMessage, ChatRoom, ChatUser, ReactToMessagePayload, SendMessagePayload } from '@/types/chat';

type EventHandler = (event: ChatEvent) => void;

export class ChatService {
  private socket: Socket | null = null;
  private eventHandlers: Set<EventHandler> = new Set();
  private static instance: ChatService;

  private constructor() {}

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  public connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      auth: { token },
      path: '/chat',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from chat server:', reason);
    });

    this.socket.on('chat_event', (event: ChatEvent) => {
      this.notifyHandlers(event);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public subscribe(handler: EventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private notifyHandlers(event: ChatEvent): void {
    this.eventHandlers.forEach((handler) => handler(event));
  }

  public async sendMessage(payload: SendMessagePayload): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to chat server'));
        return;
      }

      this.socket.emit('send_message', payload, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to send message'));
        }
      });
    });
  }

  public async reactToMessage(payload: ReactToMessagePayload): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to chat server'));
        return;
      }

      this.socket.emit('react_to_message', payload, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to react to message'));
        }
      });
    });
  }

  public async loadRoomHistory(roomId: string, before?: number, limit = 50): Promise<ChatMessage[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to chat server'));
        return;
      }

      this.socket.emit(
        'load_history',
        { roomId, before, limit },
        (response: { success: boolean; messages?: ChatMessage[]; error?: string }) => {
          if (response.success && response.messages) {
            resolve(response.messages);
          } else {
            reject(new Error(response.error || 'Failed to load chat history'));
          }
        }
      );
    });
  }

  public async joinRoom(roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to chat server'));
        return;
      }

      this.socket.emit('join_room', { roomId }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to join room'));
        }
      });
    });
  }

  public async leaveRoom(roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to chat server'));
        return;
      }

      this.socket.emit('leave_room', { roomId }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to leave room'));
        }
      });
    });
  }
}

export const chatService = ChatService.getInstance();
