/**
 * Category C (users): Admin Self-Protection
 * Tests C-10, C-11.
 */
import { test, expect } from '../fixtures/auth.fixture.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadState() {
  return JSON.parse(readFileSync(resolve(__dirname, '..', '.e2e-state.json'), 'utf-8'));
}

test.describe('Admin Self-Protection', () => {
  test('C-10: admin cannot demote themselves', async ({ adminApi }) => {
    const state = loadState();
    const admin = state.users.admin;

    const res = await adminApi.put(`/api/auth/users/${admin.id}/role`, { role: 'employee' });
    expect(res.status).toBe(403);
  });

  test('C-11: admin cannot delete themselves', async ({ adminApi }) => {
    const state = loadState();
    const admin = state.users.admin;

    const res = await adminApi.delete(`/api/auth/users/${admin.id}`);
    expect(res.status).toBe(403);
  });
});
