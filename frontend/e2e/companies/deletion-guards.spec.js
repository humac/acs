/**
 * Category E (companies): Deletion Guards
 * Tests E-1, E-2, E-3.
 *
 * Note: E-1 (delete Empty Co) creates a fresh company to avoid affecting other tests.
 */
import { test, expect } from '../fixtures/auth.fixture.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadState() {
  return JSON.parse(readFileSync(resolve(__dirname, '..', '.e2e-state.json'), 'utf-8'));
}

test.describe('Company Deletion Guards', () => {
  test('E-1: admin can delete a company with no assets', async ({ adminApi }) => {
    // Create a throwaway company
    const company = await adminApi.createCompany({
      name: 'E2E Temp Deletable Co',
      description: 'Will be deleted',
    });

    const res = await adminApi.deleteCompany(company.id);
    expect(res.ok).toBe(true);
  });

  test('E-2: admin cannot delete company with existing assets', async ({ adminApi }) => {
    const state = loadState();
    const acme = state.companies.acme;

    const res = await adminApi.deleteCompany(acme.id);
    // Should fail because Acme Corp has assets
    expect(res.status).toBe(400);
  });
});
