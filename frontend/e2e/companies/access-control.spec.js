/**
 * Category C & D (companies): Company Access Control
 * Tests C-3, C-7, D-4.
 */
import { test, expect } from '../fixtures/auth.fixture.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadState() {
  return JSON.parse(readFileSync(resolve(__dirname, '..', '.e2e-state.json'), 'utf-8'));
}

test.describe('Company Access Control', () => {
  test('C-3: employee cannot delete a company', async ({ employeeAApi }) => {
    const state = loadState();
    const emptyCo = state.companies.empty;

    const res = await employeeAApi.delete(`/api/companies/${emptyCo.id}`);
    expect(res.status).toBe(403);
  });

  test('C-5: employee cannot access admin settings', async ({ employeeAApi }) => {
    const res = await employeeAApi.put('/api/admin/oidc-settings', { enabled: true });
    expect(res.status).toBe(403);
  });

  test('C-7: manager cannot delete a company', async ({ managerApi }) => {
    const state = loadState();
    const emptyCo = state.companies.empty;

    const res = await managerApi.delete(`/api/companies/${emptyCo.id}`);
    expect(res.status).toBe(403);
  });

  test('D-4: coordinator can list all companies', async ({ coordinatorApi }) => {
    const companies = await coordinatorApi.getCompanies();
    const names = (Array.isArray(companies) ? companies : []).map(c => c.name);

    expect(names).toContain('E2E Acme Corp');
    expect(names).toContain('E2E Globex Inc');
    expect(names).toContain('E2E Empty Co');
  });

  test('D-8: employee cannot see /settings navigation', async ({ employeeAPage }) => {
    await employeeAPage.goto('/');
    await employeeAPage.waitForLoadState('networkidle');

    const settingsLink = employeeAPage.getByRole('link', { name: /settings/i });
    await expect(settingsLink).toHaveCount(0);
  });
});
