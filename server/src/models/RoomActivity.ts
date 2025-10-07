import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export enum ActivityType {
  JOIN = 'join',
  LEAVE = 'leave',
  EDIT = 'edit',
  PERMISSION_CHANGE = 'permission_change',
  SETTINGS_UPDATE = 'settings_update',
  ROOM_CREATED = 'room_created',
  ROOM_ARCHIVED = 'room_archived',
  ROOM_ACTIVATED = 'room_activated',
  ROOM_DELETED = 'room_deleted',
}

export interface RoomActivityAttributes {
  id: string;
  roomId: string;
  userId: string;
  activityType: ActivityType;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface RoomActivityCreationAttributes 
  extends Optional<RoomActivityAttributes, 'id' | 'createdAt' | 'metadata' | 'ipAddress' | 'userAgent'> {}

export interface RoomActivityInstance 
  extends Model<RoomActivityAttributes, RoomActivityCreationAttributes>, 
    RoomActivityAttributes {}

export default function RoomActivity(sequelize: Sequelize) {
  const RoomActivityModel = sequelize.define<RoomActivityInstance, RoomActivityCreationAttributes>(
    'RoomActivity',
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
      },
      activityType: {
        type: DataTypes.ENUM(
          'join', 'leave', 'edit', 'permission_change', 
          'settings_update', 'room_archived', 'room_activated', 'room_deleted'
        ),
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      ipAddress: {
        type: DataTypes.STRING(45), // IPv6 length is 45 chars
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'room_activities',
      timestamps: true,
      updatedAt: false, // We only care about creation time
      indexes: [
        {
          fields: ['room_id'],
        },
        {
          fields: ['user_id'],
        },
        {
          fields: ['activity_type'],
        },
        {
          fields: ['created_at'],
        },
      ],
    }
  );

  return RoomActivityModel;
}
