/**
 * Regression: POST /api/auth/mfa/verify-login must not allow unlimited TOTP
 * guessing. Sessions are capped at a fixed number of failed attempts, expire
 * after 5 minutes, and only real login sessions (not MFA enrollments sharing
 * the same store) are accepted.
 */
import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import speakeasy from 'speakeasy';
import { userDb, auditDb, assetDb } from './database.js';
import { authenticate, comparePassword, generateToken } from './auth.js';
import { generateMFASecret, verifyTOTP, generateBackupCodes, formatBackupCode } from './mfa.js';
import { safeJsonParseArray } from './utils/json.js';
import createMFARouter from './routes/mfa.js';

describe('MFA verify-login brute-force protections', () => {
  const ts = Date.now();
  const secret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
  let app;
  let user;
  let mfaSessions;

  const newSession = (overrides = {}) => {
    const id = `sess-${Math.random().toString(36).slice(2)}`;
    mfaSessions.set(id, { userId: user.id, email: user.email, role: user.role, createdAt: Date.now(), ...overrides });
    return id;
  };

  const verify = (mfaSessionId, token) =>
    request(app).post('/api/auth/mfa/verify-login').send({ mfaSessionId, token });

  const validCode = () => speakeasy.totp({ secret, encoding: 'base32' });
  const wrongCode = () => (validCode() === '000000' ? '111111' : '000000');

  beforeAll(async () => {
    await assetDb.init();
    const email = `mfa-brute-${ts}@test.com`;
    await userDb.create({ email, name: 'MFA User', password_hash: 'hash', role: 'employee' });
    user = await userDb.getByEmail(email);
    await userDb.enableMFA(user.id, secret, JSON.stringify(['AAAA1111']));
  });

  beforeEach(() => {
    mfaSessions = new Map();
    app = express();
    app.use(express.json());
    app.use('/api/auth/mfa', createMFARouter({
      userDb, auditDb, authenticate, comparePassword, generateToken,
      generateMFASecret, verifyTOTP, generateBackupCodes, formatBackupCode,
      pendingMFAEnrollments: mfaSessions, mfaSessions, safeJsonParseArray
    }));
  });

  it('accepts a valid code and consumes the session', async () => {
    const id = newSession();
    const res = await verify(id, validCode());
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(mfaSessions.has(id)).toBe(false);
  });

  it('invalidates the session after 5 wrong codes, even if the next code is right', async () => {
    const id = newSession();
    for (let i = 0; i < 4; i++) {
      const res = await verify(id, wrongCode());
      expect(res.status).toBe(401);
      expect(mfaSessions.has(id)).toBe(true);
    }
    const fifth = await verify(id, wrongCode());
    expect(fifth.status).toBe(401);
    expect(fifth.body.error).toMatch(/sign in again/i);
    expect(mfaSessions.has(id)).toBe(false);

    const after = await verify(id, validCode());
    expect(after.status).toBe(400);
  });

  it('rejects sessions older than 5 minutes', async () => {
    const id = newSession({ createdAt: Date.now() - 6 * 60 * 1000 });
    const res = await verify(id, validCode());
    expect(res.status).toBe(400);
    expect(mfaSessions.has(id)).toBe(false);
  });

  it('does not accept an MFA enrollment entry as a login session', async () => {
    mfaSessions.set(`enroll_${user.id}`, { secret, timestamp: Date.now() });
    const res = await verify(`enroll_${user.id}`, validCode());
    expect(res.status).toBe(400);
  });

  it('rejects non-string session ids and tokens', async () => {
    const id = newSession();
    const res = await request(app)
      .post('/api/auth/mfa/verify-login')
      .send({ mfaSessionId: id, token: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  it('applies the injected rate limiter to verify-login', async () => {
    let calls = 0;
    const limitedApp = express();
    limitedApp.use(express.json());
    limitedApp.use('/api/auth/mfa', createMFARouter({
      userDb, auditDb, authenticate, comparePassword, generateToken,
      generateMFASecret, verifyTOTP, generateBackupCodes, formatBackupCode,
      pendingMFAEnrollments: mfaSessions, mfaSessions, safeJsonParseArray,
      mfaRateLimiter: (req, res) => { calls += 1; res.status(429).json({ error: 'limited' }); }
    }));
    const res = await request(limitedApp)
      .post('/api/auth/mfa/verify-login')
      .send({ mfaSessionId: newSession(), token: validCode() });
    expect(res.status).toBe(429);
    expect(calls).toBe(1);
  });

  it('uses a +/-1 step TOTP window', () => {
    const now = Date.now() / 1000;
    const at = (offsetSteps) => speakeasy.totp({ secret, encoding: 'base32', time: now + offsetSteps * 30 });
    expect(verifyTOTP(secret, at(0))).toBe(true);
    expect(verifyTOTP(secret, at(-1))).toBe(true);
    expect(verifyTOTP(secret, at(3))).toBe(false);
    expect(verifyTOTP(secret, at(-3))).toBe(false);
  });
});
