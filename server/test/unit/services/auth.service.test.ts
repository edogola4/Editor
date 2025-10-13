import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { AuthService } from '../../../src/services/auth/AuthService';
import { User } from '../../../src/models/User';
import { createTestDb, dropTestDb } from '../../test-utils';
import { Sequelize } from 'sequelize';
import bcrypt from 'bcrypt';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashedPassword'),
  compare: vi.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let sequelize: Sequelize;
  let authService: AuthService;
  let testUser: User;

  beforeAll(async () => {
    // Setup test database
    sequelize = await createTestDb();
    
    // Initialize auth service
    authService = new AuthService();
    
    // Create a test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedPassword',
    });
  });

  afterAll(async () => {
    // Clean up test database
    await dropTestDb();
    await sequelize.close();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const result = await authService.register(userData);
      
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(userData.email);
      expect(result.username).toBe(userData.username);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        username: 'testuser2',
        email: 'test@example.com', // Duplicate email
        password: 'password123',
      };

      await expect(authService.register(userData)).rejects.toThrow('Email already in use');
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.login(credentials);
      
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, testUser.password);
    });

    it('should throw error for invalid email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      
      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      const tokens = await authService.generateTokens({
        id: testUser.id,
        email: testUser.email,
      });
      
      const result = await authService.refreshToken(tokens.refreshToken);
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct password', async () => {
      const user = await authService.validateUser('test@example.com', 'password123');
      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null for invalid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      const user = await authService.validateUser('test@example.com', 'wrongpassword');
      expect(user).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const user = await authService.validateUser('nonexistent@example.com', 'password123');
      expect(user).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const newPassword = 'newPassword123';
      await authService.changePassword(testUser.id, 'password123', newPassword);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
    });

    it('should throw error for incorrect current password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      
      await expect(
        authService.changePassword(testUser.id, 'wrongpassword', 'newpassword')
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});
