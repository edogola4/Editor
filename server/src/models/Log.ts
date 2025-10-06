import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SECURITY = 'security'
}

export enum LogType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  NETWORK = 'network',
  SYSTEM = 'system',
  SECURITY = 'security',
  API = 'api',
  AUDIT = 'audit',
  PERFORMANCE = 'performance',
  INTEGRATION = 'integration',
  NOTIFICATION = 'notification',
  OTHER = 'other'
}

// Define the attributes of the Log model
export interface LogAttributes {
  id: string;
  level: LogLevel;
  type: LogType;
  message: string;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  } | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Define the attributes required to create a new Log
export interface LogCreationAttributes
  extends Optional<LogAttributes, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'ipAddress' | 'userAgent' | 'metadata' | 'error'> {}

// Define the Log instance methods
export interface LogInstance
  extends Model<LogAttributes, LogCreationAttributes>,
    LogAttributes {}

// Define the static methods of the Log model
type LogModelStatic = typeof Model & {
  new (values?: object, options?: any): LogInstance;
  associate?: (models: any) => void;
};

// Initialize Log model
export default function Log(sequelize: Sequelize): LogModelStatic {
  const Log = sequelize.define<LogInstance>(
    'Log',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      level: {
        type: DataTypes.ENUM(...Object.values(LogLevel)),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(...Object.values(LogType)),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users', // This should match the table name of the User model
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      error: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: 'logs',
      timestamps: true,
      indexes: [
        { fields: ['level'] },
        { fields: ['type'] },
        { fields: ['userId'] },
        { fields: ['createdAt'] },
      ],
    }
  ) as LogModelStatic;

  // Define associations
  Log.associate = (models) => {
    Log.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Log;
}

// Export the Log model and interfaces
export { LogAttributes, LogInstance, LogModelStatic };
