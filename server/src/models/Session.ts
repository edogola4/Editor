import { 
  Table, 
  Column, 
  Model, 
  ForeignKey, 
  Default, 
  AllowNull, 
  Index, 
  UpdatedAt,
  BelongsTo,
  CreatedAt,
  Optional,
  DataType
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { User } from './User';

// Define device information interface
export interface DeviceInfo {
  userAgent: string;
  platform: string;
  browser: string;
  os: string;
  source: string;
}

// Define location information interface
export interface LocationInfo {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

// Define the attributes of the Session model
export interface SessionAttributes {
  id: string;
  userId: string;
  token: string;
  deviceInfo: DeviceInfo;
  locationInfo?: LocationInfo;
  expiresAt: Date;
  lastActiveAt: Date;
  isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  deletedAt?: Date;
}

// Define the attributes required to create a new Session
export interface SessionCreationAttributes
  extends Optional<
    SessionAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'lastActiveAt' | 'isActive' | 'deletedAt'
  > {}

@Table({
  tableName: 'sessions',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      name: 'sessions_is_active_idx',
      fields: ['is_active']
    }
  ]
})
export default class Session extends Model<SessionAttributes, SessionCreationAttributes>
  implements SessionAttributes {

  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  token!: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  deviceInfo!: DeviceInfo;

  @AllowNull
  @Column({
    type: DataType.JSONB,
  })
  locationInfo?: LocationInfo;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expiresAt!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  lastActiveAt!: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  })
  isActive!: boolean;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
    allowNull: false
  })
  createdAt!: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
    allowNull: false
  })
  updatedAt!: Date;

  @AllowNull
  @Column({
    type: DataType.DATE,
    field: 'deleted_at'
  })
  deletedAt?: Date;

  @BelongsTo(() => User as any)
  user!: User;

  // Static method to clean up expired sessions
  static async cleanupExpiredSessions(): Promise<number> {
    const count = await this.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date()
        }
      }
    });
    return count;
  }
}

// Export interfaces for type safety
export interface ISession extends Session {}
