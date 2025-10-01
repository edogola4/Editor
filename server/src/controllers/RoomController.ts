import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { Op, Transaction } from 'sequelize';
import db from '../models/index.js';
import { 
  RoomInstance, 
  RoomMember, 
  RoomInvitation, 
  RoomActivity, 
  ActivityType, 
  UserRole,
  InvitationStatus,
} from '../models/index.js';

// Import the UserInstance type
import { UserInstance } from '../models/User.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserInstance;
    }
  }
}

class RoomController {
  /**
   * List all rooms with optional filtering and pagination
   */
  static async listRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      const whereClause: any = {};
      
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      if (status) {
        whereClause.status = status;
      }
      
      const { count, rows: rooms } = await db.Room.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
        attributes: [
          'id', 'name', 'description', 'isPrivate', 'maxUsers', 
          'status', 'totalSessions', 'totalEdits', 'createdAt'
        ]
      });
      
      res.json({
        success: true,
        data: rooms,
        pagination: {
          total: count,
          page: Number(page),
          totalPages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single room by ID
   */
  static async getRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const room = await db.Room.findByPk(req.params.id, {
        attributes: [
          'id', 'name', 'description', 'isPrivate', 'maxUsers', 'ownerId',
          'status', 'totalSessions', 'totalEdits', 'averageSessionDuration',
          'activeUsers', 'lastActive', 'createdAt', 'updatedAt'
        ],
        include: [
          {
            model: db.RoomMember,
            as: 'members',
            attributes: ['userId', 'role', 'joinedAt', 'lastSeen', 'isOnline']
          }
        ]
      });

      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        });
        return;
      }

      // Check if the room is private and user has access
      if (room.isPrivate) {
        const hasAccess = await room.hasUser(req.user?.id || '');
        if (!hasAccess) {
          res.status(403).json({
            success: false,
            message: 'You do not have permission to access this room'
          });
          return;
        }
      }

      res.json({
        success: true,
        data: room
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept a room invitation
   */
  static async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const invitation = await db.RoomInvitation.findOne({
        where: { token, status: InvitationStatus.PENDING }
      });

      if (!invitation) {
        res.status(404).json({ success: false, message: 'Invitation not found or expired' });
        return;
      }

      // Add user to room
      await db.RoomMember.create({
        roomId: invitation.roomId,
        userId,
        role: invitation.role || UserRole.VIEWER
      });

      // Update invitation status
      await invitation.update({ status: InvitationStatus.ACCEPTED });

      res.json({
        success: true,
        message: 'Successfully joined the room',
        roomId: invitation.roomId
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new room
   */
  static async createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    const transaction = await db.sequelize.transaction();
    
    try {
      const { name, description, isPrivate, password, maxUsers, settings } = req.body;
      const ownerId = req.user?.id;

      if (!ownerId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const room = await db.Room.create({
        name,
        description,
        isPrivate,
        password: password ? await this.hashPassword(password) : null,
        maxUsers: maxUsers || 10,
        ownerId,
        settings: {
          allowGuests: true,
          requireApproval: false,
          enableChat: true,
          enableVoice: false,
          maxIdleTime: 30,
          autoSave: true,
          language: 'javascript',
          theme: 'vs-dark',
          tabSize: 2,
          wordWrap: true,
          minimap: true,
          lineNumbers: true,
          ...settings
        },
        status: 'active'
      }, { transaction });

      // Add owner as admin member
      await db.RoomMember.create({
        roomId: room.id,
        userId: ownerId,
        role: UserRole.OWNER
      }, { transaction });

      await transaction.commit();

      res.status(201).json({
        success: true,
        data: room
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Update a room
   */
  static async updateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, isPrivate, password, maxUsers, settings } = req.body;

      const room = await db.Room.findByPk(id);
      if (!room) {
        res.status(404).json({ success: false, message: 'Room not found' });
        return;
      }

      // Update room properties
      const updateData: any = {
        name: name || room.name,
        description: description !== undefined ? description : room.description,
        isPrivate: isPrivate !== undefined ? isPrivate : room.isPrivate,
        maxUsers: maxUsers || room.maxUsers,
        settings: {
          ...room.settings,
          ...(settings || {})
        }
      };

      // Only update password if provided
      if (password) {
        updateData.password = await this.hashPassword(password);
      }

      await room.update(updateData);

      res.json({
        success: true,
        data: room
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a room
   */
  static async deleteRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    const transaction = await db.sequelize.transaction();
    
    try {
      const { id } = req.params;

      // Delete related records first
      await db.RoomMember.destroy({ where: { roomId: id }, transaction });
      await db.RoomInvitation.destroy({ where: { roomId: id }, transaction });
      await db.RoomActivity.destroy({ where: { roomId: id }, transaction });
      
      // Delete the room
      const result = await db.Room.destroy({
        where: { id },
        transaction
      });

      if (result === 0) {
        await transaction.rollback();
        res.status(404).json({ success: false, message: 'Room not found' });
        return;
      }

      await transaction.commit();
      res.json({ success: true, message: 'Room deleted successfully' });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Invite a user to a room
   */
  static async inviteToRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: roomId } = req.params;
      const { email, role = UserRole.VIEWER } = req.body;
      const inviterId = req.user?.id;

      // Find the user by email
      const user = await db.User.findOne({ where: { email } });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Check if user is already a member
      const existingMember = await db.RoomMember.findOne({
        where: { roomId, userId: user.id }
      });

      if (existingMember) {
        res.status(400).json({ 
          success: false, 
          message: 'User is already a member of this room' 
        });
        return;
      }

      // Create invitation
      const invitation = await db.RoomInvitation.create({
        roomId,
        email,
        role,
        inviterId,
        token: uuidv4(),
        status: InvitationStatus.PENDING
      });

      // TODO: Send invitation email

      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        data: invitation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get room members
   */
  static async getRoomMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: roomId } = req.params;
      
      const members = await db.RoomMember.findAll({
        where: { roomId },
        include: [
          {
            model: db.User,
            attributes: ['id', 'username', 'email', 'avatar']
          }
        ]
      });

      res.json({
        success: true,
        data: members
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update member role
   */
  static async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: roomId, userId } = req.params;
      const { role } = req.body;

      const member = await db.RoomMember.findOne({
        where: { roomId, userId }
      });

      if (!member) {
        res.status(404).json({ success: false, message: 'Member not found' });
        return;
      }

      await member.update({ role });

      res.json({
        success: true,
        message: 'Member role updated successfully',
        data: member
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove member from room
   */
  static async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: roomId, userId } = req.params;
      const currentUserId = req.user?.id;

      // Don't allow removing yourself (use leaveRoom instead)
      if (userId === currentUserId) {
        res.status(400).json({ 
          success: false, 
          message: 'Use the leave room endpoint to leave a room' 
        });
        return;
      }

      const result = await db.RoomMember.destroy({
        where: { roomId, userId }
      });

      if (result === 0) {
        res.status(404).json({ success: false, message: 'Member not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Member removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper method to hash passwords
  private static async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // Helper method to verify passwords
  private static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = require('bcrypt');
    return bcrypt.compare(password, hash);
  }

  /**
   * Get room activities
   */
  static async getRoomActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: roomId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      // Check if room exists and user has access
      const hasAccess = await (db.Room as any).hasPermission(roomId, req.user?.id, UserRole.VIEWER);
      if (!hasAccess) {
        res.status(403).json({ message: 'You do not have permission to view activities for this room' });
        return;
      }

      const activities = await db.RoomActivity.findAndCountAll({
        where: { roomId },
        include: [
          {
            model: db.User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset: Number(offset)
      });

      res.json({
        success: true,
        data: activities.rows,
        meta: {
          total: activities.count,
          limit: Number(limit),
          offset: Number(offset)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clean up inactive rooms (admin only)
   */
  static async cleanupInactiveRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    const transaction = await db.sequelize.transaction();
    
    try {
      const { days = 30 } = req.body;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - Number(days));

      // Find inactive rooms
      const inactiveRooms = await db.Room.findAll({
        where: {
          lastActivityAt: { [db.Sequelize.Op.lt]: cutoffDate },
          status: 'inactive'
        },
        transaction
      });

      const roomIds = inactiveRooms.map(room => room.id);
      
      // Delete related data in transaction
      await Promise.all([
        db.RoomMember.destroy({ where: { roomId: roomIds }, transaction }),
        db.RoomInvitation.destroy({ where: { roomId: roomIds }, transaction }),
        db.RoomActivity.destroy({ where: { roomId: roomIds }, transaction })
      ]);

      // Delete the rooms
      const deletedCount = await db.Room.destroy({
        where: { id: roomIds },
        transaction
      });

      await transaction.commit();
      
      res.json({
        success: true,
        message: `Successfully cleaned up ${deletedCount} inactive rooms`,
        data: { deletedCount }
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
}

export default RoomController;
