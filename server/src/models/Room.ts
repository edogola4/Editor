import { Model, DataTypes, Sequelize, Optional, Op } from "sequelize";
import { v4 as uuidv4 } from 'uuid';
import RoomMember from './RoomMember.js';
import RoomInvitation from './RoomInvitation.js';

// Room statistics interface
export interface RoomStatistics {
  totalSessions: number;
  totalEdits: number;
  averageSessionDuration: number;
  activeUsers: number;
  lastActive: Date;
}

// Define room settings interface
export interface RoomSettings {
  allowGuests: boolean;
  requireApproval: boolean;
  enableChat: boolean;
  enableVoice: boolean;
  maxIdleTime: number; // minutes
  autoSave: boolean;
  language: string;
  theme: string; // Editor theme
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
}

// Define user roles
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

// Define invitation status
export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// Define the attributes of the Room model
export interface RoomAttributes {
  id: string;
  name: string;
  description?: string | null;
  isPrivate: boolean;
  password?: string | null;
  maxUsers: number;
  ownerId: string;
  settings: RoomSettings;
  status: 'active' | 'inactive' | 'archived';
  lastActivityAt: Date;
  totalSessions: number;
  totalEdits: number;
  averageSessionDuration: number;
  activeUsers: number;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// Define the attributes required to create a new Room
export type RoomCreationAttributes = Optional<RoomAttributes, 
  | 'id' 
  | 'createdAt' 
  | 'updatedAt' 
  | 'lastActivityAt' 
  | 'totalSessions' 
  | 'totalEdits' 
  | 'averageSessionDuration' 
  | 'activeUsers' 
  | 'lastActive'
  | 'deletedAt'
  | 'description'
  | 'password'
>;

// Define the Room instance methods
export interface RoomInstance
  extends Model<RoomAttributes, RoomCreationAttributes>,
    RoomAttributes {
  // Instance methods
  addUser(userId: string): Promise<void>;
  removeUser(userId: string): Promise<void>;
  hasUser(userId: string): Promise<boolean>;
  getUserCount(): Promise<number>;
  isOwner(userId: string): boolean;
  canUserJoin(userId: string, providedPassword?: string): Promise<boolean>;
  updateSettings(newSettings: Partial<RoomSettings>): Promise<void>;
  archive(): Promise<void>;
  activate(): Promise<void>;
  [key: string]: any; // Allow additional methods
}

// Define the static methods of the Room model
export type RoomModelStatic = typeof Model & {
  new (values?: object, options?: any): RoomInstance;
  associate?: (models: any) => void;
  findByPk: (id: string, options?: any) => Promise<RoomInstance | null>;
  findOne: (options: any) => Promise<RoomInstance | null>;
  findAll: (options?: any) => Promise<RoomInstance[]>;
  
  // Room statistics methods
  getRoomStats: (roomId: string) => Promise<RoomStatistics>;
  cleanupInactiveRooms: (inactiveDays?: number) => Promise<number>;
  
  // Invitation methods
  createInvitation: (invitationData: Omit<RoomInvitation, 'id' | 'createdAt' | 'status' | 'token'>) => Promise<RoomInvitation>;
  getInvitation: (token: string) => Promise<RoomInvitation | null>;
  updateInvitationStatus: (token: string, status: InvitationStatus) => Promise<RoomInvitation | null>;
  
  // Member management methods
  addMember: (roomId: string, userId: string, role?: UserRole) => Promise<void>;
  removeMember: (roomId: string, userId: string) => Promise<boolean>;
  updateMemberRole: (roomId: string, userId: string, role: UserRole) => Promise<boolean>;
  getMembers: (roomId: string) => Promise<RoomMember[]>;
  
  // Helper methods
  hasPermission: (roomId: string, userId: string, requiredRole: UserRole) => Promise<boolean>;
  isMember: (roomId: string, userId: string) => Promise<boolean>;
};

/**
 * Initialize Room model
 */
export default function Room(sequelize: Sequelize): RoomModelStatic {
  // Initialize the Room model
  const RoomModel = sequelize.define<RoomInstance, RoomCreationAttributes>(
    'Room',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [3, 100],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isPrivate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_private', // Explicitly set the column name
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      maxUsers: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
        field: 'max_users', // Explicitly set the column name
        validate: {
          min: 1,
          max: 100,
        },
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'owner_id', // Explicitly set the column name
        references: {
          model: 'users',
          key: 'id',
        },
      },
      settings: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          allowGuests: true,
          requireApproval: false,
          enableChat: true,
          enableVoice: false,
          maxIdleTime: 30, // minutes
          autoSave: true,
          language: 'javascript',
          theme: 'vs-dark',
          tabSize: 2,
          wordWrap: true,
          minimap: true,
          lineNumbers: true,
        },
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'archived'),
        allowNull: false,
        defaultValue: 'active',
      },
      lastActivityAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'last_activity_at', // Explicitly set the column name
      },
      // Statistics
      totalSessions: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'total_sessions', // Explicitly set the column name
      },
      totalEdits: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'total_edits', // Explicitly set the column name
      },
      averageSessionDuration: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        field: 'average_session_duration', // Explicitly set the column name
      },
      activeUsers: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'active_users', // Explicitly set the column name
      },
      lastActive: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'last_active', // Explicitly set the column name
      },
    },
    {
      tableName: "rooms",
      timestamps: true,
      indexes: [
        {
          name: 'rooms_name_owner_id',
          unique: true,
          fields: ['name', 'owner_id']
        },
        {
          name: 'idx_rooms_status',
          fields: ['status']
        },
        {
          name: 'idx_rooms_created_at',
          fields: ['created_at']
        },
        {
          name: 'idx_rooms_updated_at',
          fields: ['updated_at']
        },
        {
          name: 'idx_rooms_owner_id',
          fields: ['owner_id']
        }
      ],
    }
  ) as unknown as RoomModelStatic;

  // Add static methods
  RoomModel.getRoomStats = async function(roomId: string): Promise<RoomStatistics> {
    const room = await this.findByPk(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    return {
      totalSessions: room.get('totalSessions') as number,
      totalEdits: room.get('totalEdits') as number,
      averageSessionDuration: room.get('averageSessionDuration') as number,
      activeUsers: room.get('activeUsers') as number,
      lastActive: room.get('lastActive') as Date
    };
  };

  RoomModel.cleanupInactiveRooms = async function(inactiveDays: number = 30): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - inactiveDays);
    
    const [count] = await this.update(
      { status: 'inactive' },
      {
        where: {
          lastActivityAt: {
            [Op.lt]: date
          },
          status: 'active'
        }
      }
    );
    
    return count;
  };

  // Add instance methods
  const roomPrototype = RoomModel.prototype as RoomInstance;

  /**
   * Check if a user is the owner of the room
   */
  roomPrototype.isOwner = function (userId: string): boolean {
    return this.ownerId === userId;
  };

  /**
   * Add a user to the room (this would typically be handled through a junction table)
   */
  roomPrototype.addUser = async function (userId: string): Promise<void> {
    // This would typically create a record in a room_users table
    // For now, we'll just log the operation
    console.log(`Adding user ${userId} to room ${this.id}`);
  };

  /**
   * Remove a user from the room
   */
  roomPrototype.removeUser = async function (userId: string): Promise<void> {
    // This would typically delete a record from a room_users table
    console.log(`Removing user ${userId} from room ${this.id}`);
  };

  /**
   * Check if a user is in the room
   */
  roomPrototype.hasUser = async function (userId: string): Promise<boolean> {
    // This would typically check a room_users table
    // For now, return false as we don't have the junction table implemented
    return false;
  };

  /**
   * Get the current user count in the room
   */
  roomPrototype.getUserCount = async function (): Promise<number> {
    // This would typically count records in a room_users table
    return 0;
  };

  /**
   * Check if a user can join the room
   */
  roomPrototype.canUserJoin = async function (
    userId: string,
    providedPassword?: string,
  ): Promise<boolean> {
    // Check if room is active
    if (this.status !== "active") {
      return false;
    }

    // Check if room is private and password is required
    if (this.isPrivate && this.password) {
      if (!providedPassword) {
        return false;
      }

      // In a real implementation, you'd hash the stored password and compare
      return providedPassword === this.password;
    }

    // Check if room is at max capacity
    const userCount = await this.getUserCount();
    if (userCount >= this.maxUsers) {
      return false;
    }

    // Check if user is already in the room (if you want to prevent duplicate joins)
    const alreadyInRoom = await this.hasUser(userId);
    if (alreadyInRoom) {
      return true; // Allow re-joining
    }

    return true;
  };

  /**
   * Update room settings
   */
  roomPrototype.updateSettings = async function (
    newSettings: Partial<RoomSettings>,
  ): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.save();
  };

  /**
   * Archive the room
   */
  roomPrototype.archive = async function (): Promise<void> {
    this.status = "archived";
    await this.save();
  };

  /**
   * Activate the room
   */
  roomPrototype.activate = async function (): Promise<void> {
    this.status = "active";
    await this.save();
  };

  return RoomModel;
}

// Export type for model static methods
type RoomModelStaticType = RoomModelStatic;

export { RoomModelStaticType as RoomModelStatic };
