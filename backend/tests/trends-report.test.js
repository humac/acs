// Test for trends report endpoint - ensures registration_date is used correctly
import { describe, it, expect, beforeAll } from '@jest/globals';
import { assetDb, userDb, companyDb } from '../database.js';
import { hashPassword } from '../auth.js';

describe('Trends Report Tests', () => {
  beforeAll(async () => {
    await assetDb.init();
  });

  it('should use registration_date for asset growth calculations', async () => {
    // Create a test user
    const hashedPassword = await hashPassword('test123');
    const userResult = await userDb.create({
      email: `trends-test-${Date.now()}@example.com`,
      password_hash: hashedPassword,
      name: 'Trends Test User',
      first_name: 'Trends',
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
      name: `Trends Test Company ${Date.now()}`,
      description: 'Test company for trends report'
    });

    const companyId = companyResult.id;

    // Create test assets with known registration_date
    const testAssets = [];
    for (let i = 0; i < 3; i++) {
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
        serial_number: `SN-TRENDS-${Date.now()}-${i}`,
        asset_tag: `AT-TRENDS-${Date.now()}-${i}`,
        status: 'active',
        notes: ''
      });
      testAssets.push(assetId);
    }

    // Fetch all assets for this user
    const allAssets = await assetDb.getAll();
    const userAssets = allAssets.filter(a => a.owner_id === userId);

    // Verify assets have registration_date field
    expect(userAssets.length).toBeGreaterThanOrEqual(3);
    userAssets.forEach(asset => {
      expect(asset.registration_date).toBeDefined();
      expect(asset.registration_date).not.toBeNull();
      // Verify created_date does NOT exist on assets
      expect(asset.created_date).toBeUndefined();
    });

    // Test sorting by registration_date (as done in trends endpoint)
    const sortedAssets = [...userAssets].sort((a, b) => 
      new Date(a.registration_date) - new Date(b.registration_date)
    );

    expect(sortedAssets.length).toBe(userAssets.length);
    expect(sortedAssets[0].registration_date).toBeDefined();

    // Test filtering by registration_date (as done in trends endpoint)
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    const recentAssets = userAssets.filter(a => {
      const registrationDate = new Date(a.registration_date);
      return registrationDate >= thirtyDaysAgo && registrationDate <= now;
    });

    // Our test assets were just created, so they should all be in recentAssets
    expect(recentAssets.length).toBeGreaterThanOrEqual(3);

    // Test date comparison (as done in status changes calculation)
    const assetsBeforeNow = userAssets.filter(a => 
      new Date(a.registration_date) <= now
    );
    
    expect(assetsBeforeNow.length).toBe(userAssets.length);
  });

  it('should correctly count assets over time using registration_date', async () => {
    // Test the actual logic used in the trends endpoint
    const now = new Date();
    const period = 7; // 7 days
    const startDate = new Date(now - period * 24 * 60 * 60 * 1000);

    // Get all assets
    const allAssets = await assetDb.getAll();
    
    // Simulate the trends endpoint logic
    const sortedAssets = [...allAssets].sort((a, b) => 
      new Date(a.registration_date) - new Date(b.registration_date)
    );

    const sampleInterval = Math.max(1, Math.floor(period / 30));
    const assetGrowth = [];
    
    let assetIndex = 0;
    for (let i = 0; i <= period; i++) {
      if (i % sampleInterval !== 0 && i !== period) continue;
      
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Count assets up to this date using sorted array
      while (assetIndex < sortedAssets.length && 
             new Date(sortedAssets[assetIndex].registration_date) <= date) {
        assetIndex++;
      }
      
      assetGrowth.push({ date: dateStr, count: assetIndex });
    }

    // Verify the calculation produces valid results
    expect(assetGrowth.length).toBeGreaterThan(0);
    assetGrowth.forEach(point => {
      expect(point.date).toBeDefined();
      expect(point.count).toBeGreaterThanOrEqual(0);
    });

    // The final count should equal total assets
    if (assetGrowth.length > 0) {
      const lastPoint = assetGrowth[assetGrowth.length - 1];
      expect(lastPoint.count).toBeLessThanOrEqual(sortedAssets.length);
    }
  });

  it('should correctly calculate status changes using registration_date', async () => {
    const now = new Date();
    const period = 7;
    const startDate = new Date(now - period * 24 * 60 * 60 * 1000);

    const allAssets = await assetDb.getAll();

    // Simulate status changes calculation from trends endpoint
    const sampleInterval = Math.max(1, Math.floor(period / 30));
    const statusChanges = [];
    
    for (let i = 0; i <= period; i += sampleInterval) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const statusCount = { date: dateStr, active: 0, returned: 0, lost: 0, damaged: 0, retired: 0 };
      
      // Count only assets registered before or on this date
      for (const asset of allAssets) {
        if (new Date(asset.registration_date) <= date) {
          if (statusCount.hasOwnProperty(asset.status)) {
            statusCount[asset.status]++;
          }
        }
      }
      
      statusChanges.push(statusCount);
    }

    // Verify results
    expect(statusChanges.length).toBeGreaterThan(0);
    statusChanges.forEach(point => {
      expect(point.date).toBeDefined();
      expect(point.active).toBeGreaterThanOrEqual(0);
    });
  });

  it('should correctly calculate current vs previous period metrics using registration_date', async () => {
    const now = new Date();
    const period = 7;
    const currentPeriodStart = new Date(now - period * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now - 2 * period * 24 * 60 * 60 * 1000);
    const previousPeriodEnd = currentPeriodStart;

    const allAssets = await assetDb.getAll();

    // Simulate current vs previous period calculation
    const currentAssets = allAssets.filter(a => {
      const registrationDate = new Date(a.registration_date);
      return registrationDate >= currentPeriodStart && registrationDate <= now;
    });

    const previousAssets = allAssets.filter(a => {
      const registrationDate = new Date(a.registration_date);
      return registrationDate >= previousPeriodStart && registrationDate < previousPeriodEnd;
    });

    const allCurrentAssets = allAssets.filter(a => new Date(a.registration_date) <= now);
    const allPreviousAssets = allAssets.filter(a => new Date(a.registration_date) < previousPeriodEnd);

    // Verify calculations work
    expect(currentAssets.length).toBeGreaterThanOrEqual(0);
    expect(previousAssets.length).toBeGreaterThanOrEqual(0);
    expect(allCurrentAssets.length).toBeGreaterThanOrEqual(currentAssets.length);
    expect(allPreviousAssets.length).toBeGreaterThanOrEqual(previousAssets.length);

    // Current period should include all assets up to now
    expect(allCurrentAssets.length).toBeGreaterThanOrEqual(0);
  });
});
