import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { UserRole, InvitationStatus } from './Room';

export interface RoomInvitationAttributes {
  id: string;
  roomId: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  expiresAt: Date;
  invitedBy: string;
  token: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomInvitationCreationAttributes 
  extends Optional<RoomInvitationAttributes, 'id' | 'createdAt' | 'updatedAt' | 'status'> {}

export interface RoomInvitationInstance 
  extends Model<RoomInvitationAttributes, RoomInvitationCreationAttributes>, 
    RoomInvitationAttributes {
  // Instance methods can be added here if needed
  isExpired: () => boolean;
}

export default function RoomInvitation(sequelize: Sequelize) {
  const RoomInvitationModel = sequelize.define<RoomInvitationInstance, RoomInvitationCreationAttributes>(
    'RoomInvitation',
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
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      role: {
        type: DataTypes.ENUM('owner', 'editor', 'viewer'),
        allowNull: false,
        defaultValue: 'viewer',
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'expired'),
        allowNull: false,
        defaultValue: 'pending',
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      invitedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      token: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'room_invitations',
      timestamps: true,
      indexes: [
        {
          name: 'room_invitations_room_id_email_status',
          unique: true,
          fields: ['room_id', 'email', 'status'],
          where: {
            status: 'pending',
          },
        },
        {
          fields: ['token'],
          unique: true,
        },
        {
          fields: ['email'],
        },
        {
          fields: ['expires_at'],
        },
      ],
    }
  );

  // Add instance method to check if invitation is expired
  RoomInvitationModel.prototype.isExpired = function(): boolean {
    return new Date() > this.expiresAt;
  };

  // Add hook to check for expiration before finding
  RoomInvitationModel.addHook('beforeFind', (options: any) => {
    if (!options.where) options.where = {};
    
    // Add condition to filter out expired invitations
    if (!options.where.expiresAt) {
      options.where.expiresAt = { [Sequelize.Op.gt]: new Date() };
    }
  });

  // Add hook to update status if expired
  RoomInvitationModel.addHook('beforeSave', async (invitation: RoomInvitationInstance) => {
    if (invitation.status === 'pending' && invitation.isExpired()) {
      invitation.status = 'expired';
    }
  });

  return RoomInvitationModel;
}
