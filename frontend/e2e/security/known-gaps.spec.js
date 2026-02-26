/**
 * Category F: Known Security Gaps — Regression Tests
 *
 * These tests document authorization gaps found during codebase exploration.
 * They assert the CURRENT (broken) behavior so CI stays green.
 * Once a gap is fixed, flip the assertion to the correct expected status.
 *
 * F-1: GET /api/assets/:id — FIXED (employee ownership check added)
 * F-2: PATCH /api/assets/:id/status — FIXED (requireEditPermission enforces ownership)
 * F-3: GET /api/companies/:id — FIXED (authenticate middleware added)
 * F-4: GET /api/stats — FIXED (counts scoped by user role)
 */
import { test, expect } from '../fixtures/auth.fixture.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadState() {
  return JSON.parse(readFileSync(resolve(__dirname, '..', '.e2e-state.json'), 'utf-8'));
}

test.describe('Known Security Gaps (Regression)', () => {
  test('F-1: employee cannot fetch another employee\'s asset by ID (FIXED)', async ({ employeeAApi }) => {
    const state = loadState();
    const empBAsset = state.assets.find(a => a.serial_number === 'E2E-SN-B001');

    const res = await employeeAApi.get(`/api/assets/${empBAsset.id}`);

    // FIXED: ownership check now returns 403 for non-owner employees
    expect(res.status).toBe(403);
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

  test('F-3: unauthenticated user cannot access company by ID (FIXED)', async ({ anonApi }) => {
    const state = loadState();
    const acme = state.companies.acme;

    const res = await anonApi.get(`/api/companies/${acme.id}`);

    // FIXED: authenticate middleware now required
    expect(res.status).toBe(401);
  });

  test('F-4: employee sees only scoped stats, not global counts (FIXED)', async ({ employeeAApi }) => {
    const res = await employeeAApi.get('/api/stats');

    // FIXED: stats are now scoped by role — employee sees only their own counts
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('assetsCount');
    expect(res.body).toHaveProperty('employeesCount');
    expect(res.body).toHaveProperty('companiesCount');

    // Employee should see their own scoped counts (2 assets for employeeA)
    expect(res.body.assetsCount).toBe(2);
    expect(res.body.employeesCount).toBe(1);
  });
});
