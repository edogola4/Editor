import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { ChatRoom } from './chat-room.entity';

@Entity('room_participants')
export class RoomParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'room_id' })
  roomId: string;

  @ManyToOne(() => ChatRoom, room => room.participants)
  @JoinColumn({ name: 'room_id' })
  room: ChatRoom;

  @Column({ default: 0 })
  unreadCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastReadAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  status: {
    isTyping: boolean;
    lastActive: Date;
    isOnline: boolean;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
