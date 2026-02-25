/**
 * Category B: Employee Isolation (Conflict Testing)
 * Tests B-1 through B-8.
 */
import { test, expect } from '../fixtures/auth.fixture.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadState() {
  return JSON.parse(readFileSync(resolve(__dirname, '..', '.e2e-state.json'), 'utf-8'));
}

test.describe('Employee Isolation', () => {
  test('B-1: employeeA list only returns own assets', async ({ employeeAApi }) => {
    const assets = await employeeAApi.getAssets();
    const serials = assets.map(a => a.serial_number);

    expect(serials).toContain('E2E-SN-A001');
    expect(serials).toContain('E2E-SN-A002');
    expect(serials).not.toContain('E2E-SN-B001');
    expect(serials).not.toContain('E2E-SN-B002');
    expect(serials).not.toContain('E2E-SN-MGR01');
    expect(serials).not.toContain('E2E-SN-ADM01');
  });

  test('B-2: employeeA search is filtered to own assets', async ({ employeeAApi }) => {
    const res = await employeeAApi.get('/api/assets/search?q=E2E');
    expect(res.ok).toBe(true);
    const assets = res.body.assets || res.body;
    const serials = (Array.isArray(assets) ? assets : []).map(a => a.serial_number);

    // Should only contain empA assets
    for (const sn of serials) {
      expect(sn).toMatch(/E2E-SN-A00/);
    }
  });

  test('B-3: employeeA can fetch empB asset by ID (known gap)', async ({ employeeAApi }) => {
    const state = loadState();
    const empBAsset = state.assets.find(a => a.serial_number === 'E2E-SN-B001');

    // This is a KNOWN GAP — currently returns 200, should return 403 after fix
    const res = await employeeAApi.get(`/api/assets/${empBAsset.id}`);
    // Document current behavior: succeeds when it shouldn't
    expect(res.status).toBe(200);
  });

  test('B-4: employeeA cannot edit empB asset', async ({ employeeAApi }) => {
    const state = loadState();
    const empBAsset = state.assets.find(a => a.serial_number === 'E2E-SN-B001');

    const res = await employeeAApi.put(`/api/assets/${empBAsset.id}`, {
      notes: 'Hacked by empA',
    });
    expect(res.status).toBe(403);
  });

  test('B-5: employeeA cannot delete empB asset', async ({ employeeAApi }) => {
    const state = loadState();
    const empBAsset = state.assets.find(a => a.serial_number === 'E2E-SN-B001');

    const res = await employeeAApi.delete(`/api/assets/${empBAsset.id}`);
    expect(res.status).toBe(403);
  });

  test('B-6: employeeA can change status of empB asset (known gap)', async ({ employeeAApi }) => {
    const state = loadState();
    const empBAsset = state.assets.find(a => a.serial_number === 'E2E-SN-B001');

    // KNOWN GAP — should return 403 but currently succeeds
    const res = await employeeAApi.patch(`/api/assets/${empBAsset.id}/status`, {
      status: 'lost',
    });
    // Document current behavior
    expect(res.status).toBe(200);

    // Restore the original status so other tests aren't affected
    const adminClient = (await import('../support/api-client.js')).ApiClient;
    const admin = new adminClient();
    const login = await admin.login('e2e-admin@test.com', 'Admin123!');
    const authed = new adminClient(login.token);
    await authed.patch(`/api/assets/${empBAsset.id}/status`, { status: 'active' });
  });

  test('B-7: employeeA audit logs show only own actions', async ({ employeeAApi }) => {
    const res = await employeeAApi.get('/api/audit/logs');
    expect(res.ok).toBe(true);
    const logs = res.body.logs || res.body;
    if (Array.isArray(logs) && logs.length > 0) {
      for (const log of logs) {
        expect(log.user_email).toBe('e2e-emp-a@test.com');
      }
    }
  });

  test('B-8: orphan employee sees empty asset list', async ({ employeeOrphanPage }) => {
    await employeeOrphanPage.goto('/assets');
    await employeeOrphanPage.waitForLoadState('networkidle');

    // Should show empty state or no asset rows
    const rows = employeeOrphanPage.locator('table tbody tr');
    await expect(rows).toHaveCount(0);
  });
});
