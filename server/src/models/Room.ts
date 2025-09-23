import { Model, DataTypes, Sequelize, Optional } from "sequelize";

// Define the attributes of the Room model
export interface RoomAttributes {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  password?: string; // For private rooms
  maxUsers: number;
  ownerId: string;
  settings: RoomSettings;
  status: "active" | "inactive" | "archived";
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Define the attributes required to create a new Room
export interface RoomCreationAttributes
  extends Optional<
    RoomAttributes,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "isPrivate"
    | "maxUsers"
    | "settings"
    | "status"
  > {}

// Define room settings interface
export interface RoomSettings {
  allowGuests: boolean;
  requireApproval: boolean;
  enableChat: boolean;
  enableVoice: boolean;
  maxIdleTime: number; // minutes
  autoSave: boolean;
  language: string; // Default programming language
  theme: string; // Editor theme
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
}

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
  // Add other static methods as needed
};

/**
 * Initialize Room model
 */
export default function Room(sequelize: Sequelize): RoomModelStatic {
  // Define the model
  const RoomModel = sequelize.define<RoomInstance>(
    "Room",
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
          len: [1, 100],
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, 1000],
        },
      },
      isPrivate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [6, 255],
        },
      },
      maxUsers: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        allowNull: false,
        validate: {
          min: 1,
          max: 100,
        },
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      settings: {
        type: DataTypes.JSON,
        defaultValue: {
          allowGuests: false,
          requireApproval: false,
          enableChat: true,
          enableVoice: false,
          maxIdleTime: 30,
          autoSave: true,
          language: "javascript",
          theme: "vs-dark",
          tabSize: 2,
          wordWrap: true,
          minimap: true,
          lineNumbers: true,
        },
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive", "archived"),
        defaultValue: "active",
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "rooms",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["name", "owner_id"],
        },
        {
          fields: ["status"],
        },
        {
          fields: ["created_at"],
        },
        {
          fields: ["owner_id"],
        },
      ],
    },
  ) as unknown as RoomModelStatic;

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

// Export types
export { RoomAttributes, RoomInstance, RoomModelStatic, RoomSettings };
