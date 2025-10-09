import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindManyOptions, LessThan } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { RoomParticipant } from '../entities/room-participant.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ChatRepository {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatRoom)
    private readonly roomRepository: Repository<ChatRoom>,
    @InjectRepository(RoomParticipant)
    private readonly participantRepository: Repository<RoomParticipant>,
  ) {}

  // Room methods
  async findRoomById(roomId: string): Promise<ChatRoom | undefined> {
    return this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['participants', 'participants.user'],
    });
  }

  async createRoom(name: string, isGroup: boolean, createdBy: string): Promise<ChatRoom> {
    const room = this.roomRepository.create({
      name,
      isGroup,
      metadata: {
        createdBy,
        isPublic: true, // Default to public rooms
      },
    });
    return this.roomRepository.save(room);
  }

  // Message methods
  async saveMessage(message: Partial<ChatMessage>): Promise<ChatMessage> {
    return this.messageRepository.save(message);
  }

  async findMessages(
    roomId: string,
    options: {
      before?: string;
      limit?: number;
    } = {},
  ): Promise<ChatMessage[]> {
    const { before, limit = 50 } = options;
    
    const query: FindManyOptions<ChatMessage> = {
      where: { roomId },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
      relations: ['user'],
    };

    if (before) {
      query.where = {
        ...query.where,
        createdAt: LessThan(new Date(before)),
      };
    }

    return this.messageRepository.find(query);
  }

  // Participant methods
  async addParticipant(roomId: string, userId: string): Promise<RoomParticipant> {
    const participant = this.participantRepository.create({
      roomId,
      userId,
      unreadCount: 0,
      status: {
        isTyping: false,
        isOnline: false,
        lastActive: new Date(),
      },
    });
    return this.participantRepository.save(participant);
  }

  async updateParticipantStatus(
    roomId: string,
    userId: string,
    status: Partial<RoomParticipant['status']>,
  ): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { roomId, userId },
    });

    if (participant) {
      await this.participantRepository.update(participant.id, {
        status: {
          ...participant.status,
          ...status,
          lastActive: new Date(),
        },
      });
    }
  }

  async markMessagesAsRead(roomId: string, userId: string, messageId: string): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { roomId, userId },
    });

    if (participant) {
      await this.participantRepository.update(participant.id, {
        lastReadAt: new Date(),
        unreadCount: 0,
      });
    }
  }

  async incrementUnreadCount(roomId: string, excludeUserId: string): Promise<void> {
    await this.participantRepository
      .createQueryBuilder()
      .update(RoomParticipant)
      .set({
        unreadCount: () => 'unread_count + 1',
      })
      .where('room_id = :roomId AND user_id != :excludeUserId', {
        roomId,
        excludeUserId,
      })
      .execute();
  }
}
