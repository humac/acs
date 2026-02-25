/**
 * Category E (assets): Bulk Operations & Data Integrity
 * Tests E-4, E-5 — bulk actions as admin.
 *
 * Note: These tests create ephemeral assets so as not to affect other tests.
 */
import { test, expect } from '../fixtures/auth.fixture.js';
import { USERS, COMPANIES } from '../support/constants.js';

test.describe('Bulk Asset Operations', () => {
  test('E-5: admin can bulk update status', async ({ adminApi }) => {
    // Create two temporary assets
    const asset1 = await adminApi.createAsset({
      employee_first_name: USERS.admin.firstName,
      employee_last_name: USERS.admin.lastName,
      employee_email: USERS.admin.email,
      company_name: COMPANIES.acme.name,
      asset_type: 'laptop',
      make: 'Bulk',
      model: 'Test1',
      serial_number: 'E2E-BULK-STATUS-1',
    });
    const asset2 = await adminApi.createAsset({
      employee_first_name: USERS.admin.firstName,
      employee_last_name: USERS.admin.lastName,
      employee_email: USERS.admin.email,
      company_name: COMPANIES.acme.name,
      asset_type: 'laptop',
      make: 'Bulk',
      model: 'Test2',
      serial_number: 'E2E-BULK-STATUS-2',
    });

    // Bulk status change
    const res = await adminApi.patch('/api/assets/bulk/status', {
      ids: [asset1.id, asset2.id],
      status: 'returned',
    });
    expect(res.ok).toBe(true);

    // Cleanup
    await adminApi.deleteAsset(asset1.id);
    await adminApi.deleteAsset(asset2.id);
  });

  test('E-4: admin can bulk delete assets', async ({ adminApi }) => {
    // Create two temporary assets
    const asset1 = await adminApi.createAsset({
      employee_first_name: USERS.admin.firstName,
      employee_last_name: USERS.admin.lastName,
      employee_email: USERS.admin.email,
      company_name: COMPANIES.acme.name,
      asset_type: 'laptop',
      make: 'Bulk',
      model: 'Del1',
      serial_number: 'E2E-BULK-DEL-1',
    });
    const asset2 = await adminApi.createAsset({
      employee_first_name: USERS.admin.firstName,
      employee_last_name: USERS.admin.lastName,
      employee_email: USERS.admin.email,
      company_name: COMPANIES.acme.name,
      asset_type: 'laptop',
      make: 'Bulk',
      model: 'Del2',
      serial_number: 'E2E-BULK-DEL-2',
    });

    // Bulk delete
    const res = await adminApi.delete('/api/assets/bulk/delete');
    // The bulk delete endpoint uses a different contract — test the API directly
    const deleteRes = await adminApi._request('DELETE', '/api/assets/bulk/delete', {
      ids: [asset1.id, asset2.id],
    });
    // Accept either 200 or 204
    expect([200, 204]).toContain(deleteRes.status);
  });
});
