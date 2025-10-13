import { Model, DataTypes, Sequelize, ModelStatic, Optional, HasManyGetAssociationsMixin, Association } from "sequelize";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Document } from "./Document.js";

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

// Define the attributes of the User model
interface UserAttributes {
  id: string;
  username: string;
  email: string;
  password: string | null;
  role: UserRole;
  status: UserStatus;
  githubId?: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  company?: string;
  location?: string;
  website?: string;
  lastLoginAt?: Date;
  loginCount: number;
  timezone?: string;
  preferredLanguage: string;
  emailNotifications: boolean;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt?: Date;
  
  // Association mixins
  documents?: Document[];
  getDocuments?: HasManyGetAssociationsMixin<Document>;
  
  [key: string]: any;
}

// Define UserCreationAttributes type
type UserCreationAttributes = Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'>;

// Define the instance methods and properties
interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
  // Instance methods
  comparePassword: (candidatePassword: string) => Promise<boolean>;
  generatePasswordResetToken: () => { resetToken: string; resetTokenExpiry: Date };
  generateEmailVerificationToken: () => { token: string; expires: Date };
  // Override toJSON to exclude sensitive data
  toJSON: () => Omit<UserAttributes, 'password' | 'passwordResetToken' | 'passwordResetExpires' | 'emailVerificationToken' | 'emailVerificationExpires'>;
}

// Define the static methods of the User model
interface UserModelStatic extends ModelStatic<UserInstance> {
  new (values?: object, options?: any): UserInstance;
  associate?: (models: any) => void;
  findByPk: (id: string, options?: any) => Promise<UserInstance | null>;
  findOne: (options: any) => Promise<UserInstance | null>;
  prototype: UserInstance;
  
  // Add associations
  associations: {
    documents: Association<UserInstance, Document>;
  };
};

// Constants
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY_HOURS = 1;

// Model definition
export const User = (sequelize: Sequelize): UserModelStatic => {
  const UserModel = sequelize.define<UserInstance, UserCreationAttributes>('User', {
    // Model attributes are defined here
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
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
      allowNull: true, // Can be null for OAuth users
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      defaultValue: UserRole.USER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(UserStatus)),
      defaultValue: UserStatus.PENDING_VERIFICATION,
      allowNull: false,
    },
    // Add other fields as needed
    githubId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    loginCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    preferredLanguage: {
      type: DataTypes.STRING,
      defaultValue: 'en',
      allowNull: false,
    },
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Timestamps are handled by Sequelize
  }, {
    timestamps: true,
    paranoid: true, // Enable soft deletes
    tableName: 'users',
    hooks: {
      beforeCreate: async (user: UserInstance) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
        }
      },
      beforeUpdate: async (user: UserInstance) => {
        if (user.changed('password') && user.password) {
          user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
        }
      },
    },
  }) as unknown as UserModelStatic;

  // Add instance methods
  UserModel.prototype.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  };

  UserModel.prototype.generatePasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + TOKEN_EXPIRY_HOURS);
    
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    this.passwordResetExpires = resetTokenExpiry;
    
    return { resetToken, resetTokenExpiry };
  };

  UserModel.prototype.generateEmailVerificationToken = function() {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + TOKEN_EXPIRY_HOURS);
    
    this.emailVerificationToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    this.emailVerificationExpires = expires;
    
    return { token, expires };
  };

  // Override toJSON to exclude sensitive data
  UserModel.prototype.toJSON = function() {
    // Get all values and explicitly type them as Partial to allow deletion
    const values = { ...this.get() } as Partial<UserAttributes>;
    
    // These fields will be removed from the output
    const sensitiveFields: (keyof UserAttributes)[] = [
      'password',
      'passwordResetToken',
      'passwordResetExpires',
      'emailVerificationToken',
      'emailVerificationExpires'
    ];
    
    // Remove sensitive fields
    sensitiveFields.forEach(field => {
      if (field in values) {
        delete values[field];
      }
    });
    
    return values as Omit<UserAttributes, 
      'password' | 
      'passwordResetToken' | 
      'passwordResetExpires' | 
      'emailVerificationToken' | 
      'emailVerificationExpires'
    >;
  };

  return UserModel;
};

export default User;

export type { 
  UserAttributes as IEnhancedUser,
  UserInstance,
  UserModelStatic,
  UserCreationAttributes 
};
