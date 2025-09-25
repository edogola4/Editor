import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/DatabaseService';
import { logger } from '../../utils/logger';

export class MessageService {
  private static instance: MessageService;

  private constructor() {}

  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  public async saveMessage({
    roomId,
    userId,
    content,
    type = 'text',
    metadata = {},
  }: {
    roomId: string;
    userId: string;
    content: string;
    type?: 'text' | 'code' | 'system' | 'action';
    metadata?: Record<string, any>;
  }) {
    try {
      const message = await db.getModel('Message').create({
        id: uuidv4(),
        roomId,
        userId,
        content,
        type,
        metadata,
      });

      // Update room's updatedAt
      await db.getModel('Room').update(
        { updatedAt: new Date() },
        { where: { id: roomId } }
      );

      // Update user's last active time
      await db.getModel('User').update(
        { lastActiveAt: new Date() },
        { where: { id: userId } }
      );

      return message;
    } catch (error) {
      logger.error('Error saving message:', error);
      throw error;
    }
  }

  public async getMessages({
    roomId,
    limit = 50,
    before,
    after,
  }: {
    roomId: string;
    limit?: number;
    before?: Date;
    after?: Date;
  }) {
    try {
      const where: any = { roomId };
      
      if (before) {
        where.createdAt = { [db.getSequelize().Op.lt]: before };
      }
      
      if (after) {
        where.createdAt = { [db.getSequelize().Op.gt]: after };
      }

      const messages = await db.getModel('Message').findAll({
        where,
        include: [
          {
            model: db.getModel('User'),
            as: 'sender',
            attributes: ['id', 'username', 'email', 'avatar'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
      });

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      logger.error('Error fetching messages:', error);
      throw error;
    }
  }

  public async saveCodeEdit({
    roomId,
    userId,
    content,
    diff,
    cursorPosition,
    version,
  }: {
    roomId: string;
    userId: string;
    content: string;
    diff?: any;
    cursorPosition?: { line: number; ch: number };
    version: number;
  }) {
    try {
      const codeEdit = await db.getModel('CodeEdit').create({
        id: uuidv4(),
        roomId,
        userId,
        content,
        diff,
        cursorPosition,
        version,
      });

      // Update room's updatedAt
      await db.getModel('Room').update(
        { updatedAt: new Date() },
        { where: { id: roomId } }
      );

      // Update user's last active time
      await db.getModel('User').update(
        { lastActiveAt: new Date() },
        { where: { id: userId } }
      );

      return codeEdit;
    } catch (error) {
      logger.error('Error saving code edit:', error);
      throw error;
    }
  }

  public async getCodeHistory({
    roomId,
    limit = 100,
    before,
  }: {
    roomId: string;
    limit?: number;
    before?: Date;
  }) {
    try {
      const where: any = { roomId };
      
      if (before) {
        where.createdAt = { [db.getSequelize().Op.lt]: before };
      }

      const history = await db.getModel('CodeEdit').findAll({
        where,
        include: [
          {
            model: db.getModel('User'),
            as: 'editor',
            attributes: ['id', 'username'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
      });

      return history;
    } catch (error) {
      logger.error('Error fetching code history:', error);
      throw error;
    }
  }

  public async getLatestCode(roomId: string) {
    try {
      const latest = await db.getModel('CodeEdit').findOne({
        where: { roomId },
        order: [['version', 'DESC']],
      });

      return latest;
    } catch (error) {
      logger.error('Error fetching latest code:', error);
      throw error;
    }
  }
}

export const messageService = MessageService.getInstance();
