/**
 * Regression: user rows returned by the API must never include credential or
 * MFA material (password_hash, mfa_secret, mfa_backup_codes, oidc_sub).
 *
 * Previously GET /api/auth/users returned raw `SELECT *` rows to admins,
 * managers and coordinators, exposing every account's TOTP secret and backup
 * codes and bcrypt hash.
 */
import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { userDb, assetDb, auditDb } from './database.js';
import { authenticate, authorize, generateToken } from './auth.js';
import createUsersRouter from './routes/users.js';
import { sanitizeUser, SENSITIVE_USER_FIELDS } from './utils/sanitize-user.js';

describe('User secret exposure', () => {
  let app;
  const ts = Date.now();
  const tokens = {};

  beforeAll(async () => {
    await assetDb.init();

    app = express();
    app.use(express.json());
    app.use('/api/auth/users', createUsersRouter({ userDb, assetDb, auditDb, authenticate, authorize }));

    for (const role of ['admin', 'manager', 'coordinator']) {
      const email = `secrets-${role}-${ts}@test.com`;
      await userDb.create({ email, name: `${role} user`, password_hash: '$2a$10$fakehashfakehashfakehash', role });
      const user = await userDb.getByEmail(email);
      tokens[role] = generateToken(user);
    }

    // An MFA-enabled user whose secrets must never leak
    const victimEmail = `secrets-victim-${ts}@test.com`;
    await userDb.create({ email: victimEmail, name: 'Victim', password_hash: '$2a$10$victimhashvictimhash', role: 'admin' });
    const victim = await userDb.getByEmail(victimEmail);
    await userDb.enableMFA(victim.id, 'JBSWY3DPEHPK3PXP', ['AAAA1111', 'BBBB2222']);
  });

  it.each(['admin', 'manager', 'coordinator'])('GET /api/auth/users omits secrets for %s', async (role) => {
    const res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${tokens[role]}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const victim = res.body.find((u) => u.email === `secrets-victim-${ts}@test.com`);
    expect(victim).toBeDefined();
    expect(victim.mfa_enabled).toBeTruthy();

    for (const user of res.body) {
      for (const field of SENSITIVE_USER_FIELDS) {
        expect(user).not.toHaveProperty(field);
      }
    }
  });

  describe('userDb data layer', () => {
    const victimEmail = () => `secrets-victim-${ts}@test.com`;
    const expectNoSecrets = (user) => {
      expect(user).toBeTruthy();
      for (const field of SENSITIVE_USER_FIELDS) {
        expect(user).not.toHaveProperty(field);
      }
    };

    it('ordinary read methods never return credential fields', async () => {
      const victim = await userDb.getByEmail(victimEmail());
      expectNoSecrets(victim);
      expectNoSecrets(await userDb.getById(victim.id));
      (await userDb.getAll()).forEach(expectNoSecrets);
      (await userDb.getByRole('admin')).forEach(expectNoSecrets);
      (await userDb.getByEmails([victimEmail(), `secrets-admin-${ts}@test.com`])).forEach(expectNoSecrets);
      expect(victim.mfa_enabled).toBeTruthy();
    });

    it('*WithCredentials methods return the hash and MFA secret for auth checks', async () => {
      const byEmail = await userDb.getByEmailWithCredentials(victimEmail());
      expect(byEmail.password_hash).toBe('$2a$10$victimhashvictimhash');
      expect(byEmail.mfa_secret).toBe('JBSWY3DPEHPK3PXP');
      const byId = await userDb.getByIdWithCredentials(byEmail.id);
      expect(byId.password_hash).toBe('$2a$10$victimhashvictimhash');
      expect(await userDb.getByIdWithCredentials(-1)).toBeNull();
    });
  });

  describe('sanitizeUser helper', () => {
    it('removes every sensitive field and keeps the rest', () => {
      const row = {
        id: 1,
        email: 'a@b.com',
        role: 'admin',
        mfa_enabled: 1,
        password_hash: 'h',
        mfa_secret: 's',
        mfa_backup_codes: '["x"]',
        oidc_sub: 'sub'
      };
      expect(sanitizeUser(row)).toEqual({ id: 1, email: 'a@b.com', role: 'admin', mfa_enabled: 1 });
      // Does not mutate the input
      expect(row.password_hash).toBe('h');
    });

    it('passes through null/undefined', () => {
      expect(sanitizeUser(null)).toBeNull();
      expect(sanitizeUser(undefined)).toBeUndefined();
    });
  });
});
