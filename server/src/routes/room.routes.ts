import { Router } from 'express';
import { param } from 'express-validator';
import RoomController from '../controllers/RoomController';
import { 
  authenticate, 
  authorize, 
  validateRequest 
} from '../middleware';
import { 
  createRoomValidation,
  updateRoomValidation,
  inviteToRoomValidation,
  acceptInvitationValidation,
  memberOperationValidation,
  updateMemberRoleValidation,
  listRoomsValidation,
  roomActivitiesValidation,
  cleanupValidation
} from '../middleware/room.validation';

const router = Router();

// Public routes
router.get(
  '/',
  validateRequest(listRoomsValidation),
  RoomController.listRooms
);

router.get(
  '/:id',
  validateRequest([
    param('id').isUUID().withMessage('Invalid room ID')
  ]),
  RoomController.getRoom
);

// Invitation acceptance (public but requires authentication)
router.post(
  '/invitations/:token/accept',
  validateRequest(acceptInvitationValidation),
  authenticate,
  RoomController.acceptInvitation
);

// Protected routes (require authentication)
router.use(authenticate);

// Room management
router.post(
  '/',
  validateRequest(createRoomValidation),
  RoomController.createRoom
);

router.put(
  '/:id',
  validateRequest(updateRoomValidation),
  authorize('room', 'update'),
  RoomController.updateRoom
);

router.delete(
  '/:id',
  validateRequest([
    param('id').isUUID().withMessage('Invalid room ID')
  ]),
  authorize('room', 'delete'),
  RoomController.deleteRoom
);

// Room invitations
router.post(
  '/:id/invite',
  validateRequest(inviteToRoomValidation),
  authorize('room', 'invite'),
  RoomController.inviteToRoom
);

// Room members
router.get(
  '/:id/members',
  validateRequest([
    param('id').isUUID().withMessage('Invalid room ID')
  ]),
  authorize('room', 'read'),
  RoomController.getRoomMembers
);

router.put(
  '/:id/members/:userId/role',
  validateRequest(updateMemberRoleValidation),
  authorize('room', 'manageMembers'),
  RoomController.updateMemberRole
);

delete router[':id/members/:userId'];

router.delete(
  '/:id/members/:userId',
  validateRequest(memberOperationValidation),
  authorize('room', 'manageMembers'),
  RoomController.removeMember
);

// Room activities
router.get(
  '/:id/activities',
  validateRequest(roomActivitiesValidation),
  authorize('room', 'read'),
  RoomController.getRoomActivities
);

// Admin routes
router.post(
  '/admin/cleanup',
  validateRequest(cleanupValidation),
  authorize('admin'),
  RoomController.cleanupInactiveRooms
);

export default router;
