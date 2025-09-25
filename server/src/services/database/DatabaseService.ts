import { Sequelize, Model, DataTypes, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';

export class DatabaseService {
  private static instance: DatabaseService;
  private sequelize: Sequelize;
  private models: Record<string, any> = {};

  private constructor() {
    this.sequelize = new Sequelize({
      dialect: 'postgres',
      host: config.db.host,
      port: config.db.port,
      username: config.db.username,
      password: config.db.password,
      database: config.db.database,
      logging: (msg) => logger.debug(msg),
      define: {
        timestamps: true,
        underscored: true,
      },
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      logger.info('Database connection has been established successfully.');
      
      // Initialize models
      this.initializeModels();
      
      // Setup associations
      this.setupAssociations();
      
      // Sync models with database
      await this.syncDatabase();
    } catch (error) {
      logger.error('Unable to connect to the database:', error);
      throw error;
    }
  }

  private initializeModels(): void {
    // User model
    this.models.User = this.sequelize.define('User', {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('user', 'admin', 'moderator'),
        defaultValue: 'user',
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastActiveAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    });

    // Room model
    this.models.Room = this.sequelize.define('Room', {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isPrivate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      maxUsers: {
        type: DataTypes.INTEGER,
        defaultValue: 50,
      },
      language: {
        type: DataTypes.STRING,
        defaultValue: 'plaintext',
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
    });

    // Message model
    this.models.Message = this.sequelize.define('Message', {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('text', 'system', 'code', 'action'),
        defaultValue: 'text',
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    });

    // CodeEdit model for tracking code changes
    this.models.CodeEdit = this.sequelize.define('CodeEdit', {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      diff: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      cursorPosition: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    });

    // UserRoom association (many-to-many)
    this.models.UserRoom = this.sequelize.define('UserRoom', {
      role: {
        type: DataTypes.ENUM('owner', 'admin', 'member'),
        defaultValue: 'member',
      },
      lastReadAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });
  }

  private setupAssociations(): void {
    // User <-> Room (Many-to-Many)
    this.models.User.belongsToMany(this.models.Room, {
      through: this.models.UserRoom,
      foreignKey: 'userId',
    });
    this.models.Room.belongsToMany(this.models.User, {
      through: this.models.UserRoom,
      foreignKey: 'roomId',
    });

    // Room has many Messages
    this.models.Room.hasMany(this.models.Message, {
      foreignKey: 'roomId',
      as: 'messages',
    });
    this.models.Message.belongsTo(this.models.Room, {
      foreignKey: 'roomId',
    });

    // User has many Messages
    this.models.User.hasMany(this.models.Message, {
      foreignKey: 'userId',
      as: 'sentMessages',
    });
    this.models.Message.belongsTo(this.models.User, {
      foreignKey: 'userId',
      as: 'sender',
    });

    // Room has many CodeEdits
    this.models.Room.hasMany(this.models.CodeEdit, {
      foreignKey: 'roomId',
      as: 'codeEdits',
    });
    this.models.CodeEdit.belongsTo(this.models.Room, {
      foreignKey: 'roomId',
    });

    // User has many CodeEdits
    this.models.User.hasMany(this.models.CodeEdit, {
      foreignKey: 'userId',
      as: 'codeChanges',
    });
    this.models.CodeEdit.belongsTo(this.models.User, {
      foreignKey: 'userId',
      as: 'editor',
    });
  }

  private async syncDatabase(options = { alter: true, force: false }): Promise<void> {
    try {
      await this.sequelize.sync(options);
      logger.info('Database synchronized successfully');
    } catch (error) {
      logger.error('Error synchronizing database:', error);
      throw error;
    }
  }

  public getModel(name: string) {
    const model = this.models[name];
    if (!model) {
      throw new Error(`Model ${name} not found`);
    }
    return model;
  }

  public getSequelize(): Sequelize {
    return this.sequelize;
  }

  public async close(): Promise<void> {
    await this.sequelize.close();
    logger.info('Database connection closed');
  }

  // Add transaction support
  public async withTransaction<T>(callback: (t: any) => Promise<T>): Promise<T> {
    const t = await this.sequelize.transaction();
    try {
      const result = await callback(t);
      await t.commit();
      return result;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

export const db = DatabaseService.getInstance();
