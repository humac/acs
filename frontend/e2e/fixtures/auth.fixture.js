/**
 * Custom Playwright fixture that provides pre-authenticated pages for each role.
 *
 * Usage in spec files:
 *   import { test, expect } from '../fixtures/auth.fixture.js';
 *   test('admin can see all assets', async ({ adminPage, adminApi }) => { ... });
 */
import { test as base } from '@playwright/test';
import { ApiClient } from '../support/api-client.js';
import { USERS } from '../support/constants.js';

/**
 * Login via the API, then inject the JWT token into localStorage
 * so the SPA picks it up without needing to go through the login UI.
 */
async function authenticatedPage(page, userKey) {
  const user = USERS[userKey];
  const client = new ApiClient();
  const { token } = await client.login(user.email, user.password);

  // Navigate to the app first so we can set localStorage on the correct origin
  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('token', t), token);
  // Reload so AuthContext picks up the token
  await page.reload();
  await page.waitForLoadState('networkidle');

  return { page, token };
}

export const test = base.extend({
  /** Pre-authenticated admin browser page */
  adminPage: async ({ page }, use) => {
    const { page: p } = await authenticatedPage(page, 'admin');
    await use(p);
  },

  /** Pre-authenticated manager browser page */
  managerPage: async ({ page }, use) => {
    const { page: p } = await authenticatedPage(page, 'managerA');
    await use(p);
  },

  /** Pre-authenticated coordinator browser page */
  coordinatorPage: async ({ page }, use) => {
    const { page: p } = await authenticatedPage(page, 'coordinatorA');
    await use(p);
  },

  /** Pre-authenticated employeeA browser page */
  employeeAPage: async ({ page }, use) => {
    const { page: p } = await authenticatedPage(page, 'employeeA');
    await use(p);
  },

  /** Pre-authenticated employeeB browser page */
  employeeBPage: async ({ page }, use) => {
    const { page: p } = await authenticatedPage(page, 'employeeB');
    await use(p);
  },

  /** Pre-authenticated orphan employee browser page */
  employeeOrphanPage: async ({ page }, use) => {
    const { page: p } = await authenticatedPage(page, 'employeeOrphan');
    await use(p);
  },

  /** API client authenticated as admin */
  adminApi: async ({}, use) => {
    const client = new ApiClient();
    const { token } = await client.login(USERS.admin.email, USERS.admin.password);
    await use(new ApiClient(token));
  },

  /** API client authenticated as managerA */
  managerApi: async ({}, use) => {
    const client = new ApiClient();
    const { token } = await client.login(USERS.managerA.email, USERS.managerA.password);
    await use(new ApiClient(token));
  },

  /** API client authenticated as coordinatorA */
  coordinatorApi: async ({}, use) => {
    const client = new ApiClient();
    const { token } = await client.login(USERS.coordinatorA.email, USERS.coordinatorA.password);
    await use(new ApiClient(token));
  },

  /** API client authenticated as employeeA */
  employeeAApi: async ({}, use) => {
    const client = new ApiClient();
    const { token } = await client.login(USERS.employeeA.email, USERS.employeeA.password);
    await use(new ApiClient(token));
  },

  /** API client authenticated as employeeB */
  employeeBApi: async ({}, use) => {
    const client = new ApiClient();
    const { token } = await client.login(USERS.employeeB.email, USERS.employeeB.password);
    await use(new ApiClient(token));
  },

  /** Unauthenticated API client */
  anonApi: async ({}, use) => {
    await use(new ApiClient());
  },
});

export { expect } from '@playwright/test';
