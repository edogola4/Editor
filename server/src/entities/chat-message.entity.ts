import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { ChatRoom } from './chat-room.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  reactions: Record<string, string[]>; // emoji -> user IDs

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    isCodeSnippet?: boolean;
    codeLanguage?: string;
    mentions?: string[];
    replyTo?: string;
    isDeleted?: boolean;
    deletedAt?: Date;
  };

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'room_id' })
  roomId: string;

  @ManyToOne(() => ChatRoom, room => room.messages)
  @JoinColumn({ name: 'room_id' })
  room: ChatRoom;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
