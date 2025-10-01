import { Router } from 'express';
import { body, param, query } from 'express-validator';
import RoomController from '../../controllers/NewRoomController';
import { authenticate, authorize, validateRequest } from '../../middleware';
import { UserRole, ActivityType } from '../../models';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new room
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Room name is required'),
    body('description').optional().trim(),
    body('isPrivate').optional().isBoolean(),
    body('password')
      .optional()
      .isString()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('maxUsers').optional().isInt({ min: 1, max: 100 }),
    body('settings').optional().isObject(),
  ],
  validateRequest,
  RoomController.createRoom
);

// Get room details
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid room ID')],
  validateRequest,
  RoomController.getRoom
);

// Update room settings
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid room ID'),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('isPrivate').optional().isBoolean(),
    body('password')
      .optional()
      .isString()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('maxUsers').optional().isInt({ min: 1, max: 100 }),
    body('settings').optional().isObject(),
  ],
  validateRequest,
  authorize('room', 'update'),
  RoomController.updateRoom
);

// Delete a room
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid room ID')],
  validateRequest,
  authorize('room', 'delete'),
  RoomController.deleteRoom
);

// List rooms with pagination and filtering
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().trim(),
    query('sortBy')
      .optional()
      .isIn(['name', 'createdAt', 'updatedAt', 'memberCount']),
    query('sortOrder').optional().isIn(['ASC', 'DESC']),
  ],
  validateRequest,
  RoomController.listRooms
);

// Invite a user to a room
router.post(
  '/:id/invite',
  [
    param('id').isUUID().withMessage('Invalid room ID'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role')
      .optional()
      .isIn(Object.values(UserRole))
      .withMessage('Invalid role'),
  ],
  validateRequest,
  authorize('room', 'invite'),
  RoomController.inviteToRoom
);

// Accept a room invitation
router.post(
  '/invite/accept/:token',
  [param('token').isString().notEmpty()],
  validateRequest,
  RoomController.acceptInvitation
);

// Get room members
router.get(
  '/:id/members',
  [param('id').isUUID().withMessage('Invalid room ID')],
  validateRequest,
  authorize('room', 'read'),
  RoomController.getRoomMembers
);

// Update member role
router.put(
  '/:id/members/:userId/role',
  [
    param('id').isUUID().withMessage('Invalid room ID'),
    param('userId').isUUID().withMessage('Invalid user ID'),
    body('role')
      .isIn(Object.values(UserRole))
      .withMessage('Invalid role'),
  ],
  validateRequest,
  authorize('room', 'manageMembers'),
  RoomController.updateMemberRole
);

// Remove member from room
router.delete(
  '/:id/members/:userId',
  [
    param('id').isUUID().withMessage('Invalid room ID'),
    param('userId').isUUID().withMessage('Invalid user ID'),
  ],
  validateRequest,
  authorize('room', 'manageMembers'),
  RoomController.removeMember
);

// Get room activities
router.get(
  '/:id/activities',
  [
    param('id').isUUID().withMessage('Invalid room ID'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validateRequest,
  authorize('room', 'read'),
  RoomController.getRoomActivities
);

// Cleanup inactive rooms (admin only)
router.post(
  '/admin/cleanup',
  [
    body('days').optional().isInt({ min: 1, max: 365 }),
    body('dryRun').optional().isBoolean(),
  ],
  validateRequest,
  authorize('admin'),
  RoomController.cleanupInactiveRooms
);

export default router;
