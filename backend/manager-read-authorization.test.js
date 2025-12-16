import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { userDb, companyDb, attestationCampaignDb } from './database.js';
import { generateToken } from './auth.js';
import request from 'supertest';
import express from 'express';
import { authenticate, authorize } from './auth.js';

// Create minimal express app with the endpoints for testing
const app = express();
app.use(express.json());

// Mock attestation campaigns endpoint
app.get('/api/attestation/campaigns', authenticate, authorize('admin', 'manager'), async (req, res) => {
  res.json({ success: true, campaigns: [] });
});

// Mock specific campaign endpoint
app.get('/api/attestation/campaigns/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  res.json({ success: true, campaign: { id: req.params.id }, stats: {} });
});

// Mock campaign dashboard endpoint
app.get('/api/attestation/campaigns/:id/dashboard', authenticate, authorize('admin', 'manager'), async (req, res) => {
  res.json({ success: true, campaign: { id: req.params.id }, records: [] });
});

// Mock companies endpoint
app.get('/api/companies', authenticate, authorize('admin', 'manager'), async (req, res) => {
  res.json([]);
});

describe('Manager Read-Only Authorization', () => {
  let adminUser, managerUser, employeeUser;
  let adminToken, managerToken, employeeToken;
  let timestamp;

  beforeAll(async () => {
    // Use timestamp to ensure unique test data
    timestamp = Date.now();

    // Create mock user objects for token generation
    adminUser = {
      id: 1,
      email: `admin-read-${timestamp}@test.com`,
      name: 'Admin User',
      role: 'admin'
    };
    adminToken = generateToken(adminUser);

    managerUser = {
      id: 2,
      email: `manager-read-${timestamp}@test.com`,
      name: 'Manager User',
      role: 'manager'
    };
    managerToken = generateToken(managerUser);

    employeeUser = {
      id: 3,
      email: `employee-read-${timestamp}@test.com`,
      name: 'Employee User',
      role: 'employee'
    };
    employeeToken = generateToken(employeeUser);
  });

  describe('GET /api/attestation/campaigns', () => {
    it('should allow admin access', async () => {
      const response = await request(app)
        .get('/api/attestation/campaigns')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow manager access for read-only', async () => {
      const response = await request(app)
        .get('/api/attestation/campaigns')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny employee access with 403', async () => {
      const response = await request(app)
        .get('/api/attestation/campaigns')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app)
        .get('/api/attestation/campaigns');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/attestation/campaigns/:id', () => {
    it('should allow admin access', async () => {
      const response = await request(app)
        .get('/api/attestation/campaigns/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow manager access for read-only', async () => {
      const response = await request(app)
        .get('/api/attestation/campaigns/1')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny employee access with 403', async () => {
      const response = await request(app)
        .get('/api/attestation/campaigns/1')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('GET /api/attestation/campaigns/:id/dashboard', () => {
    it('should allow admin access', async () => {
      const response = await request(app)
        .get('/api/attestation/campaigns/1/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow manager access for read-only', async () => {
      const response = await request(app)
        .get('/api/attestation/campaigns/1/dashboard')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny employee access with 403', async () => {
      const response = await request(app)
        .get('/api/attestation/campaigns/1/dashboard')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('GET /api/companies', () => {
    it('should allow admin access', async () => {
      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow manager access for read-only', async () => {
      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny employee access with 403', async () => {
      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app)
        .get('/api/companies');

      expect(response.status).toBe(401);
    });
  });
});
