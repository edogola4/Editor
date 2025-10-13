import { Router } from 'express';
import { executionController } from '../controllers/execution.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protected routes (require authentication)
router.use(authMiddleware);

// Execute code
router.post('/execute', executionController.executeCode);

// Get available languages
router.get('/languages', executionController.getLanguages);

export default router;
