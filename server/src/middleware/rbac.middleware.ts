import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/EnhancedUser';

/**
 * Middleware to check if user has required roles
 * @param allowedRoles Array of allowed roles
 * @returns Middleware function
 */
export const checkRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get user from request (attached by auth middleware)
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Check if user has one of the allowed roles
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is the owner of a resource
 * @param resourceOwnerIdField Field in request that contains the resource owner's ID
 * @returns Middleware function
 */
export const checkOwnership = (resourceOwnerIdField: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Admins and owners can access any resource
    if (user.role === UserRole.ADMIN || user.role === UserRole.OWNER) {
      return next();
    }

    // Check if user is the owner of the resource
    const resourceOwnerId = req.params[resourceOwnerIdField] || req.body[resourceOwnerIdField];
    
    if (user.id !== resourceOwnerId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to access this resource' 
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is the owner or has a specific role
 * @param allowedRoles Array of allowed roles
 * @param resourceOwnerIdField Field in request that contains the resource owner's ID
 * @returns Middleware function
 */
export const checkRoleOrOwnership = (allowedRoles: UserRole[], resourceOwnerIdField: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Check if user has one of the allowed roles
    if (allowedRoles.includes(user.role)) {
      return next();
    }

    // Check if user is the owner of the resource
    const resourceOwnerId = req.params[resourceOwnerIdField] || req.body[resourceOwnerIdField];
    
    if (user.id === resourceOwnerId) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      error: 'Insufficient permissions' 
    });
  };
};

/**
 * Middleware to check if user has all required permissions
 * @param requiredPermissions Array of required permissions
 * @returns Middleware function
 */
export const checkPermissions = (requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    try {
      // TODO: Implement permission checking logic
      // This would typically involve querying the database for the user's permissions
      // and checking if they have all the required permissions
      
      // For now, we'll just check if the user is an admin/owner
      if (user.role === UserRole.ADMIN || user.role === UserRole.OWNER) {
        return next();
      }

      // TODO: Replace with actual permission check
      const hasAllPermissions = true; // Placeholder
      
      if (!hasAllPermissions) {
        return res.status(403).json({ 
          success: false, 
          error: 'Insufficient permissions' 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error checking permissions' 
      });
    }
  };
};

// Export all middleware
export default {
  checkRole,
  checkOwnership,
  checkRoleOrOwnership,
  checkPermissions
};
