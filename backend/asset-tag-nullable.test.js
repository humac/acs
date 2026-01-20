/**
 * Tests for nullable asset_tag field
 * Verifies that asset_tag can be NULL while maintaining uniqueness constraint
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { assetDb, companyDb, userDb } from './database.js';

describe('Asset Tag Nullable Support', () => {
  let testCompany;
  let testUser;
  const timestamp = Date.now();

  beforeAll(async () => {
    // Initialize database
    await assetDb.init();

    // Create test company
    testCompany = await companyDb.create({
      name: `Test Company ${timestamp}`,
      description: 'Test company for asset_tag nullable tests'
    });

    // Create test user
    testUser = await userDb.create({
      email: `test-asset-tag-${timestamp}@example.com`,
      password_hash: 'test-hash',
      name: 'Test User',
      first_name: 'Test',
      last_name: 'User',
      role: 'employee'
    });
  });

  afterAll(async () => {
    // Cleanup test data
    const assets = await assetDb.getAll();
    const testAssets = assets.filter(a => a.serial_number?.startsWith(`NULL-TEST-${timestamp}`));
    for (const asset of testAssets) {
      await assetDb.delete(asset.id);
    }

    if (testUser) {
      await userDb.delete(testUser.id);
    }

    if (testCompany) {
      await companyDb.delete(testCompany.id);
    }
  });

  it('should allow creating asset with NULL asset_tag', async () => {
    const asset = await assetDb.create({
      employee_first_name: 'John',
      employee_last_name: 'Doe',
      employee_email: testUser.email,
      company_name: testCompany.name,
      asset_type: 'laptop',
      make: 'Apple',
      model: 'MacBook Pro',
      serial_number: `NULL-TEST-${timestamp}-1`,
      asset_tag: null,
      status: 'active'
    });

    expect(asset).toBeDefined();
    expect(asset.id).toBeDefined();

    const retrieved = await assetDb.getById(asset.id);
    expect(retrieved.asset_tag).toBeNull();
  });

  it('should allow multiple assets with NULL asset_tag (NULL is not unique)', async () => {
    const asset1 = await assetDb.create({
      employee_first_name: 'Jane',
      employee_last_name: 'Doe',
      employee_email: testUser.email,
      company_name: testCompany.name,
      asset_type: 'laptop',
      serial_number: `NULL-TEST-${timestamp}-2`,
      asset_tag: null,
      status: 'active'
    });

    const asset2 = await assetDb.create({
      employee_first_name: 'Bob',
      employee_last_name: 'Smith',
      employee_email: testUser.email,
      company_name: testCompany.name,
      asset_type: 'mobile_phone',
      serial_number: `NULL-TEST-${timestamp}-3`,
      asset_tag: null,
      status: 'active'
    });

    expect(asset1.id).toBeDefined();
    expect(asset2.id).toBeDefined();
    expect(asset1.id).not.toBe(asset2.id);

    const retrieved1 = await assetDb.getById(asset1.id);
    const retrieved2 = await assetDb.getById(asset2.id);

    expect(retrieved1.asset_tag).toBeNull();
    expect(retrieved2.asset_tag).toBeNull();
  });

  it('should still enforce uniqueness for non-NULL asset_tag values', async () => {
    const uniqueTag = `UNIQUE-TAG-${timestamp}`;

    const asset1 = await assetDb.create({
      employee_first_name: 'Alice',
      employee_last_name: 'Johnson',
      employee_email: testUser.email,
      company_name: testCompany.name,
      asset_type: 'laptop',
      serial_number: `NULL-TEST-${timestamp}-4`,
      asset_tag: uniqueTag,
      status: 'active'
    });

    expect(asset1.id).toBeDefined();

    // Attempt to create another asset with the same non-NULL asset_tag should fail
    await expect(async () => {
      await assetDb.create({
        employee_first_name: 'Charlie',
        employee_last_name: 'Brown',
        employee_email: testUser.email,
        company_name: testCompany.name,
        asset_type: 'laptop',
        serial_number: `NULL-TEST-${timestamp}-5`,
        asset_tag: uniqueTag,
        status: 'active'
      });
    }).rejects.toThrow();
  });

  it('should convert empty string to NULL when creating asset', async () => {
    const asset = await assetDb.create({
      employee_first_name: 'Empty',
      employee_last_name: 'Tag',
      employee_email: testUser.email,
      company_name: testCompany.name,
      asset_type: 'laptop',
      serial_number: `NULL-TEST-${timestamp}-6`,
      asset_tag: '', // Empty string should become NULL
      status: 'active'
    });

    expect(asset.id).toBeDefined();

    const retrieved = await assetDb.getById(asset.id);
    expect(retrieved.asset_tag).toBeNull();
  });

  it('should convert empty string to NULL when updating asset', async () => {
    const asset = await assetDb.create({
      employee_first_name: 'Update',
      employee_last_name: 'Test',
      employee_email: testUser.email,
      company_name: testCompany.name,
      asset_type: 'laptop',
      serial_number: `NULL-TEST-${timestamp}-7`,
      asset_tag: `TAG-${timestamp}`,
      status: 'active'
    });

    expect(asset.id).toBeDefined();

    // Update with empty string
    await assetDb.update(asset.id, {
      ...asset,
      asset_tag: ''
    });

    const updated = await assetDb.getById(asset.id);
    expect(updated.asset_tag).toBeNull();
  });
});
