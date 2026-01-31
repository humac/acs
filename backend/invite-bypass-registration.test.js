/**
 * Invite-Bypass Registration Tests
 *
 * Tests the registration gate bypass logic in routes/auth.js (lines 78-108).
 * When self-service registration is disabled, users with a valid attestation
 * invite token should still be allowed to register.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  userDb, companyDb, assetDb,
  attestationCampaignDb, attestationPendingInviteDb,
  authSettingsDb
} from './database.js';
import { hashPassword, generateToken } from './auth.js';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Create test Express app replicating the invite-bypass gate from routes/auth.js
const app = express();
app.use(cors());
app.use(express.json());

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skipFailedRequests: true,
  keyGenerator: () => 'test'
});

app.post('/api/auth/register', authRateLimiter, async (req, res) => {
  try {
    // Check if registration is enabled (mirrors routes/auth.js lines 78-108)
    const authSettings = await authSettingsDb?.get();
    if (authSettings?.registration_enabled === 0) {
      const { invite_token } = req.body;
      let inviteValid = false;

      if (invite_token && attestationPendingInviteDb && attestationCampaignDb) {
        try {
          const invite = await attestationPendingInviteDb.getByToken(invite_token);
          if (invite && !invite.registered_at) {
            const campaign = await attestationCampaignDb.getById(invite.campaign_id);
            if (campaign && campaign.status === 'active') {
              const { email } = req.body;
              if (email && invite.employee_email.toLowerCase() === email.toLowerCase()) {
                inviteValid = true;
              }
            }
          }
        } catch (inviteError) {
          // Silently fail invite validation
        }
      }

      if (!inviteValid) {
        return res.status(403).json({
          error: 'Registration is currently disabled. Please contact your administrator.'
        });
      }
    }

    // Minimal registration logic (enough to test the gate)
    const { email, password, first_name, last_name, manager_first_name, manager_last_name, manager_email } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'Both first_name and last_name are required' });
    }
    if (!manager_first_name || !manager_last_name || !manager_email) {
      return res.status(400).json({ error: 'Manager information is required' });
    }

    const existingUser = await userDb.getByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const password_hash = await hashPassword(password);
    const result = await userDb.create({
      email,
      password_hash,
      name: `${first_name} ${last_name}`,
      first_name,
      last_name,
      manager_first_name,
      manager_last_name,
      manager_email,
      role: 'employee'
    });

    const token = generateToken({ id: result.id, email, role: 'employee' });
    res.status(201).json({ success: true, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

describe('Invite-bypass registration (registration disabled)', () => {
  let timestamp;
  let testCompany, adminUser;
  let activeCampaign, draftCampaign;
  let validInvite, usedInvite, wrongEmailInvite, draftCampaignInvite;
  const createdUserEmails = [];

  beforeAll(async () => {
    timestamp = Date.now();

    // Disable self-service registration
    await authSettingsDb.update({ registration_enabled: false, password_login_enabled: true }, 'invite-bypass-test');

    // Create test company
    testCompany = await companyDb.create({
      name: `InvBypass Co ${timestamp}`
    });

    // Create admin user (needed for campaign creation)
    await userDb.create({
      email: `admin-invbypass-${timestamp}@test.com`,
      name: 'Admin InvBypass',
      first_name: 'Admin',
      last_name: 'InvBypass',
      password_hash: '$2b$10$hashhashhashhashhashhashhashhash',
      role: 'admin'
    });
    adminUser = await userDb.getByEmail(`admin-invbypass-${timestamp}@test.com`);

    // Create an active campaign
    activeCampaign = await attestationCampaignDb.create({
      name: `Active Campaign ${timestamp}`,
      description: 'Active campaign for invite bypass tests',
      start_date: new Date().toISOString(),
      status: 'active',
      reminder_days: 7,
      escalation_days: 10,
      created_by: adminUser.id
    });
    await attestationCampaignDb.update(activeCampaign.id, { status: 'active' });

    // Create a draft (inactive) campaign
    draftCampaign = await attestationCampaignDb.create({
      name: `Draft Campaign ${timestamp}`,
      description: 'Draft campaign for invite bypass tests',
      start_date: new Date().toISOString(),
      status: 'draft',
      reminder_days: 7,
      escalation_days: 10,
      created_by: adminUser.id
    });

    // 1) Valid invite: active campaign, matching email, unused
    const validEmail = `invbypass-valid-${timestamp}@test.com`;
    validInvite = await attestationPendingInviteDb.create({
      campaign_id: activeCampaign.id,
      employee_email: validEmail,
      employee_first_name: 'Valid',
      employee_last_name: 'Invite',
      invite_token: `valid-token-${timestamp}`
    });

    // 2) Used invite: active campaign, but already registered_at is set
    const usedEmail = `invbypass-used-${timestamp}@test.com`;
    usedInvite = await attestationPendingInviteDb.create({
      campaign_id: activeCampaign.id,
      employee_email: usedEmail,
      employee_first_name: 'Used',
      employee_last_name: 'Invite',
      invite_token: `used-token-${timestamp}`
    });
    // Mark it as already used
    await attestationPendingInviteDb.update(usedInvite.id, {
      registered_at: new Date().toISOString()
    });

    // 3) Wrong-email invite: active campaign, but for a different email
    const wrongEmail = `invbypass-wrong-target-${timestamp}@test.com`;
    wrongEmailInvite = await attestationPendingInviteDb.create({
      campaign_id: activeCampaign.id,
      employee_email: wrongEmail,
      employee_first_name: 'Wrong',
      employee_last_name: 'Target',
      invite_token: `wrongemail-token-${timestamp}`
    });

    // 4) Draft-campaign invite: invite exists but campaign is draft
    const draftEmail = `invbypass-draft-${timestamp}@test.com`;
    draftCampaignInvite = await attestationPendingInviteDb.create({
      campaign_id: draftCampaign.id,
      employee_email: draftEmail,
      employee_first_name: 'Draft',
      employee_last_name: 'Campaign',
      invite_token: `draft-token-${timestamp}`
    });
  });

  afterAll(async () => {
    // Re-enable registration
    await authSettingsDb.update({ registration_enabled: true, password_login_enabled: true }, 'invite-bypass-test-cleanup');

    // Clean up created users
    for (const email of createdUserEmails) {
      try {
        const user = await userDb.getByEmail(email);
        if (user) await userDb.delete(user.id);
      } catch (err) {
        console.warn(`Failed to delete test user ${email}:`, err.message);
      }
    }

    // Clean up invites, campaigns, admin, company
    try {
      if (validInvite?.id) await attestationPendingInviteDb.delete(validInvite.id);
      if (usedInvite?.id) await attestationPendingInviteDb.delete(usedInvite.id);
      if (wrongEmailInvite?.id) await attestationPendingInviteDb.delete(wrongEmailInvite.id);
      if (draftCampaignInvite?.id) await attestationPendingInviteDb.delete(draftCampaignInvite.id);
      if (activeCampaign?.id) await attestationCampaignDb.delete(activeCampaign.id);
      if (draftCampaign?.id) await attestationCampaignDb.delete(draftCampaign.id);
      if (adminUser?.id) await userDb.delete(adminUser.id);
      if (testCompany?.id) await companyDb.delete(testCompany.id);
    } catch (err) {
      console.warn('Error cleaning up invite bypass test data:', err.message);
    }
  });

  it('should allow registration with valid invite token when registration is disabled', async () => {
    const email = `invbypass-valid-${timestamp}@test.com`;
    createdUserEmails.push(email);

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password: 'Test123!',
        first_name: 'Valid',
        last_name: 'Invite',
        manager_first_name: 'Manager',
        manager_last_name: 'Person',
        manager_email: 'manager@test.com',
        invite_token: `valid-token-${timestamp}`
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('should reject registration with already-used invite token', async () => {
    const email = `invbypass-used-${timestamp}@test.com`;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password: 'Test123!',
        first_name: 'Used',
        last_name: 'Invite',
        manager_first_name: 'Manager',
        manager_last_name: 'Person',
        manager_email: 'manager@test.com',
        invite_token: `used-token-${timestamp}`
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Registration is currently disabled');
  });

  it('should reject registration when email does not match invite', async () => {
    // The invite is for invbypass-wrong-target-*@test.com, but we register with a different email
    const mismatchedEmail = `invbypass-mismatch-${timestamp}@test.com`;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: mismatchedEmail,
        password: 'Test123!',
        first_name: 'Mismatch',
        last_name: 'User',
        manager_first_name: 'Manager',
        manager_last_name: 'Person',
        manager_email: 'manager@test.com',
        invite_token: `wrongemail-token-${timestamp}`
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Registration is currently disabled');
  });

  it('should reject registration when invite campaign is not active', async () => {
    const email = `invbypass-draft-${timestamp}@test.com`;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password: 'Test123!',
        first_name: 'Draft',
        last_name: 'Campaign',
        manager_first_name: 'Manager',
        manager_last_name: 'Person',
        manager_email: 'manager@test.com',
        invite_token: `draft-token-${timestamp}`
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Registration is currently disabled');
  });

  it('should reject registration without invite token when registration is disabled', async () => {
    const email = `invbypass-notoken-${timestamp}@test.com`;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password: 'Test123!',
        first_name: 'No',
        last_name: 'Token',
        manager_first_name: 'Manager',
        manager_last_name: 'Person',
        manager_email: 'manager@test.com'
        // No invite_token
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Registration is currently disabled');
  });
});
