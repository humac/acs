/**
 * Email Verification Tests
 *
 * Tests for email verification token management and related database operations.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { randomBytes } from 'crypto';
import { emailVerificationTokenDb, userDb, assetDb } from './database.js';
import { hashPassword } from './auth.js';

describe('Email Verification Token Management', () => {
  let testUserId;
  const testEmail = `test-verify-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Initialize database
    await assetDb.init();

    // Create a test user
    const passwordHash = await hashPassword('testpassword123');
    const result = await userDb.create({
      email: testEmail,
      password_hash: passwordHash,
      name: 'Test User',
      first_name: 'Test',
      last_name: 'User',
      manager_first_name: 'Manager',
      manager_last_name: 'Test',
      manager_email: 'manager@example.com',
      role: 'employee'
    });
    testUserId = result.id;
  }, 30000); // Increase timeout to 30 seconds for CI environments

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await emailVerificationTokenDb.deleteByUserId(testUserId);
      await userDb.delete(testUserId);
    }
  });

  describe('Token Creation', () => {
    afterEach(async () => {
      // Clean up tokens after each test
      await emailVerificationTokenDb.deleteByUserId(testUserId);
    });

    it('should create a registration verification token', async () => {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // create(email, token, expiresAt, tokenType, userId)
      const result = await emailVerificationTokenDb.create(
        testEmail,
        token,
        expiresAt,
        'registration',
        testUserId
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('should create an email change verification token', async () => {
      const token = randomBytes(32).toString('hex');
      const newEmail = 'newemail@example.com';
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // create(email, token, expiresAt, tokenType, userId)
      const result = await emailVerificationTokenDb.create(
        newEmail,
        token,
        expiresAt,
        'email_change',
        testUserId
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('should create unique tokens', async () => {
      const token1 = randomBytes(32).toString('hex');
      const token2 = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // create(email, token, expiresAt, tokenType, userId)
      await emailVerificationTokenDb.create(testEmail, token1, expiresAt, 'registration', testUserId);
      await emailVerificationTokenDb.create(testEmail, token2, expiresAt, 'registration', testUserId);

      expect(token1).not.toBe(token2);
    });
  });

  describe('Token Retrieval', () => {
    let createdToken;

    beforeEach(async () => {
      createdToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      // create(email, token, expiresAt, tokenType, userId)
      await emailVerificationTokenDb.create(testEmail, createdToken, expiresAt, 'registration', testUserId);
    });

    afterEach(async () => {
      await emailVerificationTokenDb.deleteByUserId(testUserId);
    });

    it('should find a token by its value', async () => {
      const foundToken = await emailVerificationTokenDb.findByToken(createdToken);

      expect(foundToken).toBeDefined();
      expect(foundToken.token).toBe(createdToken);
      expect(foundToken.user_id).toBe(testUserId);
      expect(foundToken.email).toBe(testEmail);
      expect(foundToken.token_type).toBe('registration');
      expect(foundToken.used).toBe(0);
    });

    it('should return null for non-existent token', async () => {
      const nonExistentToken = 'nonexistent-token-12345';

      const foundToken = await emailVerificationTokenDb.findByToken(nonExistentToken);

      expect(foundToken).toBeNull();
    });

    it('should find token by email', async () => {
      const token = await emailVerificationTokenDb.findByEmail(testEmail);

      expect(token).toBeDefined();
      expect(token.email).toBe(testEmail.toLowerCase());
      expect(token.token).toBe(createdToken);
    });

    it('should find token by user ID', async () => {
      const token = await emailVerificationTokenDb.findByUserId(testUserId);

      expect(token).toBeDefined();
      expect(token.user_id).toBe(testUserId);
      expect(token.token).toBe(createdToken);
    });
  });

  describe('Token Usage', () => {
    afterEach(async () => {
      await emailVerificationTokenDb.deleteByUserId(testUserId);
    });

    it('should mark a token as used', async () => {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // create(email, token, expiresAt, tokenType, userId)
      const result = await emailVerificationTokenDb.create(testEmail, token, expiresAt, 'registration', testUserId);
      await emailVerificationTokenDb.markAsUsed(result.id);

      const foundToken = await emailVerificationTokenDb.findByToken(token);

      expect(foundToken.used).toBe(1);
    });
  });

  describe('Token Deletion', () => {
    it('should delete all tokens for a user', async () => {
      const token1 = randomBytes(32).toString('hex');
      const token2 = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // create(email, token, expiresAt, tokenType, userId)
      await emailVerificationTokenDb.create(testEmail, token1, expiresAt, 'registration', testUserId);
      await emailVerificationTokenDb.create(testEmail, token2, expiresAt, 'registration', testUserId);

      await emailVerificationTokenDb.deleteByUserId(testUserId);

      const foundToken1 = await emailVerificationTokenDb.findByToken(token1);
      const foundToken2 = await emailVerificationTokenDb.findByToken(token2);

      expect(foundToken1).toBeNull();
      expect(foundToken2).toBeNull();
    });

    it('should delete tokens by email', async () => {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // create(email, token, expiresAt, tokenType, userId)
      await emailVerificationTokenDb.create(testEmail, token, expiresAt, 'registration', testUserId);

      await emailVerificationTokenDb.deleteByEmail(testEmail);

      const foundToken = await emailVerificationTokenDb.findByToken(token);

      expect(foundToken).toBeNull();
    });

    it('should delete expired tokens', async () => {
      const token = randomBytes(32).toString('hex');
      // Create an already expired token (1 hour in the past)
      const expiresAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      // create(email, token, expiresAt, tokenType, userId)
      await emailVerificationTokenDb.create(testEmail, token, expiresAt, 'registration', testUserId);
      await emailVerificationTokenDb.deleteExpired();

      const foundToken = await emailVerificationTokenDb.findByToken(token);

      expect(foundToken).toBeNull();
    });
  });

  describe('Token Expiry Validation', () => {
    afterEach(async () => {
      await emailVerificationTokenDb.deleteByUserId(testUserId);
    });

    it('should correctly identify expired tokens', async () => {
      const token = randomBytes(32).toString('hex');
      // Create an already expired token
      const expiresAt = new Date(Date.now() - 1000).toISOString();

      // create(email, token, expiresAt, tokenType, userId)
      await emailVerificationTokenDb.create(testEmail, token, expiresAt, 'registration', testUserId);

      const foundToken = await emailVerificationTokenDb.findByToken(token);
      const now = new Date();
      const tokenExpiry = new Date(foundToken.expires_at);

      expect(tokenExpiry < now).toBe(true);
    });

    it('should correctly identify valid (non-expired) tokens', async () => {
      const token = randomBytes(32).toString('hex');
      // Create a token that expires in 24 hours
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // create(email, token, expiresAt, tokenType, userId)
      await emailVerificationTokenDb.create(testEmail, token, expiresAt, 'registration', testUserId);

      const foundToken = await emailVerificationTokenDb.findByToken(token);
      const now = new Date();
      const tokenExpiry = new Date(foundToken.expires_at);

      expect(tokenExpiry > now).toBe(true);
    });
  });
});

describe('User Email Verification Status', () => {
  let testUserId;
  const testEmail = `test-status-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Initialize database
    await assetDb.init();

    // Create a test user
    const passwordHash = await hashPassword('testpassword123');
    const result = await userDb.create({
      email: testEmail,
      password_hash: passwordHash,
      name: 'Test User',
      first_name: 'Test',
      last_name: 'User',
      manager_first_name: 'Manager',
      manager_last_name: 'Test',
      manager_email: 'manager@example.com',
      role: 'employee'
    });
    testUserId = result.id;
  }, 30000); // Increase timeout to 30 seconds for CI environments

  afterAll(async () => {
    if (testUserId) {
      await userDb.delete(testUserId);
    }
  });

  it('should set email as verified', async () => {
    await userDb.setEmailVerified(testUserId);

    const user = await userDb.getById(testUserId);

    expect(user.email_verified).toBe(1);
  });

  it('should set email as unverified', async () => {
    await userDb.setEmailUnverified(testUserId);

    const user = await userDb.getById(testUserId);

    expect(user.email_verified).toBe(0);
  });

  it('should toggle verification status correctly', async () => {
    // Start unverified
    await userDb.setEmailUnverified(testUserId);
    let user = await userDb.getById(testUserId);
    expect(user.email_verified).toBe(0);

    // Set to verified
    await userDb.setEmailVerified(testUserId);
    user = await userDb.getById(testUserId);
    expect(user.email_verified).toBe(1);

    // Set back to unverified
    await userDb.setEmailUnverified(testUserId);
    user = await userDb.getById(testUserId);
    expect(user.email_verified).toBe(0);
  });
});

describe('User Email Update', () => {
  let testUserId;
  const originalEmail = `test-update-${Date.now()}@example.com`;
  const newEmail = `test-updated-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Initialize database
    await assetDb.init();

    // Create a test user
    const passwordHash = await hashPassword('testpassword123');
    const result = await userDb.create({
      email: originalEmail,
      password_hash: passwordHash,
      name: 'Test User',
      first_name: 'Test',
      last_name: 'User',
      manager_first_name: 'Manager',
      manager_last_name: 'Test',
      manager_email: 'manager@example.com',
      role: 'employee'
    });
    testUserId = result.id;
  }, 30000); // Increase timeout to 30 seconds for CI environments

  afterAll(async () => {
    if (testUserId) {
      await userDb.delete(testUserId);
    }
  });

  it('should update user email', async () => {
    const result = await userDb.updateEmail(testUserId, newEmail);

    expect(result).toBeDefined();
    expect(result.changes).toBe(1);

    const user = await userDb.getById(testUserId);
    expect(user.email).toBe(newEmail);
  });

  it('should be able to find user by new email', async () => {
    const user = await userDb.getByEmail(newEmail);

    expect(user).toBeDefined();
    expect(user.id).toBe(testUserId);
  });

  it('should not find user by old email', async () => {
    const user = await userDb.getByEmail(originalEmail);

    expect(user).toBeNull();
  });
});
