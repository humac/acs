/**
 * Category F: Known Security Gaps — Regression Tests
 *
 * These tests document authorization gaps found during codebase exploration.
 * They assert the CURRENT (broken) behavior so CI stays green.
 * Once a gap is fixed, flip the assertion to the correct expected status.
 *
 * F-1: GET /api/assets/:id has no ownership check for employees
 * F-2: PATCH /api/assets/:id/status — FIXED (requireEditPermission enforces ownership)
 * F-3: GET /api/companies/:id has no authentication middleware
 * F-4: GET /api/stats leaks global counts to all roles
 */
import { test, expect } from '../fixtures/auth.fixture.js';
import { ApiClient } from '../support/api-client.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadState() {
  return JSON.parse(readFileSync(resolve(__dirname, '..', '.e2e-state.json'), 'utf-8'));
}

test.describe('Known Security Gaps (Regression)', () => {
  test('F-1: employee can fetch any asset by ID (no ownership check)', async ({ employeeAApi }) => {
    const state = loadState();
    const empBAsset = state.assets.find(a => a.serial_number === 'E2E-SN-B001');

    const res = await employeeAApi.get(`/api/assets/${empBAsset.id}`);

    // CURRENT BEHAVIOR: returns 200 (gap — should be 403 after fix)
    // TODO: Change to expect(res.status).toBe(403) once ownership check is added
    expect(res.status).toBe(200);
  });

  test('F-2: employee cannot change status of another employee\'s asset (FIXED)', async ({ employeeAApi }) => {
    const state = loadState();
    const empBAsset = state.assets.find(a => a.serial_number === 'E2E-SN-B001');

    const res = await employeeAApi.patch(`/api/assets/${empBAsset.id}/status`, {
      status: 'damaged',
    });

    // FIXED: requireEditPermission middleware enforces ownership check
    expect(res.status).toBe(403);
  });

  test('F-3: unauthenticated user can access company by ID (missing auth middleware)', async ({ anonApi }) => {
    const state = loadState();
    const acme = state.companies.acme;

    const res = await anonApi.get(`/api/companies/${acme.id}`);

    // CURRENT BEHAVIOR: returns 200 (gap — should be 401 after fix)
    // TODO: Change to expect(res.status).toBe(401) once authenticate middleware is added
    expect(res.status).toBe(200);
  });

  test('F-4: employee can see global stats counts', async ({ employeeAApi }) => {
    const res = await employeeAApi.get('/api/stats');

    // CURRENT BEHAVIOR: returns 200 with global counts (potential info leak)
    // TODO: Either scope counts by role or accept this as intentional
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('assetsCount');
    expect(res.body).toHaveProperty('employeesCount');
    expect(res.body).toHaveProperty('companiesCount');

    // The employee can see totals for ALL assets/users/companies, not just their own
    // This is documented as a design decision to review
  });
});
