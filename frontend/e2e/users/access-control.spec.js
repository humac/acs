/**
 * Category C & D (users): User Management Access Control
 * Tests C-2, C-4, C-6, D-2.
 */
import { test, expect } from '../fixtures/auth.fixture.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadState() {
  return JSON.parse(readFileSync(resolve(__dirname, '..', '.e2e-state.json'), 'utf-8'));
}

test.describe('User Management Access Control', () => {
  test('C-4: employee cannot list users', async ({ employeeAApi }) => {
    const res = await employeeAApi.get('/api/auth/users');
    expect(res.status).toBe(403);
  });

  test('C-2: employee cannot change own role to admin', async ({ employeeAApi }) => {
    const state = loadState();
    const empA = state.users.employeeA;

    const res = await employeeAApi.put(`/api/auth/users/${empA.id}/role`, { role: 'admin' });
    expect(res.status).toBe(403);
  });

  test('C-6: manager cannot change user roles', async ({ managerApi }) => {
    const state = loadState();
    const empA = state.users.employeeA;

    const res = await managerApi.put(`/api/auth/users/${empA.id}/role`, { role: 'admin' });
    expect(res.status).toBe(403);
  });

  test('D-2: manager can list all users (read-only)', async ({ managerApi }) => {
    const users = await managerApi.getUsers();
    expect(Array.isArray(users)).toBe(true);
    // Should include at least the seed users
    const emails = users.map(u => u.email);
    expect(emails).toContain('e2e-admin@test.com');
    expect(emails).toContain('e2e-emp-a@test.com');
  });

  test('D-7: employee cannot see /users navigation and API returns 403', async ({ employeeAPage, employeeAApi }) => {
    await employeeAPage.goto('/');
    await employeeAPage.waitForLoadState('networkidle');

    // The "Users" nav item should not be visible for employees
    const usersNavLink = employeeAPage.getByRole('link', { name: /users/i });
    await expect(usersNavLink).toHaveCount(0);

    // Direct API access should also fail
    const res = await employeeAApi.get('/api/auth/users');
    expect(res.status).toBe(403);
  });
});
