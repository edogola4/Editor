import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Define the attributes of the User model
interface UserAttributes {
  id: string;
  username: string;
  email: string;
  password: string | null;
  role: "user" | "admin";
  githubId?: string;
  avatarUrl?: string;
  isVerified: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Define the attributes required to create a new User
interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt"> {}

// Define the User instance methods
interface UserInstance
  extends Model<UserAttributes, UserCreationAttributes>,
    UserAttributes {
  comparePassword(candidatePassword: string): Promise<boolean>;
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
export default function User(sequelize: Sequelize): UserModelStatic {
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
      },
      role: {
        type: DataTypes.ENUM("user", "admin"),
        defaultValue: "user",
      },
      githubId: {
        type: DataTypes.STRING,
        field: 'github_id', // Explicitly set the column name to match the database
        allowNull: true,
        unique: true,
      },
      avatarUrl: {
        type: DataTypes.STRING,
        field: 'avatar_url', // Explicitly set the column name to match the database
        allowNull: true,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        field: 'is_verified',
        defaultValue: false,
      },
      passwordResetToken: {
        type: DataTypes.STRING,
        field: 'password_reset_token',
        allowNull: true,
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        field: 'password_reset_expires',
        allowNull: true,
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
      tableName: "users",
      timestamps: true,
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
