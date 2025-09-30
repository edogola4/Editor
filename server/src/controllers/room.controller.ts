import { Request, Response, NextFunction } from 'express';
import db, { Room } from '../models/index.js';
import { roomService } from '../socket/services/room.service.js';

const { sequelize } = db;

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Create a new collaboration room
 */
export const createRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, isPrivate, password, maxUsers } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Create room in database
    const room = await Room.create({
      name: name || 'Untitled Room',
      description: description || '',
      isPrivate: isPrivate || false,
      password: password || null,
      maxUsers: maxUsers || 10,
      ownerId: userId,
      status: 'active',
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
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: room.id,
        name: room.name,
        description: room.description,
        isPrivate: room.isPrivate,
        maxUsers: room.maxUsers,
        ownerId: room.ownerId,
        status: room.status,
        settings: room.settings,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all rooms (public rooms or user's rooms)
 */
export const getRooms = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { status = 'active', limit = 50, offset = 0 } = req.query;

    // Validate query parameters
    const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100 items per page
    const offsetNum = Math.max(0, parseInt(offset as string) || 0);

    // Build where clause
    const where: any = {
      status: status as string,
    };

    // Only show public rooms for unauthenticated users
    if (!userId) {
      where.isPrivate = false;
    }

    // Get rooms with pagination
    const { count, rows: rooms } = await Room.findAndCountAll({
      where,
      limit: limitNum,
      offset: offsetNum,
      order: [['updatedAt', 'DESC']],
      attributes: [
        'id', 
        'name', 
        'description', 
        'isPrivate', 
        'maxUsers', 
        'ownerId', 
        'status', 
        'createdAt', 
        'updatedAt'
      ],
    });

    res.json({
      success: true,
      data: rooms,
      pagination: {
        total: count,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + rooms.length < count,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific room by ID
 */
export const getRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const room = await Room.findByPk(id);

    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    // Check if user has access to private room
    if (room.isPrivate && room.ownerId !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: room.id,
        name: room.name,
        description: room.description,
        isPrivate: room.isPrivate,
        maxUsers: room.maxUsers,
        ownerId: room.ownerId,
        status: room.status,
        settings: room.settings,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a room
 */
export const updateRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, isPrivate, password, maxUsers, settings, status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const room = await Room.findByPk(id);

    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    // Check if user is the owner
    if (room.ownerId !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Update room
    await room.update({
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(isPrivate !== undefined && { isPrivate }),
      ...(password !== undefined && { password }),
      ...(maxUsers && { maxUsers }),
      ...(settings && { settings: { ...room.settings, ...settings } }),
      ...(status && { status }),
    });

    res.json({
      success: true,
      data: {
        id: room.id,
        name: room.name,
        description: room.description,
        isPrivate: room.isPrivate,
        maxUsers: room.maxUsers,
        status: room.status,
        settings: room.settings,
        updatedAt: room.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a room
 */
export const deleteRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const room = await Room.findByPk(id);

    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    // Check if user is the owner
    if (room.ownerId !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    await room.destroy();

    res.json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active users in a room
 */
export const getRoomUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const room = await Room.findByPk(id);

    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    // Check if user has access
    if (room.isPrivate && room.ownerId !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Get active users from room service
    const users = roomService.getRoomMembers(id);

    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join a room (verify password if private)
 */
export const joinRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const room = await Room.findByPk(id);

    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    // Check if room is private and password is required
    if (room.isPrivate && room.password) {
      if (!password || password !== room.password) {
        res.status(403).json({ success: false, message: 'Invalid password' });
        return;
      }
    }

    // Check if room is full
    const currentUsers = roomService.getRoomMembers(id);
    if (currentUsers.length >= room.maxUsers) {
      res.status(403).json({ success: false, message: 'Room is full' });
      return;
    }

    res.json({
      success: true,
      message: 'You can join this room',
      data: {
        roomId: room.id,
        name: room.name,
        settings: room.settings,
      },
    });
  } catch (error) {
    next(error);
  }
};
