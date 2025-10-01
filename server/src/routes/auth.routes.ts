import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { authenticate } from '../middleware/auth.js';
import passport from 'passport';

const router = Router();

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is running',
    endpoints: [
      'POST /register',
      'POST /login',
      'POST /logout',
      'POST /refresh-token',
      'GET /github',
      'GET /github/callback',
      'POST /forgot-password',
      'POST /reset-password/:token',
      'GET /verify-email/:token',
      'POST /resend-verification'
    ]
  });
});

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
router.get(
  '/github',
  authLimiter,
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get(
  '/github/callback',
  authLimiter,
  passport.authenticate('github', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=github_auth_failed`
  }),
  authController.githubAuthCallback
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
