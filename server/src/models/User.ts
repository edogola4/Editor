import { 
  Table, 
  Column, 
  Model, 
  DataType, 
  IsEmail, 
  HasMany, 
  BeforeCreate, 
  BeforeUpdate, 
  PrimaryKey, 
  Default, 
  IsUnique, 
  Validate 
} from 'sequelize-typescript';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Document } from './Document';
import DocumentPermission from './DocumentPermission';

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

@Table({
  tableName: 'users',
  underscored: true,
  paranoid: true,
  version: true,
  timestamps: true
})
export class User extends Model<UserAttributes, UserCreationAttributes> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false
  })
  id!: string;

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
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  })
  email!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    set(value: string) {
      const salt = bcrypt.genSaltSync(10);
      this.setDataValue('password', bcrypt.hashSync(value, salt));
    }
  })
  password!: string;

  @Column(DataType.STRING(50))
  firstName?: string;

  @Column(DataType.STRING(50))
  lastName?: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
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
  lastLoginAt?: Date;

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

  @Column(DataType.DATE)
  createdAt!: Date;

  @Column(DataType.DATE)
  updatedAt!: Date;

  @Column(DataType.DATE)
  deletedAt?: Date;

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
    delete values.password;
    delete values.twoFactorSecret;
    delete values.twoFactorRecoveryCodes;
    delete values.passwordResetToken;
    delete values.passwordResetExpires;
    delete values.emailVerificationToken;
    delete values.emailVerificationExpires;
    return values;
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
  @HasMany(() => Document, 'ownerId')
  documents!: Document[];

  @HasMany(() => DocumentPermission, 'userId')
  documentPermissions!: DocumentPermission[];
}

// Export interfaces for type safety
export interface IUser extends User {}

export default User;
