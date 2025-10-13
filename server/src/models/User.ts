import { 
  Table, 
  Column, 
  Model, 
  DataType, 
  HasMany, 
  BeforeCreate, 
  BeforeUpdate, 
  PrimaryKey, 
  Default, 
  Unique, 
  Validate,
  Scopes,
  AllowNull,
  Index,
  BeforeDestroy,
  AfterCreate,
  AfterUpdate,
  AfterDestroy,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  IsEmail
} from 'sequelize-typescript';
import type { NonAttribute, Association } from 'sequelize';
import { Document } from './Document.js';
import { Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserCreationAttributes } from './EnhancedUser.js';
// Import models
// Note: We're not importing Document and DocumentPermission here to avoid circular dependencies
// The associations will be set up in the model's associate method

export enum UserRole {
  USER = 'user',
  EDITOR = 'editor',
  ADMIN = 'admin',
  OWNER = 'owner'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

// User interface
// User interface
export interface IUserAttributes {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: Date;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  profilePictureUrl?: string;
  timezone?: string;
  preferredLanguage?: string;
  isOnline: boolean;
  lastActiveAt?: Date;
  loginAttempts: number;
  lockUntil?: number;
  twoFactorEnabled: boolean;
  twoFactorRecoveryCodes?: string[];
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// User model class
@Table({
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  underscored: true,
  indexes: [
    {
      name: 'users_email_idx',
      unique: true,
      fields: ['email']
    },
    {
      name: 'users_username_idx',
      unique: true,
      fields: ['username']
    },
    {
      name: 'users_status_idx',
      fields: ['status']
    }
  ]
})
export class User extends Model<IUserAttributes, UserCreationAttributes> implements IUserAttributes {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false
  })
  declare id: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      is: /^[a-zA-Z0-9_]+$/
    }
  })
  username!: string;

  @IsEmail
  @Unique
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  })
  declare email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    set(value: string) {
      if (value) {
        const salt = bcrypt.genSaltSync(10);
        this.setDataValue('password', bcrypt.hashSync(value, salt));
      }
    }
  })
  password!: string;

  @Column(DataType.STRING(50))
  declare firstName?: string;

  @Column(DataType.STRING(50))
  declare lastName?: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole) as string[]),
    defaultValue: UserRole.USER,
    allowNull: false
  })
  role!: UserRole;

  @Column({
    type: DataType.ENUM(...Object.values(UserStatus)),
    defaultValue: UserStatus.PENDING_VERIFICATION,
    allowNull: false
  })
  status!: UserStatus;

  @Column(DataType.DATE)
  declare lastLoginAt?: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  emailVerified!: boolean;

  @Column(DataType.STRING)
  emailVerificationToken?: string;

  @Column(DataType.DATE)
  emailVerificationExpires?: Date;

  @Column(DataType.STRING)
  passwordResetToken?: string;

  @Column(DataType.DATE)
  passwordResetExpires?: Date;

  @Column(DataType.STRING)
  profilePictureUrl?: string;

  @Column(DataType.STRING(50))
  timezone?: string;

  @Column(DataType.STRING(10))
  preferredLanguage?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  isOnline!: boolean;

  @Column(DataType.DATE)
  lastActiveAt?: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false
  })
  loginAttempts!: number;

  @Column(DataType.BIGINT)
  lockUntil?: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  twoFactorEnabled!: boolean;

  @Column(DataType.STRING)
  twoFactorSecret?: string;

  @Column(DataType.ARRAY(DataType.STRING))
  twoFactorRecoveryCodes?: string[];

  @Column(DataType.JSONB)
  settings?: Record<string, any>;

  @Column(DataType.JSONB)
  metadata?: Record<string, any>;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt?: Date;

  // Document associations
  @HasMany(() => Document, 'userId')
  declare documents?: NonAttribute<Document[]>;

  declare static associations: {
    documents: Association<User, Document>;
  };

  // Add any other model methods or hooks here

  // Instance methods
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
  generatePasswordResetToken(): { resetToken: string; resetTokenExpiry: Date } {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    this.passwordResetExpires = resetTokenExpiry;
    
    return { resetToken, resetTokenExpiry };
  }

  generateEmailVerificationToken(): { token: string; expires: Date } {
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    this.emailVerificationToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    this.emailVerificationExpires = expires;
    
    return { token, expires };
  }

  toJSON(): any {
    const values = { ...this.get() };
    // Use optional chaining and nullish coalescing to safely delete properties
    const safeDelete = (obj: any, prop: string) => {
      if (prop in obj) {
        const { [prop]: _, ...rest } = obj;
        return rest;
      }
      return obj;
    };

    return [
      'password',
      'twoFactorSecret',
      'twoFactorRecoveryCodes',
      'passwordResetToken',
      'passwordResetExpires',
      'emailVerificationToken',
      'emailVerificationExpires'
    ].reduce((acc, prop) => safeDelete(acc, prop), values);
  }
  // Define the model
  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User) {
    if (instance.changed('password') && instance.password) {
      const salt = await bcrypt.genSalt(10);
      instance.password = await bcrypt.hash(instance.password, salt);
    }
  }

  // Associations
  // Associations will be set up in the model's associate method;
}

export default User;
