// Test for summary report endpoint - regression test for issue where summary showed zeros
import { describe, it, expect, beforeAll } from '@jest/globals';
import { assetDb, userDb, companyDb } from '../database.js';
import { hashPassword } from '../auth.js';

describe('Summary Report Tests', () => {
  beforeAll(async () => {
    await assetDb.init();
  });

  it('should correctly count assets using registration_date field', async () => {
    // Create a test user
    const hashedPassword = await hashPassword('test123');
    const userResult = await userDb.create({
      email: `test-${Date.now()}@example.com`,
      password_hash: hashedPassword,
      name: 'Test User',
      first_name: 'Test',
      last_name: 'User',
      role: 'admin',
      manager_first_name: 'Manager',
      manager_last_name: 'Test',
      manager_email: 'manager@test.com'
    });

    const userId = userResult.id;
    const user = await userDb.getById(userId);

    // Create a test company
    const companyResult = await companyDb.create({
      name: `Test Company ${Date.now()}`,
      description: 'Test company for summary report'
    });

    const companyId = companyResult.id;
    const company = await companyDb.getById(companyId);

    // Create test assets with registration_date (not created_date)
    const testAssets = [];
    for (let i = 0; i < 5; i++) {
      const assetId = await assetDb.create({
        employee_first_name: 'Test',
        employee_last_name: 'Employee',
        employee_email: user.email,
        owner_id: userId,
        manager_first_name: 'Test',
        manager_last_name: 'Manager',
        manager_email: user.email,
        manager_id: userId,
        company_id: companyId,
        asset_type: 'laptop',
        make: 'Dell',
        model: 'XPS',
        serial_number: `SN-TEST-${Date.now()}-${i}`,
        asset_tag: `AT-TEST-${Date.now()}-${i}`,
        status: 'active',
        notes: ''
      });
      testAssets.push(assetId);
    }

    // Fetch all assets
    const allAssets = await assetDb.getAll();
    const userAssets = allAssets.filter(a => a.owner_id === userId);

    // Verify assets have registration_date, not created_date
    expect(userAssets.length).toBeGreaterThanOrEqual(5);
    userAssets.forEach(asset => {
      expect(asset.registration_date).toBeDefined();
      expect(asset.registration_date).not.toBeNull();
      // created_date should not exist on assets
      expect(asset.created_date).toBeUndefined();
    });

    // Test the filtering logic used in summary-enhanced endpoint
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // This is the fixed logic - should work with registration_date
    const currentAssets = userAssets.filter(a => a.registration_date && new Date(a.registration_date) <= now);
    const previousAssets = userAssets.filter(a => a.registration_date && new Date(a.registration_date) <= thirtyDaysAgo);

    // All test assets should be in currentAssets
    expect(currentAssets.length).toBeGreaterThanOrEqual(5);
    
    // Test assets created just now should NOT be in previousAssets (created within last 30 days)
    // previousAssets filters for assets with registration_date <= thirtyDaysAgo
    // Since our test assets were just created, they should have recent timestamps
    const recentTestAssets = previousAssets.filter(a => a.owner_id === userId);
    // Our newly created assets should not appear in the previousAssets list
    expect(recentTestAssets.length).toBe(0);

    // Test status breakdown
    const byStatus = { active: 0, returned: 0, lost: 0, damaged: 0, retired: 0 };
    currentAssets.forEach(asset => {
      if (byStatus.hasOwnProperty(asset.status)) {
        byStatus[asset.status]++;
      }
    });

    expect(byStatus.active).toBeGreaterThanOrEqual(5);

    // Test company breakdown
    const companyMap = {};
    currentAssets.forEach(asset => {
      const companyName = asset.company_name || 'Unknown';
      companyMap[companyName] = (companyMap[companyName] || 0) + 1;
    });

    expect(companyMap[company.name]).toBeGreaterThanOrEqual(5);

    // Test manager breakdown
    const managerMap = {};
    currentAssets.forEach(asset => {
      const name = asset.manager_first_name && asset.manager_last_name 
        ? `${asset.manager_first_name} ${asset.manager_last_name}` 
        : 'No Manager';
      const email = asset.manager_email || 'N/A';
      const key = `${name}|${email}`;
      managerMap[key] = (managerMap[key] || 0) + 1;
    });

    expect(Object.keys(managerMap).length).toBeGreaterThan(0);
  });

  it('should handle assets with null registration_date gracefully', async () => {
    // This tests the defensive check in the filter
    const mockAssets = [
      { id: 1, registration_date: '2025-12-14T19:00:00.000Z', status: 'active' },
      { id: 2, registration_date: null, status: 'active' },
      { id: 3, registration_date: undefined, status: 'active' },
      { id: 4, registration_date: '2025-12-14T18:00:00.000Z', status: 'returned' }
    ];

    const now = new Date();
    const currentAssets = mockAssets.filter(a => a.registration_date && new Date(a.registration_date) <= now);

    // Only assets with valid registration_date should be included
    expect(currentAssets.length).toBe(2);
    expect(currentAssets.map(a => a.id)).toEqual([1, 4]);
  });

  it('should use registration_date not created_date for assets', async () => {
    // This is a documentation test to ensure developers understand the schema
    const allAssets = await assetDb.getAll();
    
    if (allAssets.length > 0) {
      const firstAsset = allAssets[0];
      
      // Assets should have registration_date
      expect(firstAsset).toHaveProperty('registration_date');
      
      // Assets should NOT have created_date (that's for companies)
      expect(firstAsset).not.toHaveProperty('created_date');
    }

    // Companies should have created_date
    const allCompanies = await companyDb.getAll();
    if (allCompanies.length > 0) {
      const firstCompany = allCompanies[0];
      expect(firstCompany).toHaveProperty('created_date');
    }
  });
});
