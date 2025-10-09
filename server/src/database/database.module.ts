import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { RoomParticipant } from '../entities/room-participant.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'collab_editor'),
        entities: [
          User,
          ChatMessage,
          ChatRoom,
          RoomParticipant,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      ChatMessage,
      ChatRoom,
      RoomParticipant,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
