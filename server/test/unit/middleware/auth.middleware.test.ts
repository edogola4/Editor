import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../../src/middleware/auth.middleware';
import { createTestUser } from '../../test-utils';
import { User } from '../../../src/models/User';
import { db } from '../../../src/services/database/DatabaseService';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../test-utils';

// Mock the verify function
vi.mock('jsonwebtoken', () => ({
  verify: vi.fn(),
}));

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let testUser: User;
  let validToken: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    
    // Create a test user
    testUser = await createTestUser({
      username: 'authmiddleware',
      email: 'authmiddleware@example.com',
    });
    
    // Generate a valid token
    validToken = testUser.generateAuthToken();
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock request
    mockReq = {
      headers: {},
    };
    
    // Setup mock response
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
    };
    
    // Setup mock next function
    mockNext = vi.fn();
  });

  afterEach(async () => {
    // Clean up any test data
    await db.User.destroy({ where: {}, force: true });
  });

  describe('Authentication', () => {
    it('should call next() with valid token', async () => {
      // Mock request with valid token
      mockReq.headers = {
        authorization: `Bearer ${validToken}`,
      };
      
      // Mock jwt.verify to return the decoded token
      (jwt.verify as jest.Mock).mockImplementation(() => ({
        id: testUser.id,
        email: testUser.email,
      }));
      
      // Call the middleware
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      // Verify the user was attached to the request
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.id).toBe(testUser.id);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 if no token is provided', async () => {
      // Call the middleware without a token
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      // Verify the response
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      // Mock request with invalid token
      mockReq.headers = {
        authorization: 'Bearer invalidtoken',
      };
      
      // Mock jwt.verify to throw an error
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Call the middleware
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      // Verify the response
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      // Mock request with valid token for non-existent user
      mockReq.headers = {
        authorization: `Bearer ${validToken}`,
      };
      
      // Mock jwt.verify to return a non-existent user ID
      (jwt.verify as jest.Mock).mockImplementation(() => ({
        id: 999999, // Non-existent user ID
        email: 'nonexistent@example.com',
      }));
      
      // Call the middleware
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      // Verify the response
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Role-based Access Control', () => {
    let adminUser: User;
    let adminToken: string;
    
    beforeAll(async () => {
      // Create an admin user
      adminUser = await createTestUser({
        username: 'adminuser',
        email: 'admin@example.com',
        role: 'admin',
      });
      
      adminToken = adminUser.generateAuthToken();
    });
    
    it('should allow admin to access admin route', async () => {
      // Mock request with admin token
      mockReq.headers = {
        authorization: `Bearer ${adminToken}`,
      };
      
      // Mock jwt.verify to return admin user
      (jwt.verify as jest.Mock).mockImplementation(() => ({
        id: adminUser.id,
        email: adminUser.email,
        role: 'admin',
      }));
      
      // Mock the role check
      const checkRole = (roles: string[]) => {
        return (req: Request, res: Response, next: NextFunction) => {
          if (!roles.includes(req.user?.role || '')) {
            return res.status(403).json({
              success: false,
              error: 'Forbidden: Insufficient permissions',
            });
          }
          next();
        };
      };
      
      // First authenticate
      await authMiddleware(mockReq as Request, mockRes as Response, () => {});
      
      // Then check role
      const mockNextRole = vi.fn();
      checkRole(['admin'])(mockReq as Request, mockRes as Response, mockNextRole);
      
      // Should allow access
      expect(mockNextRole).toHaveBeenCalled();
    });
    
    it('should not allow non-admin to access admin route', async () => {
      // Mock request with regular user token
      mockReq.headers = {
        authorization: `Bearer ${validToken}`,
      };
      
      // Mock jwt.verify to return regular user
      (jwt.verify as jest.Mock).mockImplementation(() => ({
        id: testUser.id,
        email: testUser.email,
        role: 'user',
      }));
      
      // Mock the role check
      const checkRole = (roles: string[]) => {
        return (req: Request, res: Response, next: NextFunction) => {
          if (!roles.includes(req.user?.role || '')) {
            return res.status(403).json({
              success: false,
              error: 'Forbidden: Insufficient permissions',
            });
          }
          next();
        };
      };
      
      // First authenticate
      await authMiddleware(mockReq as Request, mockRes as Response, () => {});
      
      // Then check role
      const mockResRole = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      
      checkRole(['admin'])(
        mockReq as Request, 
        mockResRole as unknown as Response, 
        vi.fn()
      );
      
      // Should deny access
      expect(mockResRole.status).toHaveBeenCalledWith(403);
      expect(mockResRole.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden: Insufficient permissions',
      });
    });
  });

  describe('Rate Limiting', () => {
    // Note: This is a simplified test. In a real application, you'd want to test
    // the rate limiting logic more thoroughly, including the actual rate limiting behavior.
    
    it('should allow requests below rate limit', async () => {
      // This would test that the rate limiting middleware allows requests
      // when they're below the configured rate limit.
      // Implementation would depend on your rate limiting setup.
    });
    
    it('should block requests above rate limit', async () => {
      // This would test that the rate limiting middleware blocks requests
      // when they exceed the configured rate limit.
      // Implementation would depend on your rate limiting setup.
    });
  });
});
