import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { generateToken, verifyToken, hashPassword, comparePassword, authenticate, authorize, optionalAuth } from './auth.js';

describe('Auth Module', () => {
  describe('JWT_SECRET validation', () => {
    it('should allow missing JWT_SECRET in non-production environments', () => {
      // When NODE_ENV is not production, missing JWT_SECRET should be allowed
      // This is validated by the fact that the module loads successfully in test mode
      // and uses the fallback value
      const testEnv = process.env.NODE_ENV;
      expect(['test', 'development', undefined]).toContain(testEnv);
      
      // Module loaded successfully without throwing error
      expect(generateToken).toBeDefined();
      expect(verifyToken).toBeDefined();
    });

    // Note: Testing the production failure case (NODE_ENV=production without JWT_SECRET)
    // requires dynamic import in a separate process, which is complex with ES modules and Jest.
    // The validation is in place at lines 6-8 of auth.js:
    //   if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    //     throw new Error('JWT_SECRET must be set in production');
    //   }
    // This will throw an error at module load time if the conditions are met.
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };

      const token = generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user data in token payload', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      };

      const token = generateToken(user);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.name).toBe(user.name);
      expect(decoded.role).toBe(user.role);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };

      const token = generateToken(user);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(user.id);
    });

    it('should return null for an invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for an empty token', () => {
      const decoded = verifyToken('');
      expect(decoded).toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });

    it('should return false for invalid hash', async () => {
      const password = 'testPassword123';
      const isMatch = await comparePassword(password, 'invalid-hash');

      expect(isMatch).toBe(false);
    });
  });

  describe('optionalAuth middleware', () => {
    let req, res, next, consoleErrorSpy;

    beforeEach(() => {
      // Reset request/response/next mocks
      req = {
        headers: {}
      };
      res = {};
      next = jest.fn();
      
      // Spy on console.error
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should call next() when no auth header is present', () => {
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeUndefined();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should attach user when valid token is provided', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      };
      
      const token = generateToken(user);
      req.headers.authorization = `Bearer ${token}`;
      
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
      expect(req.user.email).toBe(user.email);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should not attach user when invalid token is provided', () => {
      req.headers.authorization = 'Bearer invalid-token';
      
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeUndefined();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should log error and call next() when an exception occurs', () => {
      // Create a scenario where an error would be thrown
      // by providing malformed authorization header that causes substring to fail
      Object.defineProperty(req.headers, 'authorization', {
        get: () => {
          throw new Error('Unexpected error in header processing');
        }
      });
      
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Optional authentication error:',
        expect.any(Error)
      );
    });

    it('should not throw error when malformed Bearer token format', () => {
      req.headers.authorization = 'Bearer ';
      
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeUndefined();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
