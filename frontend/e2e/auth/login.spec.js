/**
 * Category A: Authentication Boundaries
 * Tests A-1, A-5, A-6 — login flows, redirects, role-scoped visibility after login.
 */
import { test, expect } from '../fixtures/auth.fixture.js';
import { USERS } from '../support/constants.js';

test.describe('Login & Redirects', () => {
  test('A-1: unauthenticated user visiting /assets is redirected to login', async ({ page }) => {
    await page.goto('/assets');
    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
  });

  test('A-5: employee sees only own assets after login', async ({ employeeAPage }) => {
    await employeeAPage.goto('/assets');

    // Wait for the assets table to load by checking for the first expected asset
    await expect(employeeAPage.getByText('E2E-SN-A001')).toBeVisible({ timeout: 15000 });

    // Should also see second own asset
    await expect(employeeAPage.getByText('E2E-SN-A002')).toBeVisible();

    // Should NOT see employeeB's assets
    await expect(employeeAPage.getByText('E2E-SN-B001')).not.toBeVisible();
    await expect(employeeAPage.getByText('E2E-SN-B002')).not.toBeVisible();
  });

  test('A-6: admin sees all assets after login', async ({ adminPage }) => {
    await adminPage.goto('/assets');

    // Wait for the assets table to load by checking for the first expected asset
    await expect(adminPage.getByText('E2E-SN-A001')).toBeVisible({ timeout: 15000 });

    // Should see all seed assets
    const serials = ['E2E-SN-A002', 'E2E-SN-B001', 'E2E-SN-B002', 'E2E-SN-MGR01', 'E2E-SN-ADM01'];
    for (const sn of serials) {
      await expect(adminPage.getByText(sn)).toBeVisible();
    }
  });
});
