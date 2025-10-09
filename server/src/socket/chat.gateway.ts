import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../auth/ws-jwt-auth.guard';
import { ChatService } from './services/chat.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'chat',
})
@UseGuards(WsJwtAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    const user = client.user; // Attached by WsJwtAuthGuard
    if (!user) {
      client.disconnect(true);
      return;
    }

    await this.chatService.handleConnection(client, user);
  }

  async handleDisconnect(client: Socket) {
    await this.chatService.handleDisconnect(client);
  }

  @SubscribeMessage('send_message')
  async handleMessage(client: Socket, payload: any) {
    return this.chatService.handleSendMessage(client, payload);
  }

  @SubscribeMessage('typing')
  async handleTyping(client: Socket, payload: any) {
    return this.chatService.handleTyping(client, payload);
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(client: Socket, payload: any) {
    return this.chatService.handleMarkAsRead(client, payload);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(client: Socket, roomId: string) {
    return this.chatService.handleJoinRoom(client, roomId);
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(client: Socket, roomId: string) {
    return this.chatService.handleLeaveRoom(client, roomId);
  }

  @SubscribeMessage('get_messages')
  async handleGetMessages(client: Socket, payload: { roomId: string; before?: string; limit?: number }) {
    return this.chatService.handleGetMessages(client, payload);
  }
}
