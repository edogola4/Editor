import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { RedisClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const signToken = promisify(jwt.sign);
const verifyToken = promisify(jwt.verify) as (token: string, secret: string) => Promise<any>;

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthService {
  private redis: RedisClient;
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN = '7d';
  private readonly SALT_ROUNDS = 10;

  constructor(redis: RedisClient) {
    this.redis = redis;
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  }

  private async getUserKey(userId: string): Promise<string> {
    return `user:${userId}`;
  }

  private async getUserByEmailKey(email: string): Promise<string> {
    return `user:email:${email.toLowerCase()}`;
  }

  async createUser(email: string, username: string, password: string): Promise<User> {
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);
    const user: User = {
      id: uuidv4(),
      email: email.toLowerCase(),
      username,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userKey = await this.getUserKey(user.id);
    const emailKey = await this.getUserByEmailKey(user.email);

    await Promise.all([
      promisify(this.redis.hset).bind(this.redis)(
        userKey,
        'id', user.id,
        'email', user.email,
        'username', user.username,
        'passwordHash', user.passwordHash,
        'createdAt', user.createdAt.toISOString(),
        'updatedAt', user.updatedAt.toISOString()
      ),
      promisify(this.redis.set).bind(this.redis)(emailKey, user.id)
    ]);

    return user;
  }

  async getUser(userId: string): Promise<User | null> {
    const userKey = await this.getUserKey(userId);
    const userData = await promisify(this.redis.hgetall).bind(this.redis)(userKey);
    
    if (!userData || !userData.id) return null;

    return {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      passwordHash: userData.passwordHash,
      createdAt: new Date(userData.createdAt),
      updatedAt: new Date(userData.updatedAt),
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const emailKey = await this.getUserByEmailKey(email);
    const userId = await promisify(this.redis.get).bind(this.redis)(emailKey);
    
    if (!userId) return null;
    return this.getUser(userId);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }

  async generateToken(user: User): Promise<string> {
    const token = await signToken(
      { id: user.id, email: user.email },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    ) as string;

    // Store token in Redis with user ID
    const tokenKey = `user:${user.id}:tokens:${token}`;
    await promisify(this.redis.setex).bind(this.redis)(
      tokenKey,
      60 * 60 * 24 * 7, // 7 days
      'valid'
    );

    return token;
  }

  async verifyToken(token: string): Promise<{ id: string; email: string } | null> {
    try {
      const decoded = await verifyToken(token, this.JWT_SECRET);
      
      // Check if token is in the whitelist
      const tokenKey = `user:${decoded.id}:tokens:${token}`;
      const isValid = await promisify(this.redis.exists).bind(this.redis)(tokenKey);
      
      return isValid ? decoded : null;
    } catch (error) {
      return null;
    }
  }

  async invalidateToken(token: string): Promise<void> {
    try {
      const decoded = await this.verifyToken(token);
      if (!decoded) return;
      
      const tokenKey = `user:${decoded.id}:tokens:${token}`;
      await promisify(this.redis.del).bind(this.redis)(tokenKey);
    } catch (error) {
      // Token is already invalid
    }
  }

  async invalidateAllUserTokens(userId: string): Promise<void> {
    const pattern = `user:${userId}:tokens:*`;
    const keys = await promisify(this.redis.keys).bind(this.redis)(pattern);
    
    if (keys.length > 0) {
      await promisify(this.redis.del).bind(this.redis)(keys);
    }
  }

  async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const user = await this.getUser(userId);
    if (!user) return null;

    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.password) {
      updatedUser.passwordHash = await bcrypt.hash(updates.password, this.SALT_ROUNDS);
    }

    const userKey = await this.getUserKey(userId);
    
    await promisify(this.redis.hset).bind(this.redis)(
      userKey,
      'username', updatedUser.username,
      'passwordHash', updatedUser.passwordHash,
      'updatedAt', updatedUser.updatedAt.toISOString()
    );

    return updatedUser;
  }
}
