import { Model, DataTypes, Sequelize, Optional } from "sequelize";

// Define the attributes of the Session model
export interface SessionAttributes {
  id: string;
  userId: string;
  token: string;
  deviceInfo: DeviceInfo;
  locationInfo: LocationInfo;
  expiresAt: Date;
  lastActivity: Date;
  isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Define the attributes required to create a new Session
export interface SessionCreationAttributes
  extends Optional<
    SessionAttributes,
    "id" | "createdAt" | "updatedAt" | "lastActivity" | "isActive"
  > {}

// Define device information interface
export interface DeviceInfo {
  userAgent: string;
  platform: string;
  browser: string;
  os: string;
  ip: string;
  fingerprint?: string;
}

// Define location information interface
export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Define the Session instance methods
export interface SessionInstance
  extends Model<SessionAttributes, SessionCreationAttributes>,
    SessionAttributes {
  // Instance methods
  refreshActivity(): Promise<void>;
  isExpired(): boolean;
  revoke(): Promise<void>;
  extendSession(durationMinutes: number): Promise<void>;
  matchesDevice(deviceInfo: Partial<DeviceInfo>): boolean;
  [key: string]: any; // Allow additional methods
}

// Define the static methods of the Session model
export type SessionModelStatic = typeof Model & {
  new (values?: object, options?: any): SessionInstance;
  associate?: (models: any) => void;
  findByPk: (id: string, options?: any) => Promise<SessionInstance | null>;
  findOne: (options: any) => Promise<SessionInstance | null>;
  findAll: (options?: any) => Promise<SessionInstance[]>;
  findByToken: (
    token: string,
    options?: any,
  ) => Promise<SessionInstance | null>;
  findByUserId: (userId: string, options?: any) => Promise<SessionInstance[]>;
  cleanupExpired: () => Promise<number>;
  // Add other static methods as needed
};

/**
 * Initialize Session model
 */
export default function Session(sequelize: Sequelize): SessionModelStatic {
  // Define the model
  const SessionModel = sequelize.define<SessionInstance>(
    "Session",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      deviceInfo: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      locationInfo: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      lastActivity: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
      tableName: "sessions",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["token"],
        },
        {
          fields: ["user_id", "is_active"],
        },
        {
          fields: ["expires_at"],
        },
        {
          fields: ["last_activity"],
        },
        {
          fields: ["created_at"],
        },
      ],
    },
  ) as unknown as SessionModelStatic;

  // Add instance methods
  const sessionPrototype = SessionModel.prototype as SessionInstance;

  /**
   * Refresh the last activity timestamp
   */
  sessionPrototype.refreshActivity = async function (): Promise<void> {
    this.lastActivity = new Date();
    await this.save();
  };

  /**
   * Check if the session is expired
   */
  sessionPrototype.isExpired = function (): boolean {
    return new Date() > this.expiresAt;
  };

  /**
   * Revoke the session
   */
  sessionPrototype.revoke = async function (): Promise<void> {
    this.isActive = false;
    this.expiresAt = new Date(); // Expire immediately
    await this.save();
  };

  /**
   * Extend the session duration
   */
  sessionPrototype.extendSession = async function (
    durationMinutes: number,
  ): Promise<void> {
    const newExpiry = new Date();
    newExpiry.setMinutes(newExpiry.getMinutes() + durationMinutes);
    this.expiresAt = newExpiry;
    await this.save();
  };

  /**
   * Check if the device information matches
   */
  sessionPrototype.matchesDevice = function (
    deviceInfo: Partial<DeviceInfo>,
  ): boolean {
    // Basic comparison - in production you might want more sophisticated matching
    const current = this.deviceInfo;

    if (deviceInfo.ip && current.ip !== deviceInfo.ip) {
      return false;
    }

    if (deviceInfo.userAgent && current.userAgent !== deviceInfo.userAgent) {
      return false;
    }

    if (
      deviceInfo.fingerprint &&
      current.fingerprint !== deviceInfo.fingerprint
    ) {
      return false;
    }

    return true;
  };

  // Add static methods
  /**
   * Find session by token
   */
  SessionModel.findByToken = async function (
    token: string,
    options?: any,
  ): Promise<SessionInstance | null> {
    return this.findOne({
      where: { token },
      ...options,
    });
  };

  /**
   * Find all sessions for a user
   */
  SessionModel.findByUserId = async function (
    userId: string,
    options?: any,
  ): Promise<SessionInstance[]> {
    return this.findAll({
      where: { userId },
      order: [["created_at", "DESC"]],
      ...options,
    });
  };

  /**
   * Clean up expired sessions
   */
  SessionModel.cleanupExpired = async function (): Promise<number> {
    const result = await this.destroy({
      where: {
        expiresAt: {
          [Sequelize.Op.lt]: new Date(),
        },
        isActive: true,
      },
    });
    return result;
  };

  return SessionModel;
}

// Export types
export {
  SessionAttributes,
  SessionInstance,
  SessionModelStatic,
  DeviceInfo,
  LocationInfo,
};
