/**
 * Playwright globalSetup — creates all seed data via API calls.
 *
 * Order:
 *   1. Register admin (first user → auto-admin)
 *   2. Register remaining users (all start as employees)
 *   3. Login as admin → promote users to correct roles
 *   4. Create companies
 *   5. Create assets
 *
 * Stores created IDs in a JSON file so globalTeardown can clean up.
 */
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ApiClient } from '../support/api-client.js';
import { USERS, COMPANIES, ASSETS, API_BASE } from '../support/constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = resolve(__dirname, '..', '.e2e-state.json');

export default async function globalSetup() {
  // Safety guardrail: never run against production
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[E2E Seed] ABORT: NODE_ENV is "production". E2E seed must never run against a production database.');
  }

  console.log('\n[E2E Seed] Starting seed data setup...');

  // Wait for backend to be ready
  let retries = 30;
  while (retries > 0) {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (res.ok) break;
    } catch { /* retry */ }
    retries--;
    await new Promise(r => setTimeout(r, 1000));
  }
  if (retries === 0) throw new Error('Backend not reachable at ' + API_BASE);

  const anonClient = new ApiClient();
  const state = { users: {}, companies: {}, assets: [] };

  // 1. Register admin (first user gets admin role automatically)
  const adminData = USERS.admin;
  const adminReg = await anonClient.register({
    email: adminData.email,
    password: adminData.password,
    first_name: adminData.firstName,
    last_name: adminData.lastName,
    manager_first_name: 'Self',
    manager_last_name: 'Managed',
    manager_email: adminData.email,
  });
  state.users.admin = { id: adminReg.user?.id, email: adminData.email };
  console.log(`[E2E Seed] Registered admin: ${adminData.email}`);

  // 2. Login as admin
  const adminLogin = await anonClient.login(adminData.email, adminData.password);
  const adminClient = new ApiClient(adminLogin.token);

  // 3. Register remaining users
  const userOrder = ['managerA', 'coordinatorA', 'employeeA', 'employeeB', 'employeeOrphan'];
  for (const key of userOrder) {
    const u = USERS[key];
    const reg = await anonClient.register({
      email: u.email,
      password: u.password,
      first_name: u.firstName,
      last_name: u.lastName,
      manager_first_name: u.managerEmail ? 'Manager' : 'Self',
      manager_last_name: u.managerEmail ? 'Alpha' : 'Managed',
      manager_email: u.managerEmail || u.email,
    });
    state.users[key] = { id: reg.user?.id, email: u.email };
    console.log(`[E2E Seed] Registered ${key}: ${u.email}`);
  }

  // 4. Promote users to correct roles
  // We need to look up user IDs if they weren't returned by registration
  const allUsers = await adminClient.getUsers();
  for (const key of userOrder) {
    const u = USERS[key];
    if (u.role !== 'employee') {
      const dbUser = allUsers.find(usr => usr.email === u.email);
      if (!dbUser) throw new Error(`User ${u.email} not found in database`);
      state.users[key].id = dbUser.id;
      await adminClient.setUserRole(dbUser.id, u.role);
      console.log(`[E2E Seed] Set ${key} role to ${u.role}`);
    } else {
      const dbUser = allUsers.find(usr => usr.email === u.email);
      if (dbUser) state.users[key].id = dbUser.id;
    }
  }

  // Also capture admin ID from the users list
  const adminDbUser = allUsers.find(usr => usr.email === adminData.email);
  if (adminDbUser) state.users.admin.id = adminDbUser.id;

  // 5. Create companies
  for (const [key, company] of Object.entries(COMPANIES)) {
    const created = await adminClient.createCompany(company);
    state.companies[key] = { id: created.id, name: company.name };
    console.log(`[E2E Seed] Created company: ${company.name}`);
  }

  // 6. Create assets
  for (const asset of ASSETS) {
    const employee = USERS[asset.userKey];
    const manager = asset.managerKey ? USERS[asset.managerKey] : null;
    const company = COMPANIES[asset.companyKey];

    const created = await adminClient.createAsset({
      employee_first_name: employee.firstName,
      employee_last_name: employee.lastName,
      employee_email: employee.email,
      manager_first_name: manager?.firstName || '',
      manager_last_name: manager?.lastName || '',
      manager_email: manager?.email || '',
      company_name: company.name,
      asset_type: asset.asset_type,
      make: asset.make,
      model: asset.model,
      serial_number: asset.serial_number,
      asset_tag: asset.asset_tag,
      status: asset.status,
    });
    state.assets.push({ id: created.id, serial_number: asset.serial_number });
    console.log(`[E2E Seed] Created asset: ${asset.serial_number}`);
  }

  // Save state for cleanup
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log(`[E2E Seed] Seed complete. State saved to ${STATE_FILE}\n`);
}
