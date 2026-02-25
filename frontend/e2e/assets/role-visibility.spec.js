/**
 * Category D (assets): Role-Scoped Asset Visibility
 * Tests D-1, D-3.
 */
import { test, expect } from '../fixtures/auth.fixture.js';

test.describe('Role-Based Asset Visibility', () => {
  test('D-1: manager sees all 6 seed assets', async ({ managerApi }) => {
    const assets = await managerApi.getAssets();
    const serials = assets.map(a => a.serial_number);

    const expected = ['E2E-SN-A001', 'E2E-SN-A002', 'E2E-SN-B001', 'E2E-SN-B002', 'E2E-SN-MGR01', 'E2E-SN-ADM01'];
    for (const sn of expected) {
      expect(serials).toContain(sn);
    }
  });

  test('D-3: coordinator sees all assets (read-only)', async ({ coordinatorApi }) => {
    const assets = await coordinatorApi.getAssets();
    const serials = assets.map(a => a.serial_number);

    const expected = ['E2E-SN-A001', 'E2E-SN-A002', 'E2E-SN-B001', 'E2E-SN-B002', 'E2E-SN-MGR01', 'E2E-SN-ADM01'];
    for (const sn of expected) {
      expect(serials).toContain(sn);
    }
  });

  test('D-3b: coordinator cannot edit assets via UI', async ({ coordinatorPage }) => {
    await coordinatorPage.goto('/assets');
    await coordinatorPage.waitForLoadState('networkidle');

    // Coordinator should not see edit buttons on assets
    const editButtons = coordinatorPage.getByRole('button', { name: /edit/i });
    await expect(editButtons).toHaveCount(0);
  });
});
