import { body, ValidationChain } from 'express-validator';
import { CustomError } from '../utils/errors.js';
import { User } from '../models/index.js';

const UserModel = User;

export const validateRegister = (): ValidationChain[] => [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .custom(async (value) => {
      const user = await UserModel.findOne({ where: { username: value } });
      if (user) {
        throw new Error('Username already in use');
      }
      return true;
    }),

  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom(async (value) => {
      const user = await UserModel.findOne({ where: { email: value } });
      if (user) {
        throw new Error('Email already in use');
      }
      return true;
    }),

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
];

export const validateLogin = (): ValidationChain[] => [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password').exists().withMessage('Password is required'),
];

export const validateUpdateProfile = (): ValidationChain[] => [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .custom(async (value, { req }) => {
      if (!value) return true;
      const user = await UserModel.findOne({ where: { username: value } });
      if (user && user.id !== req.user!.id) {
        throw new Error('Username already in use');
      }
      return true;
    }),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom(async (value, { req }) => {
      if (!value) return true;
      const user = await UserModel.findOne({ where: { email: value } });
      if (user && user.id !== req.user!.id) {
        throw new Error('Email already in use');
      }
      return true;
    }),

  body('currentPassword')
    .if((value, { req }) => req.body.newPassword)
    .exists()
    .withMessage('Current password is required when changing password'),

  body('newPassword')
    .if((value, { req }) => req.body.currentPassword)
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number')
    .matches(/[a-z]/)
    .withMessage('New password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[^a-zA-Z0-9]/)
    .withMessage('New password must contain at least one special character'),
];

export const validateRefreshToken = (): ValidationChain[] => [
  body('refreshToken')
    .optional()
    .isString()
    .withMessage('Refresh token must be a string'),
];

// Generic validate function that returns the appropriate validation chain
export const validate = (method: string): ValidationChain[] => {
  switch (method) {
    case 'register':
      return validateRegister();
    case 'login':
      return validateLogin();
    case 'updateProfile':
      return validateUpdateProfile();
    case 'refreshToken':
      return validateRefreshToken();
    case 'forgotPassword':
      return [
        body('email')
          .isEmail()
          .withMessage('Please provide a valid email')
          .normalizeEmail(),
      ];
    case 'resetPassword':
      return [
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
      ];
    case 'resendVerification':
      return [
        body('email')
          .isEmail()
          .withMessage('Please provide a valid email')
          .normalizeEmail(),
      ];
    case 'updateSettings':
      return [
        body('theme')
          .optional()
          .isIn(['light', 'dark', 'system'])
          .withMessage('Theme must be one of: light, dark, system'),
        body('notifications')
          .optional()
          .isBoolean()
          .withMessage('Notifications must be a boolean value'),
      ];
    default:
      return [];
  }
};
