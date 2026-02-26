/**
 * Category A: Authentication Boundaries
 * Tests A-1, A-5, A-6 — login flows, redirects, role-scoped visibility after login.
 */
import { test, expect } from '../fixtures/auth.fixture.js';
import { USERS } from '../support/constants.js';

test.describe('Login & Redirects', () => {
  test('A-1: unauthenticated user sees login form when visiting /assets', async ({ page }) => {
    await page.goto('/assets');
    // App renders the login form for unauthenticated users (URL stays the same)
    await expect(page.getByRole('button', { name: /sign in|log in|login/i })).toBeVisible({ timeout: 10000 });
  });

  test('A-5: employee sees only own assets after login', async ({ employeeAPage }) => {
    await employeeAPage.goto('/assets');

    // Wait for the assets table to load — use role locator to avoid strict mode violation
    // (asset tags appear in both mobile <p> and desktop <code> elements)
    await expect(employeeAPage.getByRole('cell', { name: 'E2E-TAG-A001' })).toBeVisible({ timeout: 15000 });

    // Should also see second own asset
    await expect(employeeAPage.getByRole('cell', { name: 'E2E-TAG-A002' })).toBeVisible();

    // Should NOT see employeeB's assets
    await expect(employeeAPage.getByRole('cell', { name: 'E2E-TAG-B001' })).not.toBeVisible();
    await expect(employeeAPage.getByRole('cell', { name: 'E2E-TAG-B002' })).not.toBeVisible();
  });

  test('A-6: admin sees all assets after login', async ({ adminPage }) => {
    await adminPage.goto('/assets');

    // Wait for the assets table to load — use role locator to avoid strict mode violation
    await expect(adminPage.getByRole('cell', { name: 'E2E-TAG-A001' })).toBeVisible({ timeout: 15000 });

    // Should see all seed assets
    const tags = ['E2E-TAG-A002', 'E2E-TAG-B001', 'E2E-TAG-B002', 'E2E-TAG-MGR01', 'E2E-TAG-ADM01'];
    for (const tag of tags) {
      await expect(adminPage.getByRole('cell', { name: tag })).toBeVisible();
    }
  });
});
