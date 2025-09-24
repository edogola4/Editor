import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimit';
import { authenticate } from '../middleware/auth';
import passport from 'passport';

const router = Router();

// Register route
router.post(
  '/register',
  authLimiter,
  validate('register'),
  authController.register,
);

// Login route
router.post(
  '/login',
  authLimiter,
  validate('login'),
  authController.login,
);

// Logout route
router.post('/logout', authenticate, authController.logout);

// Refresh token route
router.post(
  '/refresh-token',
  [
    body('refreshToken')
      .optional()
      .isString()
      .withMessage('Refresh token must be a string'),
  ],
  validate('refreshToken'),
  authController.refreshToken,
);

// GitHub OAuth routes
router.get('/github', authLimiter, authController.githubAuth);

router.get(
  '/github/callback',
  authLimiter,
  authController.githubAuthCallback,
);

// Password reset routes
router.post(
  '/forgot-password',
  authLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
  ],
  validate('forgotPassword'),
  authController.forgotPassword,
);

router.post(
  '/reset-password/:token',
  authLimiter,
  [
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[^a-zA-Z0-9]/)
      .withMessage('Password must contain at least one special character'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  ],
  validate('resetPassword'),
  authController.resetPassword,
);

// Email verification routes
router.get(
  '/verify-email/:token',
  authLimiter,
  authController.verifyEmail,
);

router.post(
  '/resend-verification',
  authLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
  ],
  validate('resendVerification'),
  authController.resendVerificationEmail,
);

export default router;
