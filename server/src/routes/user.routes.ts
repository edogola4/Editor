import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller.js';
import { validate } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimit.js';
import { CustomError } from '../utils/errors.js';

const router = Router();

// Apply authentication middleware to all user routes
router.use(authenticate);

// Apply rate limiting to all user routes
router.use(apiLimiter);

// Get current user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put(
  '/profile',
  validate('updateProfile'),
  userController.updateProfile,
);

// Delete user account
router.delete('/profile', userController.deleteAccount);

// Update user settings
router.put(
  '/settings',
  [
    body('theme')
      .optional()
      .isIn(['light', 'dark', 'system'])
      .withMessage('Theme must be one of: light, dark, system'),
    body('notifications')
      .optional()
      .isBoolean()
      .withMessage('Notifications must be a boolean value'),
  ],
  validate('updateSettings'),
  userController.updateSettings,
);

// Get user by ID (admin only)
router.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: Admin access required',
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  userController.getUserById,
);

// Get all users (admin only)
router.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: Admin access required',
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  userController.getAllUsers,
);

export default router;
