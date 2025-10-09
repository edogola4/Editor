import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { RoomParticipant } from './room-participant.entity';

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: false })
  isGroup: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    description?: string;
    createdBy?: string;
    isPublic?: boolean;
  };

  @OneToMany(() => ChatMessage, message => message.room)
  messages: ChatMessage[];

  @OneToMany(() => RoomParticipant, participant => participant.room)
  participants: RoomParticipant[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
