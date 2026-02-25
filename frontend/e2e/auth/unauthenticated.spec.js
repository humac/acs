/**
 * Category A: Authentication Boundaries (API-level)
 * Tests A-2, A-3, A-4 — unauthenticated and invalid-token API access.
 */
import { test, expect } from '../fixtures/auth.fixture.js';
import { ApiClient } from '../support/api-client.js';

test.describe('Unauthenticated API Access', () => {
  test('A-2: unauthenticated GET /api/assets returns 401', async ({ anonApi }) => {
    const res = await anonApi.get('/api/assets');
    expect(res.status).toBe(401);
  });

  test('A-3: invalid JWT token returns 401', async () => {
    const client = new ApiClient('invalid-token-garbage');
    const res = await client.get('/api/assets');
    expect(res.status).toBe(401);
  });

  test('A-4: malformed Bearer header returns 401', async () => {
    const client = new ApiClient('');
    // Manually craft a bad auth header
    const res = await fetch('http://localhost:3001/api/assets', {
      headers: { 'Authorization': 'Bearer ' },
    });
    expect(res.status).toBe(401);
  });

  test('A-2b: unauthenticated GET /api/auth/users returns 401', async ({ anonApi }) => {
    const res = await anonApi.get('/api/auth/users');
    expect(res.status).toBe(401);
  });

  test('A-2c: unauthenticated GET /api/audit/logs returns 401', async ({ anonApi }) => {
    const res = await anonApi.get('/api/audit/logs');
    expect(res.status).toBe(401);
  });

  test('A-2d: unauthenticated POST /api/assets returns 401', async ({ anonApi }) => {
    const res = await anonApi.post('/api/assets', { serial_number: 'HACK' });
    expect(res.status).toBe(401);
  });
});
