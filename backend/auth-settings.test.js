import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { userDb, authSettingsDb, oidcSettingsDb, auditDb } from './database.js';
import { generateToken, authenticate, authorize, hashPassword } from './auth.js';
import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Setup minimal Express app for testing
const app = express();
app.use(cors());
app.use(express.json());

// Public auth config endpoint
app.get('/api/auth/config', async (req, res) => {
  try {
    const authSettings = await authSettingsDb?.get();
    const oidcSettings = await oidcSettingsDb?.get();

    res.json({
      registration_enabled: authSettings?.registration_enabled !== 0,
      password_login_enabled: authSettings?.password_login_enabled !== 0,
      oidc_enabled: oidcSettings?.enabled === 1
    });
  } catch (error) {
    res.json({
      registration_enabled: true,
      password_login_enabled: true,
      oidc_enabled: false
    });
  }
});

// Registration endpoint with protection
app.post('/api/auth/register', async (req, res) => {
  try {
    const authSettings = await authSettingsDb?.get();
    if (authSettings?.registration_enabled === 0) {
      return res.status(403).json({
        error: 'Registration is currently disabled. Please contact your administrator.'
      });
    }

    // Simplified registration for testing
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    res.json({ success: true, message: 'Registration would proceed' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint with protection
app.post('/api/auth/login', async (req, res) => {
  try {
    const authSettings = await authSettingsDb?.get();
    if (authSettings?.password_login_enabled === 0) {
      return res.status(403).json({
        error: 'Password login is disabled. Please use SSO to sign in.'
      });
    }

    // Simplified login for testing
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    res.json({ success: true, message: 'Login would proceed' });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Forgot password endpoint with protection
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const authSettings = await authSettingsDb?.get();
    if (authSettings?.password_login_enabled === 0) {
      return res.status(403).json({
        error: 'Password reset is not available when password login is disabled.'
      });
    }

    res.json({ success: true, message: 'Password reset email would be sent' });
  } catch (error) {
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Admin auth settings endpoints
app.get('/api/admin/auth-settings', authenticate, authorize('admin'), async (req, res) => {
  try {
    const settings = await authSettingsDb.get();
    res.json(settings || { registration_enabled: 1, password_login_enabled: 1 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get authentication settings' });
  }
});

app.put('/api/admin/auth-settings', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { registration_enabled, password_login_enabled } = req.body;

    // Validation: Cannot disable password login unless OIDC is enabled
    if (password_login_enabled === false) {
      const oidcSettings = await oidcSettingsDb.get();
      if (!oidcSettings?.enabled) {
        return res.status(400).json({
          error: 'Cannot disable password login without enabling OIDC/SSO first'
        });
      }
    }

    const updatedSettings = await authSettingsDb.update({
      registration_enabled,
      password_login_enabled
    }, req.user.email);

    res.json({ message: 'Authentication settings updated successfully', settings: updatedSettings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update authentication settings' });
  }
});

describe('Auth Settings', () => {
  let adminUser;
  let adminToken;
  let timestamp;

  beforeAll(async () => {
    timestamp = Date.now();

    // Create admin user
    const passwordHash = await hashPassword('adminpassword123');
    const adminResult = await userDb.create({
      email: `admin-auth-test-${timestamp}@test.com`,
      password_hash: passwordHash,
      name: 'Test Admin',
      first_name: 'Test',
      last_name: 'Admin',
      role: 'admin',
      manager_first_name: 'Manager',
      manager_last_name: 'Test',
      manager_email: 'manager@test.com'
    });

    adminUser = await userDb.getById(adminResult.id);
    adminToken = generateToken(adminUser);
  });

  afterAll(async () => {
    // Cleanup
    if (adminUser?.id) {
      try {
        await userDb.delete(adminUser.id);
      } catch (err) {
        console.warn('Failed to delete admin user:', err.message);
      }
    }

    // Reset auth settings to defaults
    try {
      await authSettingsDb.update({
        registration_enabled: true,
        password_login_enabled: true
      }, 'test-cleanup');
    } catch (err) {
      console.warn('Failed to reset auth settings:', err.message);
    }
  });

  beforeEach(async () => {
    // Reset settings before each test
    await authSettingsDb.update({
      registration_enabled: true,
      password_login_enabled: true
    }, 'test-setup');

    // Ensure OIDC is disabled by default
    try {
      await oidcSettingsDb.update({
        enabled: false
      }, 'test-setup');
    } catch (err) {
      // OIDC settings might not exist yet
    }
  });

  describe('GET /api/auth/config (Public)', () => {
    test('should return default config when settings are enabled', async () => {
      const response = await request(app)
        .get('/api/auth/config')
        .expect(200);

      expect(response.body.registration_enabled).toBe(true);
      expect(response.body.password_login_enabled).toBe(true);
      expect(response.body.oidc_enabled).toBe(false);
    });

    test('should reflect disabled registration', async () => {
      await authSettingsDb.update({
        registration_enabled: false,
        password_login_enabled: true
      }, 'test');

      const response = await request(app)
        .get('/api/auth/config')
        .expect(200);

      expect(response.body.registration_enabled).toBe(false);
      expect(response.body.password_login_enabled).toBe(true);
    });

    test('should reflect disabled password login', async () => {
      await authSettingsDb.update({
        registration_enabled: true,
        password_login_enabled: false
      }, 'test');

      const response = await request(app)
        .get('/api/auth/config')
        .expect(200);

      expect(response.body.registration_enabled).toBe(true);
      expect(response.body.password_login_enabled).toBe(false);
    });
  });

  describe('POST /api/auth/register (Protected)', () => {
    test('should allow registration when enabled', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'newuser@test.com', password: 'password123' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 403 when registration is disabled', async () => {
      await authSettingsDb.update({
        registration_enabled: false,
        password_login_enabled: true
      }, 'test');

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'newuser@test.com', password: 'password123' })
        .expect(403);

      expect(response.body.error).toContain('Registration is currently disabled');
    });
  });

  describe('POST /api/auth/login (Protected)', () => {
    test('should allow login when password login is enabled', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'password123' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 403 when password login is disabled', async () => {
      await authSettingsDb.update({
        registration_enabled: true,
        password_login_enabled: false
      }, 'test');

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'password123' })
        .expect(403);

      expect(response.body.error).toContain('Password login is disabled');
    });
  });

  describe('POST /api/auth/forgot-password (Protected)', () => {
    test('should allow forgot password when password login is enabled', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 403 when password login is disabled', async () => {
      await authSettingsDb.update({
        registration_enabled: true,
        password_login_enabled: false
      }, 'test');

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user@test.com' })
        .expect(403);

      expect(response.body.error).toContain('Password reset is not available');
    });
  });

  describe('GET /api/admin/auth-settings', () => {
    test('should return auth settings for admin', async () => {
      const response = await request(app)
        .get('/api/admin/auth-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('registration_enabled');
      expect(response.body).toHaveProperty('password_login_enabled');
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/admin/auth-settings')
        .expect(401);
    });
  });

  describe('PUT /api/admin/auth-settings', () => {
    test('should allow disabling registration', async () => {
      const response = await request(app)
        .put('/api/admin/auth-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ registration_enabled: false, password_login_enabled: true })
        .expect(200);

      expect(response.body.message).toContain('updated successfully');

      // Verify the setting was applied
      const settings = await authSettingsDb.get();
      expect(settings.registration_enabled).toBe(0);
    });

    test('should reject disabling password login without OIDC enabled', async () => {
      const response = await request(app)
        .put('/api/admin/auth-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ registration_enabled: true, password_login_enabled: false })
        .expect(400);

      expect(response.body.error).toContain('Cannot disable password login without enabling OIDC');
    });

    test('should allow disabling password login when OIDC is enabled', async () => {
      // First enable OIDC
      await oidcSettingsDb.update({
        enabled: true,
        issuer_url: 'https://example.com',
        client_id: 'test-client',
        client_secret: 'test-secret',
        redirect_uri: 'http://localhost/callback'
      }, 'test');

      const response = await request(app)
        .put('/api/admin/auth-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ registration_enabled: true, password_login_enabled: false })
        .expect(200);

      expect(response.body.message).toContain('updated successfully');

      // Verify the setting was applied
      const settings = await authSettingsDb.get();
      expect(settings.password_login_enabled).toBe(0);

      // Cleanup - disable OIDC
      await oidcSettingsDb.update({
        enabled: false
      }, 'test');
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .put('/api/admin/auth-settings')
        .send({ registration_enabled: false })
        .expect(401);
    });
  });

  describe('authSettingsDb', () => {
    test('should return default values when no settings exist', async () => {
      const settings = await authSettingsDb.get();

      expect(settings).toBeDefined();
      expect(settings.registration_enabled).toBeDefined();
      expect(settings.password_login_enabled).toBeDefined();
    });

    test('should update and persist settings', async () => {
      await authSettingsDb.update({
        registration_enabled: false,
        password_login_enabled: false
      }, 'test@test.com');

      const settings = await authSettingsDb.get();

      expect(settings.registration_enabled).toBe(0);
      expect(settings.password_login_enabled).toBe(0);
      expect(settings.updated_by).toBe('test@test.com');
    });
  });
});
