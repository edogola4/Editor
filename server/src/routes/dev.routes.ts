import { Router, Request, Response } from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Only enable these routes in development
if (process.env.NODE_ENV !== 'production') {
  /**
   * Promote current user to admin (DEV ONLY)
   */
  router.post('/promote-to-admin', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const user = await User.findByPk(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Update user role to admin
      user.role = 'admin';
      await user.save();

      res.json({
        success: true,
        message: 'User promoted to admin successfully',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Error promoting user to admin:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to promote user to admin',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Promote any user to admin by email (DEV ONLY)
   */
  router.post('/promote-user-to-admin', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      const user = await User.findOne({ where: { email } });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Update user role to admin
      user.role = 'admin';
      await user.save();

      res.json({
        success: true,
        message: 'User promoted to admin successfully',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Error promoting user to admin:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to promote user to admin',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Get all users (DEV ONLY - no auth required)
   */
  router.get('/users', async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await User.findAll({
        attributes: ['id', 'username', 'email', 'role', 'isVerified', 'createdAt'],
        order: [['createdAt', 'DESC']],
      });

      res.json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Reset database (DEV ONLY - DANGEROUS)
   */
  router.post('/reset-database', async (req: Request, res: Response): Promise<void> => {
    try {
      const { confirm } = req.body;

      if (confirm !== 'YES_DELETE_ALL_DATA') {
        res.status(400).json({
          success: false,
          message: 'Confirmation required. Send { "confirm": "YES_DELETE_ALL_DATA" }',
        });
        return;
      }

      // Import sequelize
      const { sequelize } = await import('../../db/index.js');

      // Sync database (force: true will drop all tables and recreate them)
      await sequelize.sync({ force: true });

      res.json({
        success: true,
        message: 'Database reset successfully. All data has been deleted.',
      });
    } catch (error) {
      console.error('Error resetting database:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset database',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  console.log('⚠️  Development routes enabled at /api/dev');
} else {
  // In production, return 404 for all dev routes
  router.all('*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Development routes are not available in production',
    });
  });
}

export default router;
