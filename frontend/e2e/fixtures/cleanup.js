/**
 * Playwright globalTeardown — removes all seed data created by seed.js.
 *
 * Order: ephemeral assets → seed assets → companies → users (reverse of creation).
 *
 * Handles edge cases:
 *   - Tests that create ephemeral assets may leave orphans — sweep all E2E-prefixed assets first.
 *   - Companies with remaining assets cannot be deleted — retry after asset sweep.
 *   - Admin cannot self-delete — left in place (CI uses an ephemeral DB anyway).
 */
import { readFileSync, unlinkSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ApiClient } from '../support/api-client.js';
import { USERS, API_BASE } from '../support/constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = resolve(__dirname, '..', '.e2e-state.json');

export default async function globalTeardown() {
  // Safety guardrail: never run against production
  if (process.env.NODE_ENV === 'production') {
    console.error('[E2E Cleanup] ABORT: NODE_ENV is "production". Cleanup must never run against a production database.');
    return;
  }

  console.log('\n[E2E Cleanup] Starting cleanup...');

  if (!existsSync(STATE_FILE)) {
    console.log('[E2E Cleanup] No state file found — nothing to clean up.');
    return;
  }

  let state;
  try {
    state = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    console.warn('[E2E Cleanup] Could not parse state file.');
    return;
  }

  // Login as admin to get a fresh token
  let adminClient;
  try {
    const anonClient = new ApiClient();
    const login = await anonClient.login(USERS.admin.email, USERS.admin.password);
    adminClient = new ApiClient(login.token);
  } catch (err) {
    console.warn('[E2E Cleanup] Could not login as admin:', err.message);
    tryDeleteStateFile();
    return;
  }

  // Phase 1: Sweep ALL E2E-prefixed assets (catches ephemeral test data)
  try {
    const allAssets = await adminClient.getAssets();
    const e2eAssets = allAssets.filter(a => a.serial_number?.startsWith('E2E-'));
    for (const asset of e2eAssets) {
      try {
        await adminClient.deleteAsset(asset.id);
        console.log(`[E2E Cleanup] Swept asset: ${asset.serial_number}`);
      } catch (err) {
        console.warn(`[E2E Cleanup] Failed to sweep asset ${asset.serial_number}:`, err.message);
      }
    }
  } catch (err) {
    console.warn('[E2E Cleanup] Asset sweep failed, falling back to state-based cleanup:', err.message);
    // Fallback: delete only the assets we know about from the state file
    for (const asset of (state.assets || []).reverse()) {
      try {
        await adminClient.deleteAsset(asset.id);
        console.log(`[E2E Cleanup] Deleted asset: ${asset.serial_number}`);
      } catch (err2) {
        console.warn(`[E2E Cleanup] Failed to delete asset ${asset.serial_number}:`, err2.message);
      }
    }
  }

  // Phase 2: Delete companies (reverse order, retry-safe after asset sweep)
  for (const [key, company] of Object.entries(state.companies || {}).reverse()) {
    try {
      await adminClient.deleteCompany(company.id);
      console.log(`[E2E Cleanup] Deleted company: ${company.name}`);
    } catch (err) {
      console.warn(`[E2E Cleanup] Failed to delete company ${company.name}:`, err.message);
    }
  }

  // Phase 3: Delete users (non-admin first, admin last)
  const userKeys = Object.keys(state.users || {}).filter(k => k !== 'admin');
  for (const key of userKeys) {
    const user = state.users[key];
    try {
      await adminClient.deleteUser(user.id);
      console.log(`[E2E Cleanup] Deleted user: ${user.email}`);
    } catch (err) {
      console.warn(`[E2E Cleanup] Failed to delete user ${user.email}:`, err.message);
    }
  }

  // Admin cannot self-delete — in CI the ephemeral DB is destroyed anyway
  if (state.users?.admin) {
    console.log('[E2E Cleanup] Note: Admin user left in place (self-deletion not allowed).');
  }

  tryDeleteStateFile();
  console.log('[E2E Cleanup] Cleanup complete.\n');
}

function tryDeleteStateFile() {
  try {
    unlinkSync(STATE_FILE);
  } catch { /* ignore */ }
}
