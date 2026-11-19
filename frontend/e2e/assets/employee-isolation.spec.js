/**
 * Category B: Employee Isolation (Conflict Testing)
 * Tests B-1 through B-9.
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

  test('B-3: employeeA cannot fetch empB asset by ID (FIXED)', async ({ employeeAApi }) => {
    const state = loadState();
    const empBAsset = state.assets.find(a => a.serial_number === 'E2E-SN-B001');

    // FIXED: ownership check now returns 403 for non-owner employees
    const res = await employeeAApi.get(`/api/assets/${empBAsset.id}`);
    expect(res.status).toBe(403);
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

  test('B-6: employeeA cannot change status of empB asset (FIXED)', async ({ employeeAApi }) => {
    const state = loadState();
    const empBAsset = state.assets.find(a => a.serial_number === 'E2E-SN-B001');

    // FIXED: requireEditPermission middleware now enforces ownership check
    const res = await employeeAApi.patch(`/api/assets/${empBAsset.id}/status`, {
      status: 'lost',
    });
    expect(res.status).toBe(403);
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

  test('B-9: employeeA cannot attest (change status of) empB asset via own attestation record', async ({ adminApi, employeeAApi }) => {
    const state = loadState();
    const empAAsset = state.assets.find(a => a.serial_number === 'E2E-SN-A001');
    const empBAsset = state.assets.find(a => a.serial_number === 'E2E-SN-B001');

    const created = await adminApi.post('/api/attestation/campaigns', {
      name: `E2E B-9 isolation ${Date.now()}`,
      start_date: new Date().toISOString(),
      target_type: 'selected',
      target_user_ids: [state.users.employeeA.id],
    });
    expect(created.ok).toBe(true);
    const campaignId = created.body.campaignId;

    try {
      const started = await adminApi.post(`/api/attestation/campaigns/${campaignId}/start`);
      expect(started.ok).toBe(true);

      const mine = await employeeAApi.get('/api/attestation/my-attestations');
      expect(mine.ok).toBe(true);
      const record = mine.body.attestations.find(r => r.campaign_id === campaignId);
      expect(record).toBeDefined();

      const before = await adminApi.get(`/api/assets/${empBAsset.id}`);

      // empA tries to mark empB's asset as lost through empA's own record
      const attack = await employeeAApi.put(
        `/api/attestation/records/${record.id}/assets/${empBAsset.id}`,
        { attested_status: 'lost', notes: 'tampered by empA' }
      );
      expect(attack.status).toBe(403);

      const after = await adminApi.get(`/api/assets/${empBAsset.id}`);
      expect(after.body.status).toBe(before.body.status);
      expect(after.body.notes || '').not.toContain('tampered by empA');

      // Positive control: empA can still certify their own asset unchanged
      const own = await employeeAApi.put(
        `/api/attestation/records/${record.id}/assets/${empAAsset.id}`,
        {}
      );
      expect(own.status).toBe(200);
    } finally {
      await adminApi.delete(`/api/attestation/campaigns/${campaignId}`);
    }
  });
});
