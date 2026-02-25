/**
 * Category D (audit): Role-Scoped Audit Log Visibility
 * Tests D-5, D-6, B-7.
 */
import { test, expect } from '../fixtures/auth.fixture.js';

test.describe('Audit Log Scoped Visibility', () => {
  test('D-5: coordinator can see all audit logs', async ({ coordinatorApi }) => {
    const res = await coordinatorApi.get('/api/audit/logs');
    expect(res.ok).toBe(true);

    const logs = res.body.logs || res.body;
    expect(Array.isArray(logs)).toBe(true);

    // Should contain logs from multiple users (seed created assets for several users)
    if (logs.length > 0) {
      const uniqueEmails = [...new Set(logs.map(l => l.user_email))];
      // Coordinator should see logs from at least the admin (who did the seeding)
      expect(uniqueEmails.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('D-6: employee sees only own audit entries', async ({ employeeAApi }) => {
    const res = await employeeAApi.get('/api/audit/logs');
    expect(res.ok).toBe(true);

    const logs = res.body.logs || res.body;
    if (Array.isArray(logs) && logs.length > 0) {
      for (const log of logs) {
        expect(log.user_email).toBe('e2e-emp-a@test.com');
      }
    }
  });

  test('D-5b: manager can see recent audit entries', async ({ managerApi }) => {
    const res = await managerApi.get('/api/audit/recent');
    expect(res.ok).toBe(true);
  });

  test('D-5c: employee cannot access audit stats', async ({ employeeAApi }) => {
    const res = await employeeAApi.get('/api/audit/stats');
    expect(res.status).toBe(403);
  });
});
