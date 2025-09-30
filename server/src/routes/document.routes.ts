import { Router } from 'express';
import {
  createDocument,
  getUserDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  getDocumentHistory,
  forkDocument,
  shareDocument,
} from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Document CRUD
router.post('/', createDocument);
router.get('/', getUserDocuments);
router.get('/:id', getDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

// Document operations
router.get('/:id/history', getDocumentHistory);
router.post('/:id/fork', forkDocument);
router.patch('/:id/share', shareDocument);

export default router;
