/**
 * Seed data constants for E2E tests.
 * All emails use a unique suffix to avoid collisions with real data.
 */

export const USERS = {
  admin: {
    email: 'e2e-admin@test.com',
    password: 'Admin123!',
    firstName: 'E2E',
    lastName: 'Admin',
    role: 'admin',
  },
  managerA: {
    email: 'e2e-manager-a@test.com',
    password: 'Manager123!',
    firstName: 'Manager',
    lastName: 'Alpha',
    role: 'manager',
  },
  coordinatorA: {
    email: 'e2e-coord-a@test.com',
    password: 'Coord123!',
    firstName: 'Coord',
    lastName: 'Alpha',
    role: 'coordinator',
  },
  employeeA: {
    email: 'e2e-emp-a@test.com',
    password: 'Employee123!',
    firstName: 'Employee',
    lastName: 'Alpha',
    role: 'employee',
    managerEmail: 'e2e-manager-a@test.com',
  },
  employeeB: {
    email: 'e2e-emp-b@test.com',
    password: 'Employee123!',
    firstName: 'Employee',
    lastName: 'Bravo',
    role: 'employee',
    managerEmail: 'e2e-manager-a@test.com',
  },
  employeeOrphan: {
    email: 'e2e-emp-orphan@test.com',
    password: 'Employee123!',
    firstName: 'Employee',
    lastName: 'Orphan',
    role: 'employee',
  },
};

export const COMPANIES = {
  acme: { name: 'E2E Acme Corp', description: 'Primary test company' },
  globex: { name: 'E2E Globex Inc', description: 'Secondary test company' },
  empty: { name: 'E2E Empty Co', description: 'No assets — deletion testing' },
};

export const ASSETS = [
  {
    serial_number: 'E2E-SN-A001',
    asset_tag: 'E2E-TAG-A001',
    userKey: 'employeeA',
    managerKey: 'managerA',
    companyKey: 'acme',
    asset_type: 'laptop',
    make: 'Apple',
    model: 'MacBook Pro',
    status: 'active',
  },
  {
    serial_number: 'E2E-SN-A002',
    asset_tag: 'E2E-TAG-A002',
    userKey: 'employeeA',
    managerKey: 'managerA',
    companyKey: 'acme',
    asset_type: 'laptop',
    make: 'Dell',
    model: 'XPS 15',
    status: 'returned',
  },
  {
    serial_number: 'E2E-SN-B001',
    asset_tag: 'E2E-TAG-B001',
    userKey: 'employeeB',
    managerKey: 'managerA',
    companyKey: 'acme',
    asset_type: 'laptop',
    make: 'Lenovo',
    model: 'ThinkPad X1',
    status: 'active',
  },
  {
    serial_number: 'E2E-SN-B002',
    asset_tag: 'E2E-TAG-B002',
    userKey: 'employeeB',
    managerKey: 'managerA',
    companyKey: 'globex',
    asset_type: 'laptop',
    make: 'HP',
    model: 'EliteBook',
    status: 'active',
  },
  {
    serial_number: 'E2E-SN-MGR01',
    asset_tag: 'E2E-TAG-MGR01',
    userKey: 'managerA',
    managerKey: null,
    companyKey: 'acme',
    asset_type: 'laptop',
    make: 'Apple',
    model: 'MacBook Air',
    status: 'active',
  },
  {
    serial_number: 'E2E-SN-ADM01',
    asset_tag: 'E2E-TAG-ADM01',
    userKey: 'admin',
    managerKey: null,
    companyKey: 'globex',
    asset_type: 'laptop',
    make: 'Microsoft',
    model: 'Surface Pro',
    status: 'active',
  },
];

export const API_BASE = 'http://localhost:3001';
