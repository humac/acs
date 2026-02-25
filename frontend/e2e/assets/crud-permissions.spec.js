/**
 * Category C (assets): CRUD Permission Enforcement
 * Tests C-1, C-8, C-9.
 */
import { test, expect } from '../fixtures/auth.fixture.js';
import { USERS, COMPANIES } from '../support/constants.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadState() {
  return JSON.parse(readFileSync(resolve(__dirname, '..', '.e2e-state.json'), 'utf-8'));
}

test.describe('Asset CRUD Permissions', () => {
  test('C-1: employee cannot create asset for another employee', async ({ employeeAApi }) => {
    const res = await employeeAApi.post('/api/assets', {
      employee_first_name: USERS.employeeB.firstName,
      employee_last_name: USERS.employeeB.lastName,
      employee_email: USERS.employeeB.email,
      company_name: COMPANIES.acme.name,
      asset_type: 'laptop',
      make: 'Test',
      model: 'Test',
      serial_number: 'E2E-HACK-001',
    });
    expect(res.status).toBe(403);
  });

  test('C-8: coordinator cannot edit any asset', async ({ coordinatorApi }) => {
    const state = loadState();
    const asset = state.assets.find(a => a.serial_number === 'E2E-SN-A001');

    const res = await coordinatorApi.put(`/api/assets/${asset.id}`, {
      notes: 'Edited by coordinator',
    });
    expect(res.status).toBe(403);
  });

  test('C-9: coordinator cannot delete any asset', async ({ coordinatorApi }) => {
    const state = loadState();
    const asset = state.assets.find(a => a.serial_number === 'E2E-SN-A001');

    const res = await coordinatorApi.delete(`/api/assets/${asset.id}`);
    expect(res.status).toBe(403);
  });
});
