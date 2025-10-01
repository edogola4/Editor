import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { Op, Transaction } from 'sequelize';
import bcrypt from 'bcryptjs';
import db from '../models/index.js';
import { sendInvitationEmail } from '../services/email.service.js';
import config from '../config/config.js';
import { 
  RoomInstance, 
  RoomMember, 
  RoomInvitation, 
  RoomActivity, 
  ActivityType, 
  UserRole,
  InvitationStatus,
  UserInstance
} from '../models/index.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserInstance;
    }
  }
}

class RoomController {
  // Create a new room
  public static async createRoom(req: Request, res: Response, next: NextFunction) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, isPrivate, password, maxUsers, settings } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Create the room
      const room = await db.Room.create(
        {
          name,
          description,
          isPrivate: !!isPrivate,
          password: password ? await this.hashPassword(password) : null,
          maxUsers: maxUsers || 10,
          settings: settings || {},
          ownerId: userId,
        },
        { transaction }
      );

      // Add the creator as the owner
      await db.RoomMember.create(
        {
          roomId: room.id,
          userId,
          role: UserRole.OWNER,
          joinedAt: new Date(),
          lastSeen: new Date(),
          isOnline: true,
        },
        { transaction }
      );

      // Log the room creation
      await db.RoomActivity.create(
        {
          roomId: room.id,
          userId,
          activityType: ActivityType.ROOM_CREATED,
          metadata: { name, isPrivate },
        },
        { transaction }
      );

      await transaction.commit();
      res.status(201).json({ success: true, data: room });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Get room details
  public static async getRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const room = await db.Room.findByPk(id, {
        include: [
          {
            model: db.User,
            as: 'owner',
            attributes: ['id', 'username', 'email', 'avatar'],
          },
          {
            model: db.RoomMember,
            as: 'members',
            include: [
              {
                model: db.User,
                as: 'user',
                attributes: ['id', 'username', 'email', 'avatar'],
              },
            ],
          },
        ],
      });

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Check if user has access to the room
      if (room.isPrivate) {
        if (!userId) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const isMember = await db.RoomMember.findOne({
          where: { roomId: room.id, userId },
        });

        if (!isMember && room.ownerId !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      res.json({ success: true, data: room });
    } catch (error) {
      next(error);
    }
  }

  // Update room settings
  public static async updateRoom(req: Request, res: Response, next: NextFunction) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, description, isPrivate, password, maxUsers, settings } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Find the room
      const room = await db.Room.findByPk(id, { transaction });
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Check if user is the owner
      if (room.ownerId !== userId) {
        return res.status(403).json({ error: 'Only the room owner can update settings' });
      }

      // Update room
      const updates: Partial<RoomInstance> = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (isPrivate !== undefined) updates.isPrivate = isPrivate;
      if (password) updates.password = await this.hashPassword(password);
      if (maxUsers) updates.maxUsers = maxUsers;
      if (settings) updates.settings = { ...room.settings, ...settings };

      await room.update(updates, { transaction });

      // Log the update
      await db.RoomActivity.create(
        {
          roomId: room.id,
          userId,
          activityType: ActivityType.SETTINGS_UPDATE,
          metadata: updates,
        },
        { transaction }
      );

      await transaction.commit();
      res.json({ success: true, data: room });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Delete a room
  public static async deleteRoom(req: Request, res: Response, next: NextFunction) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Find the room
      const room = await db.Room.findByPk(id, { transaction });
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Check if user is the owner
      if (room.ownerId !== userId) {
        return res.status(403).json({ error: 'Only the room owner can delete the room' });
      }

      // Delete related records
      await db.RoomMember.destroy({ where: { roomId: room.id }, transaction });
      await db.RoomInvitation.destroy({ where: { roomId: room.id }, transaction });
      await db.RoomActivity.destroy({ where: { roomId: room.id }, transaction });

      // Delete the room
      await room.destroy({ transaction });

      // Log the deletion
      await db.RoomActivity.create(
        {
          roomId: room.id,
          userId,
          activityType: ActivityType.ROOM_DELETED,
          metadata: { name: room.name },
        },
        { transaction }
      );

      await transaction.commit();
      res.json({ success: true, message: 'Room deleted successfully' });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // List rooms with pagination and filtering
  public static async listRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const userId = req.user?.id;

      const where: any = {};
      
      // Add search filter
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      // If user is authenticated, show their rooms and public rooms
      if (userId) {
        // Get user's room IDs
        const userRooms = await db.RoomMember.findAll({
          where: { userId },
          attributes: ['roomId'],
        });
        const userRoomIds = userRooms.map((r: any) => r.roomId);

        // Show public rooms or rooms the user is a member of
        if (userRoomIds.length > 0) {
          where[Op.or] = [
            { isPrivate: false },
            { id: { [Op.in]: userRoomIds } },
          ];
        } else {
          where.isPrivate = false;
        }
      } else {
        // Show only public rooms for unauthenticated users
        where.isPrivate = false;
      }

      // Get total count and paginated results
      const { count, rows: rooms } = await db.Room.findAndCountAll({
        where,
        include: [
          {
            model: db.User,
            as: 'owner',
            attributes: ['id', 'username', 'email', 'avatar'],
          },
        ],
        limit: Number(limit),
        offset,
        order: [[sortBy as string, sortOrder as 'ASC' | 'DESC']],
      });

      return res.json({
        success: true,
        data: rooms,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Invite a user to a room
  public static async inviteToRoom(req: Request, res: Response, next: NextFunction) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, role = UserRole.VIEWER } = req.body;
      const { id: roomId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if room exists and user has permission to invite
      const room = await db.Room.findByPk(roomId, { transaction });
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Check if user is a member with permission to invite
      const member = await db.RoomMember.findOne({
        where: { roomId, userId },
        transaction,
      });

      if (!member || (member.role !== UserRole.OWNER && member.role !== UserRole.EDITOR)) {
        return res.status(403).json({ error: 'You do not have permission to invite users to this room' });
      }

      // Check if user is already a member
      const existingUser = await db.User.findOne({ where: { email }, transaction });
      if (existingUser) {
        const existingMember = await db.RoomMember.findOne({
          where: { roomId, userId: existingUser.id },
          transaction,
        });

        if (existingMember) {
          return res.status(400).json({ error: 'User is already a member of this room' });
        }
      }

      // Check for existing invitation
      const existingInvitation = await db.RoomInvitation.findOne({
        where: { 
          roomId, 
          email,
          status: InvitationStatus.PENDING,
          expiresAt: { [Op.gt]: new Date() },
        },
        transaction,
      });

      if (existingInvitation) {
        return res.status(400).json({ error: 'An active invitation already exists for this email' });
      }

      // Create invitation
      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

      const invitation = await db.RoomInvitation.create(
        {
          roomId,
          email,
          role,
          token,
          invitedBy: userId,
          status: InvitationStatus.PENDING,
          expiresAt,
        },
        { transaction }
      );

      // Send invitation email
      const acceptUrl = `${config.app.clientUrl}/invite/accept/${token}`;
      await sendInvitationEmail(email, {
        inviterName: req.user?.name || 'A user',
        roomName: room.name,
        role,
        acceptUrl,
        expiresInHours: 24,
      });

      // Log the invitation
      await db.RoomActivity.create(
        {
          roomId,
          userId,
          activityType: ActivityType.INVITATION_SENT,
          metadata: { email, role },
        },
        { transaction }
      );

      await transaction.commit();
      res.status(201).json({ success: true, data: invitation });
    } catch (error) {
      await transaction.rollback();
      console.error('Error in inviteToRoom:', error);
      next(error);
    }
  }

  // Accept a room invitation
  public static async acceptInvitation(req: Request, res: Response, next: NextFunction) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const { token } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Find the invitation
      const invitation = await db.RoomInvitation.findOne({
        where: { 
          token,
          status: InvitationStatus.PENDING,
          expiresAt: { [Op.gt]: new Date() },
        },
        transaction,
      });

      if (!invitation) {
        return res.status(404).json({ error: 'Invalid or expired invitation' });
      }

      // Check if the email matches the user's email
      const user = await db.User.findByPk(userId, { transaction });
      if (!user || user.email !== invitation.email) {
        return res.status(403).json({ error: 'This invitation is not for your email address' });
      }

      // Check if user is already a member
      const existingMember = await db.RoomMember.findOne({
        where: { roomId: invitation.roomId, userId },
        transaction,
      });

      if (existingMember) {
        // Update the invitation status
        await invitation.update({ status: InvitationStatus.ACCEPTED }, { transaction });
        await transaction.commit();
        return res.json({ success: true, message: 'You are already a member of this room' });
      }

      // Add user as a member
      await db.RoomMember.create(
        {
          roomId: invitation.roomId,
          userId,
          role: invitation.role,
          joinedAt: new Date(),
          lastSeen: new Date(),
          isOnline: true,
        },
        { transaction }
      );

      // Update the invitation status
      await invitation.update({ status: InvitationStatus.ACCEPTED }, { transaction });

      // Log the activity
      await db.RoomActivity.create(
        {
          roomId: invitation.roomId,
          userId,
          activityType: ActivityType.USER_JOINED,
          metadata: { role: invitation.role },
        },
        { transaction }
      );

      await transaction.commit();
      res.json({ success: true, message: 'Successfully joined the room' });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Get room members
  public static async getRoomMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: roomId } = req.params;
      const userId = req.user?.id;

      // Check if room exists
      const room = await db.Room.findByPk(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Check if user has access to the room
      if (room.isPrivate) {
        if (!userId) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const isMember = await db.RoomMember.findOne({
          where: { roomId, userId },
        });

        if (!isMember && room.ownerId !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      // Get all members
      const members = await db.RoomMember.findAll({
        where: { roomId },
        include: [
          {
            model: db.User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'avatar'],
          },
        ],
      });

      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  }

  // Update member role
  public static async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const { id: roomId, userId } = req.params;
      const { role } = req.body;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if the room exists
      const room = await db.Room.findByPk(roomId, { transaction });
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Check if the current user is the room owner
      if (room.ownerId !== currentUserId) {
        return res.status(403).json({ error: 'Only the room owner can update member roles' });
      }

      // Check if the target user is a member
      const member = await db.RoomMember.findOne({
        where: { roomId, userId },
        transaction,
      });

      if (!member) {
        return res.status(404).json({ error: 'Member not found in this room' });
      }

      // Update the role
      await member.update({ role }, { transaction });

      // Log the activity
      await db.RoomActivity.create(
        {
          roomId,
          userId: currentUserId,
          activityType: ActivityType.PERMISSION_CHANGE,
          metadata: { targetUserId: userId, newRole: role },
        },
        { transaction }
      );

      await transaction.commit();
      res.json({ success: true, data: member });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Remove member from room
  public static async removeMember(req: Request, res: Response, next: NextFunction) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const { id: roomId, userId } = req.params;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if the room exists
      const room = await db.Room.findByPk(roomId, { transaction });
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Check if the current user has permission to remove members
      const currentUserMember = await db.RoomMember.findOne({
        where: { roomId, userId: currentUserId },
        transaction,
      });

      if (!currentUserMember || 
          (currentUserMember.role !== UserRole.OWNER && 
           currentUserMember.role !== UserRole.EDITOR &&
           currentUserId !== userId)) {
        return res.status(403).json({ error: 'You do not have permission to remove this member' });
      }

      // Check if the target user is a member
      const member = await db.RoomMember.findOne({
        where: { roomId, userId },
        transaction,
      });

      if (!member) {
        return res.status(404).json({ error: 'Member not found in this room' });
      }

      // Prevent removing the room owner
      if (room.ownerId === userId) {
        return res.status(400).json({ error: 'Cannot remove the room owner' });
      }

      // Remove the member
      await member.destroy({ transaction });

      // Log the activity
      await db.RoomActivity.create(
        {
          roomId,
          userId: currentUserId,
          activityType: ActivityType.USER_LEFT,
          metadata: { removedUserId: userId },
        },
        { transaction }
      );

      await transaction.commit();
      res.json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Get room activities
  public static async getRoomActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: roomId } = req.params;
      const userId = req.user?.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Check if room exists
      const room = await db.Room.findByPk(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Check if user has access to the room
      if (room.isPrivate) {
        if (!userId) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const isMember = await db.RoomMember.findOne({
          where: { roomId, userId },
        });

        if (!isMember && room.ownerId !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      // Get paginated activities
      const { count, rows: activities } = await db.RoomActivity.findAndCountAll({
        where: { roomId },
        include: [
          {
            model: db.User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'avatar'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset,
      });

      res.json({
        success: true,
        data: activities,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Cleanup inactive rooms (admin only)
  public static async cleanupInactiveRooms(req: Request, res: Response, next: NextFunction) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const { days = 30 } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user is admin
      const user = await db.User.findByPk(userId, { transaction });
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - Number(days));

      // Find inactive rooms (no activity for the specified days)
      const inactiveRooms = await db.Room.findAll({
        where: {
          lastActivityAt: { [Op.lt]: cutoffDate },
        },
        transaction,
      });

      const roomIds = inactiveRooms.map(room => room.id);
      
      if (roomIds.length === 0) {
        await transaction.commit();
        return res.json({ success: true, message: 'No inactive rooms found' });
      }

      // Delete related records
      await db.RoomMember.destroy({ where: { roomId: { [Op.in]: roomIds } }, transaction });
      await db.RoomInvitation.destroy({ where: { roomId: { [Op.in]: roomIds } }, transaction });
      await db.RoomActivity.destroy({ where: { roomId: { [Op.in]: roomIds } }, transaction });

      // Delete the rooms
      await db.Room.destroy({ where: { id: { [Op.in]: roomIds } }, transaction });

      // Log the cleanup
      for (const room of inactiveRooms) {
        await db.RoomActivity.create(
          {
            roomId: room.id,
            userId,
            activityType: ActivityType.ROOM_ARCHIVED,
            metadata: { name: room.name, reason: 'Inactivity' },
          },
          { transaction }
        );
      }

      await transaction.commit();
      res.json({ 
        success: true, 
        message: `Successfully cleaned up ${inactiveRooms.length} inactive rooms`,
        data: inactiveRooms.map(room => ({ id: room.id, name: room.name })),
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Helper method to hash passwords
  private static async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // Helper method to verify passwords
  private static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, hash);
  }
}

export default RoomController;
