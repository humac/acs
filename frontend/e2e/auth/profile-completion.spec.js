/**
 * Profile Completion E2E Tests
 *
 * Validates that OIDC users without manager data are forced to complete
 * their profile before accessing the application.
 *
 * Uses the E2E-only endpoint POST /api/auth/e2e/create-oidc-user to create
 * OIDC users with profile_complete=0 (no manager data).
 */
import { test as base, expect } from '@playwright/test';
import { ApiClient } from '../support/api-client.js';
import { USERS } from '../support/constants.js';

// Share a single admin API client (worker-scoped) to avoid rate limiting
const test = base.extend({
  adminApi: [async ({}, use) => {
    const client = new ApiClient();
    const { token } = await client.login(USERS.admin.email, USERS.admin.password);
    await use(new ApiClient(token));
  }, { scope: 'worker' }],
});

/**
 * Helper: create an OIDC user (no manager data, profile_complete=0)
 * and inject their JWT into a browser page.
 */
async function createOIDCUserAndInjectToken(page, adminApi, overrides = {}) {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const userData = {
    email: `e2e-oidc-${timestamp}-${rand}@test.com`,
    first_name: 'OIDC',
    last_name: 'TestUser',
    ...overrides,
  };

  const { token, user } = await adminApi.createOIDCUser(userData);

  // Inject token into browser localStorage
  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('token', t), token);
  await page.reload();
  await page.waitForLoadState('domcontentloaded');

  return { token, user, userData };
}

test.describe('Profile Completion — OIDC JIT users without manager data', () => {

  test('OIDC JIT user without manager claims sees CompleteProfile screen', async ({ page, adminApi }) => {
    await createOIDCUserAndInjectToken(page, adminApi);

    await expect(page.getByText('Complete Your Profile')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Manager First Name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Manager Last Name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Manager Email' })).toBeVisible();
  });

  test('CompleteProfile screen persists after page refresh', async ({ page, adminApi }) => {
    await createOIDCUserAndInjectToken(page, adminApi);

    await expect(page.getByText('Complete Your Profile')).toBeVisible();

    // Refresh — should still show CompleteProfile (not bypass via /api/auth/me)
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText('Complete Your Profile')).toBeVisible();
  });

  test('OIDC user cannot navigate away from CompleteProfile', async ({ page, adminApi }) => {
    await createOIDCUserAndInjectToken(page, adminApi);

    await expect(page.getByText('Complete Your Profile')).toBeVisible();

    // Try navigating to assets page
    await page.goto('/assets');
    await page.waitForLoadState('domcontentloaded');

    // Should still be on CompleteProfile, not assets
    await expect(page.getByText('Complete Your Profile')).toBeVisible();
  });

  test('OIDC user can complete profile and access the app', async ({ page, adminApi }) => {
    const { user } = await createOIDCUserAndInjectToken(page, adminApi);

    await expect(page.getByText('Complete Your Profile')).toBeVisible();

    // Fill in manager data
    await page.getByRole('textbox', { name: 'Manager First Name' }).fill('Test');
    await page.getByRole('textbox', { name: 'Manager Last Name' }).fill('Manager');
    await page.getByRole('textbox', { name: 'Manager Email' }).fill('test.manager@example.com');

    // Submit
    await page.getByRole('button', { name: 'Complete Profile' }).click();

    // Should no longer see CompleteProfile — app should load
    await expect(page.getByText('Complete Your Profile')).not.toBeVisible({ timeout: 10000 });

    // Verify via API that manager was saved
    const users = await adminApi.getUsers();
    const updatedUser = users.find(u => u.email === user.email);
    expect(updatedUser.manager_email).toBe('test.manager@example.com');
  });
});

test.describe('Profile Completion — Pre-existing user linked via OIDC', () => {

  test('pre-existing user without manager is forced to complete profile', async ({ page, adminApi }) => {
    await createOIDCUserAndInjectToken(page, adminApi, {
      email: `e2e-linked-${Date.now()}@test.com`,
      first_name: 'Linked',
      last_name: 'User',
    });

    // Should see CompleteProfile
    await expect(page.getByText('Complete Your Profile')).toBeVisible();

    // Fill and submit
    await page.getByRole('textbox', { name: 'Manager First Name' }).fill('Linked');
    await page.getByRole('textbox', { name: 'Manager Last Name' }).fill('Manager');
    await page.getByRole('textbox', { name: 'Manager Email' }).fill('linked.manager@example.com');
    await page.getByRole('button', { name: 'Complete Profile' }).click();

    // Should proceed past CompleteProfile
    await expect(page.getByText('Complete Your Profile')).not.toBeVisible({ timeout: 10000 });
  });
});
