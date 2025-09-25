import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { setupTestEnvironment, cleanupTestEnvironment, createTestUser, createTestRoom } from '../test-utils';
import { db } from '../../src/services/database/DatabaseService';

describe('DatabaseService', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  describe('User Model', () => {
    it('should create a new user', async () => {
      const user = await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
      });

      expect(user).toHaveProperty('id');
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
    });

    it('should not allow duplicate usernames', async () => {
      await createTestUser({ username: 'duplicate' });
      
      await expect(
        createTestUser({ username: 'duplicate' })
      ).rejects.toThrow();
    });

    it('should not allow duplicate emails', async () => {
      await createTestUser({ email: 'duplicate@example.com' });
      
      await expect(
        createTestUser({ email: 'duplicate@example.com' })
      ).rejects.toThrow();
    });
  });

  describe('Room Model', () => {
    it('should create a new room', async () => {
      const user = await createTestUser();
      const room = await createTestRoom({
        name: 'test-room',
        description: 'Test room description',
        isPrivate: true,
      }, user.id);

      expect(room).toHaveProperty('id');
      expect(room.name).toBe('test-room');
      expect(room.description).toBe('Test room description');
      expect(room.isPrivate).toBe(true);
      expect(room.createdBy).toBe(user.id);
    });

    it('should associate users with rooms', async () => {
      const user = await createTestUser();
      const room = await createTestRoom({}, user.id);
      
      // Check if user is associated with the room
      const userRooms = await user.getRooms();
      expect(userRooms).toHaveLength(1);
      expect(userRooms[0].id).toBe(room.id);
      
      // Check room has the user
      const roomUsers = await room.getUsers();
      expect(roomUsers).toHaveLength(1);
      expect(roomUsers[0].id).toBe(user.id);
    });
  });

  describe('Message Model', () => {
    it('should create a new message', async () => {
      const user = await createTestUser();
      const room = await createTestRoom({}, user.id);
      
      const Message = db.getModel('Message');
      const message = await Message.create({
        content: 'Hello, world!',
        type: 'text',
        userId: user.id,
        roomId: room.id,
      });
      
      expect(message).toHaveProperty('id');
      expect(message.content).toBe('Hello, world!');
      expect(message.userId).toBe(user.id);
      expect(message.roomId).toBe(room.id);
      
      // Test associations
      const messageWithUser = await Message.findByPk(message.id, {
        include: ['sender']
      });
      
      expect(messageWithUser?.sender).toBeDefined();
      expect(messageWithUser?.sender.id).toBe(user.id);
    });
  });

  describe('CodeEdit Model', () => {
    it('should track code edits', async () => {
      const user = await createTestUser();
      const room = await createTestRoom({}, user.id);
      
      const CodeEdit = db.getModel('CodeEdit');
      const edit = await CodeEdit.create({
        content: 'const x = 1;',
        version: 1,
        userId: user.id,
        roomId: room.id,
      });
      
      expect(edit).toHaveProperty('id');
      expect(edit.content).toBe('const x = 1;');
      expect(edit.version).toBe(1);
      
      // Test associations
      const editWithRoom = await CodeEdit.findByPk(edit.id, {
        include: ['room']
      });
      
      expect(editWithRoom?.room).toBeDefined();
      expect(editWithRoom?.room.id).toBe(room.id);
    });
  });

  describe('Transactions', () => {
    it('should handle transactions', async () => {
      await db.withTransaction(async (t) => {
        const user = await db.getModel('User').create({
          username: `txuser_${Date.now()}`,
          email: `tx_${Date.now()}@example.com`,
          password: 'test123',
        }, { transaction: t });
        
        const room = await db.getModel('Room').create({
          name: `tx-room-${Date.now()}`,
          description: 'Transaction test room',
          createdBy: user.id,
        }, { transaction: t });
        
        // This should succeed
        await user.addRoom(room, { 
          through: { role: 'owner' },
          transaction: t 
        });
      });
      
      // The transaction should be committed
      const user = await db.getModel('User').findOne({ 
        where: { username: /^txuser_/ } 
      });
      
      expect(user).not.toBeNull();
      
      const rooms = await user?.getRooms();
      expect(rooms).toHaveLength(1);
    });
    
    it('should rollback on error', async () => {
      const username = `txerror_${Date.now()}`;
      
      try {
        await db.withTransaction(async (t) => {
          // Create a user
          await db.getModel('User').create({
            username,
            email: `txerror_${Date.now()}@example.com`,
            password: 'test123',
          }, { transaction: t });
          
          // This will throw an error
          throw new Error('Test transaction rollback');
        });
      } catch (error) {
        // Expected error
      }
      
      // The user should not exist because the transaction was rolled back
      const user = await db.getModel('User').findOne({ 
        where: { username } 
      });
      
      expect(user).toBeNull();
    });
  });
});
