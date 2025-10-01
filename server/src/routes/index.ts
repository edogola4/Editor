import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import roomRoutes from './v1/room.routes'; // Updated to use new room routes
import documentRoutes from './document.routes';
import { authenticate } from '../middleware';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes (require authentication)
router.use(authenticate);
router.use('/users', userRoutes);
router.use('/rooms', roomRoutes); // This now points to our new room routes
router.use('/documents', documentRoutes);

export default router;
