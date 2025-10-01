import { body, param, query } from 'express-validator';
import { UserRole } from '../models/Room';

// Validation for creating a room
export const createRoomValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Room name is required')
    .isLength({ min: 1, max: 100 }).withMessage('Room name must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  
  body('isPrivate')
    .optional()
    .isBoolean().withMessage('isPrivate must be a boolean'),
  
  body('password')
    .optional()
    .isString()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .custom((value, { req }) => {
      if (req.body.isPrivate && !value) {
        throw new Error('Password is required for private rooms');
      }
      return true;
    }),
  
  body('maxUsers')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Max users must be between 1 and 100'),
  
  body('settings')
    .optional()
    .isObject().withMessage('Settings must be an object'),
  
  body('settings.allowGuests')
    .optional()
    .isBoolean().withMessage('allowGuests must be a boolean'),
  
  body('settings.requireApproval')
    .optional()
    .isBoolean().withMessage('requireApproval must be a boolean'),
  
  body('settings.enableChat')
    .optional()
    .isBoolean().withMessage('enableChat must be a boolean'),
  
  body('settings.enableVoice')
    .optional()
    .isBoolean().withMessage('enableVoice must be a boolean'),
  
  body('settings.maxIdleTime')
    .optional()
    .isInt({ min: 1, max: 1440 }).withMessage('Max idle time must be between 1 and 1440 minutes'),
  
  body('settings.autoSave')
    .optional()
    .isBoolean().withMessage('autoSave must be a boolean'),
  
  body('settings.language')
    .optional()
    .isString().withMessage('Language must be a string'),
  
  body('settings.theme')
    .optional()
    .isString().withMessage('Theme must be a string'),
  
  body('settings.tabSize')
    .optional()
    .isInt({ min: 1, max: 8 }).withMessage('Tab size must be between 1 and 8'),
  
  body('settings.wordWrap')
    .optional()
    .isBoolean().withMessage('wordWrap must be a boolean'),
  
  body('settings.minimap')
    .optional()
    .isBoolean().withMessage('minimap must be a boolean'),
  
  body('settings.lineNumbers')
    .optional()
    .isBoolean().withMessage('lineNumbers must be a boolean'),
];

// Validation for updating a room
export const updateRoomValidation = [
  param('id')
    .notEmpty().withMessage('Room ID is required')
    .isUUID().withMessage('Invalid room ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Room name must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  
  body('isPrivate')
    .optional()
    .isBoolean().withMessage('isPrivate must be a boolean'),
  
  body('password')
    .optional()
    .isString()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  body('maxUsers')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Max users must be between 1 and 100'),
  
  body('settings')
    .optional()
    .isObject().withMessage('Settings must be an object'),
];

// Validation for room invitations
export const inviteToRoomValidation = [
  param('id')
    .notEmpty().withMessage('Room ID is required')
    .isUUID().withMessage('Invalid room ID'),
  
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address'),
  
  body('role')
    .optional()
    .isIn(Object.values(UserRole)).withMessage(`Role must be one of: ${Object.values(UserRole).join(', ')}`),
];

// Validation for accepting invitations
export const acceptInvitationValidation = [
  param('token')
    .notEmpty().withMessage('Invitation token is required')
    .isString().withMessage('Invalid invitation token'),
];

// Validation for room member operations
export const memberOperationValidation = [
  param('id')
    .notEmpty().withMessage('Room ID is required')
    .isUUID().withMessage('Invalid room ID'),
  
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .isUUID().withMessage('Invalid user ID'),
];

// Validation for updating member role
export const updateMemberRoleValidation = [
  ...memberOperationValidation,
  
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(Object.values(UserRole)).withMessage(`Role must be one of: ${Object.values(UserRole).join(', ')}`),
];

// Validation for listing rooms
export const listRoomsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search query is too long'),
  
  query('isPrivate')
    .optional()
    .isBoolean().withMessage('isPrivate must be a boolean')
    .toBoolean(),
  
  query('ownerId')
    .optional()
    .isUUID().withMessage('Invalid owner ID'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'createdAt', 'lastActive']).withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC'),
];

// Validation for room activities
export const roomActivitiesValidation = [
  param('id')
    .notEmpty().withMessage('Room ID is required')
    .isUUID().withMessage('Invalid room ID'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
];

// Validation for cleanup operation
export const cleanupValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
    .toInt(),
];
