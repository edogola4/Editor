import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { RoomInstance } from './Room';
import { UserRole } from './Room';

export interface RoomMemberAttributes {
  id: string;
  roomId: string;
  userId: string;
  role: UserRole;
  joinedAt: Date;
  lastSeen: Date;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomMemberCreationAttributes extends Optional<RoomMemberAttributes, 'id' | 'createdAt' | 'updatedAt' | 'joinedAt' | 'lastSeen' | 'isOnline'> {}

export interface RoomMemberInstance extends Model<RoomMemberAttributes, RoomMemberCreationAttributes>, RoomMemberAttributes {
  // Instance methods can be added here if needed
}

export default function RoomMember(sequelize: Sequelize) {
  const RoomMemberModel = sequelize.define<RoomMemberInstance, RoomMemberCreationAttributes>(
    'RoomMember',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roomId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'rooms',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      role: {
        type: DataTypes.ENUM('owner', 'editor', 'viewer'),
        allowNull: false,
        defaultValue: 'viewer',
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      lastSeen: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      isOnline: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'room_members',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['room_id', 'user_id'],
        },
        {
          fields: ['user_id'],
        },
        {
          fields: ['is_online'],
        },
      ],
    }
  );

  // Associations will be set up in the index.ts file
  
  return RoomMemberModel;
}
