import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '../../../src/services/database/DatabaseService';
import { User } from '../../../src/models/User';
import { createTestUser, setupTestEnvironment, cleanupTestEnvironment } from '../../test-utils';

describe('User Model', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  afterEach(async () => {
    // Clean up test data
    await db.User.destroy({ where: {}, force: true });
  });

  describe('Create User', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);

      expect(user).toHaveProperty('id');
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Password should be hashed
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });

    it('should not create a user with duplicate email', async () => {
      const userData = {
        username: 'testuser',
        email: 'duplicate@example.com',
        password: 'password123',
      };

      // Create first user
      await User.create(userData);

      // Try to create another user with the same email
      await expect(User.create({
        username: 'anotheruser',
        email: 'duplicate@example.com',
        password: 'password456',
      })).rejects.toThrow();
    });

    it('should not create a user with duplicate username', async () => {
      const userData = {
        username: 'duplicateuser',
        email: 'test1@example.com',
        password: 'password123',
      };

      // Create first user
      await User.create(userData);

      // Try to create another user with the same username
      await expect(User.create({
        username: 'duplicateuser',
        email: 'test2@example.com',
        password: 'password456',
      })).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash the password before saving', async () => {
      const password = 'password123';
      const user = await User.create({
        username: 'hashtest',
        email: 'hash@example.com',
        password,
      });

      expect(user.password).not.toBe(password);
      expect(user.password.length).toBeGreaterThan(password.length);
    });

    it('should validate password correctly', async () => {
      const password = 'password123';
      const user = await User.create({
        username: 'validatetest',
        email: 'validate@example.com',
        password,
      });

      // Test correct password
      const isValid = await user.validatePassword(password);
      expect(isValid).toBe(true);

      // Test incorrect password
      const isInvalid = await user.validatePassword('wrongpassword');
      expect(isInvalid).toBe(false);
    });
  });

  describe('Instance Methods', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await createTestUser({
        username: 'methodtest',
        email: 'method@example.com',
      });
    });

    it('should generate auth token', () => {
      const token = testUser.generateAuthToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should generate refresh token', () => {
      const refreshToken = testUser.generateRefreshToken();
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
    });
  });

  describe('Associations', () => {
    it('should have many rooms', async () => {
      const user = await createTestUser({
        username: 'roomowner',
        email: 'owner@example.com',
      });

      // Create rooms for the user
      const room1 = await db.Room.create({
        name: 'Room 1',
        description: 'First room',
        createdBy: user.id,
      });

      const room2 = await db.Room.create({
        name: 'Room 2',
        description: 'Second room',
        createdBy: user.id,
      });

      // Get user with rooms
      const userWithRooms = await User.findByPk(user.id, {
        include: ['ownedRooms'],
      });

      expect(userWithRooms?.ownedRooms).toHaveLength(2);
      expect(userWithRooms?.ownedRooms?.[0].id).toBe(room1.id);
      expect(userWithRooms?.ownedRooms?.[1].id).toBe(room2.id);
    });

    it('should belong to many rooms as participant', async () => {
      const user = await createTestUser({
        username: 'roomparticipant',
        email: 'participant@example.com',
      });

      const room1 = await db.Room.create({
        name: 'Participant Room 1',
        description: 'First participant room',
        createdBy: 1, // Different user
      });

      const room2 = await db.Room.create({
        name: 'Participant Room 2',
        description: 'Second participant room',
        createdBy: 1, // Different user
      });

      // Add user to rooms
      await room1.addParticipant(user);
      await room2.addParticipant(user);

      // Get user with participating rooms
      const userWithRooms = await User.findByPk(user.id, {
        include: ['participatingRooms'],
      });

      expect(userWithRooms?.participatingRooms).toHaveLength(2);
      expect(userWithRooms?.participatingRooms?.[0].id).toBe(room1.id);
      expect(userWithRooms?.participatingRooms?.[1].id).toBe(room2.id);
    });
  });

  describe('Hooks', () => {
    it('should update timestamps on update', async () => {
      const user = await createTestUser({
        username: 'timestamptest',
        email: 'timestamp@example.com',
      });

      const originalUpdatedAt = user.updatedAt;
      
      // Wait a bit to ensure timestamps are different
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Update user
      user.username = 'updatedusername';
      await user.save();
      
      // Should have updated the updatedAt timestamp
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
