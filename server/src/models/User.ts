import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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
}

// Define the attributes required to create a new User
interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt" | "loginCount" | "emailNotifications" | "isVerified" | "twoFactorEnabled"> {}

// Define the User instance methods
interface UserInstance
  extends Model<UserAttributes, UserCreationAttributes>,
    UserAttributes {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): { resetToken: string; resetTokenExpiry: Date };
  generateEmailVerificationToken(): { token: string; expires: Date };
  toJSON(): UserAttributes;
  [key: string]: any; // Allow additional methods
}

// Define the static methods of the User model
type UserModelStatic = typeof Model & {
  new (values?: object, options?: any): UserInstance;
  associate?: (models: any) => void;
  findByPk: (id: string, options?: any) => Promise<UserInstance | null>;
  findOne: (options: any) => Promise<UserInstance | null>;
  // Add other static methods as needed
};

// Define the model initialization function
export const User = (sequelize: Sequelize): UserModelStatic => {
  // Define the model
  const User = sequelize.define<UserInstance>(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 50],
          is: /^[a-zA-Z0-9_]+$/,
        },
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
        allowNull: true, // Nullable for OAuth users
        validate: {
          len: [8, 100],
        },
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
      githubId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: true,
        },
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
        validate: {
          isUrl: true,
        },
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
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['email'],
        },
        {
          unique: true,
          fields: ['username'],
        },
        {
          fields: ['role'],
        },
        {
          fields: ['status'],
        },
      ],
      hooks: {
        beforeCreate: async (user: UserInstance) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user: UserInstance) => {
          if (user.changed("password")) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    },
  ) as unknown as UserModelStatic;

  // Add instance method to check password
  const userPrototype = User.prototype as UserInstance;
  
  // Instance methods
  userPrototype.comparePassword = async function (
    candidatePassword: string,
  ): Promise<boolean> {
    if (!this.password) return false; // For OAuth users without password
    return bcrypt.compare(candidatePassword, this.password);
  };

  userPrototype.createPasswordResetToken = function (): string {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return resetToken;
  };

  userPrototype.markAsVerified = async function (): Promise<void> {
    this.isVerified = true;
    this.passwordResetToken = null;
    this.passwordResetExpires = null;
    await this.save();
  };

  return User;
}

// Export the User model and interfaces
export type { UserAttributes, UserInstance, UserModelStatic };

export default User;

declare global {
  namespace Express {
    interface User extends UserInstance {}
  }
}
