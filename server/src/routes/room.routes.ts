import { Router } from 'express';
import {
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  deleteRoom,
  getRoomUsers,
  joinRoom,
} from '../controllers/room.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getRooms);
router.get('/:id', getRoom);
router.post('/:id/join', authenticate, joinRoom);

// Protected routes
router.use(authenticate);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);
router.get('/:id/users', getRoomUsers);

export default router;
