import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { githubController } from '../controllers/github.controller.js';

const router = Router();

// OAuth flow
router.get('/auth', githubController.authorize);
router.get('/callback', githubController.callback);

// Webhooks
router.post('/webhook', githubController.handleWebhook);

// Protected routes (require authentication)
router.use(authenticate);

// Repositories
router.get(
  '/repos',
  [
    query('page').optional().isInt({ min: 1 }),
    query('perPage').optional().isInt({ min: 1, max: 100 }),
    query('visibility').optional().isIn(['all', 'public', 'private']),
  ],
  validate('listRepositories'),
  githubController.listRepositories
);

// Repository content
router.get(
  '/repos/:owner/:repo/contents/*?',
  [
    query('ref').optional().isString(),
  ],
  validate('getRepositoryContent'),
  githubController.getRepositoryContent
);

// File content
router.get(
  '/repos/:owner/:repo/contents/:path',
  [
    query('ref').optional().isString(),
  ],
  validate('getFileContent'),
  githubController.getFileContent
);

// Save file
router.put(
  '/repos/:owner/:repo/contents/:path',
  [
    body('content').isString().notEmpty(),
    body('message').isString().notEmpty(),
    body('sha').optional().isString(),
    body('branch').optional().isString(),
  ],
  validate('saveFile'),
  githubController.saveFile
);

// Branches
router.get(
  '/repos/:owner/:repo/branches',
  githubController.listBranches
);

router.post(
  '/repos/:owner/:repo/branches',
  [
    body('name').isString().notEmpty(),
    body('fromBranch').optional().isString(),
  ],
  validate('createBranch'),
  githubController.createBranch
);

// Pull Requests
router.post(
  '/repos/:owner/:repo/pulls',
  [
    body('title').isString().notEmpty(),
    body('body').optional().isString(),
    body('head').isString().notEmpty(),
    body('base').isString().notEmpty(),
    body('draft').optional().isBoolean(),
  ],
  validate('createPullRequest'),
  githubController.createPullRequest
);

export { router as githubRoutes };
