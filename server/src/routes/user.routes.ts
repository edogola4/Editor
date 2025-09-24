import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimit';

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
  (req, res, next) => {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Admin access required',
      });
    }
    next();
  },
  userController.getUserById,
);

// Get all users (admin only)
router.get(
  '/',
  (req, res, next) => {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Admin access required',
      });
    }
    next();
  },
  userController.getAllUsers,
);

export default router;
