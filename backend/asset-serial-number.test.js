/**
 * Regression tests for serial number handling
 * Verifies that serial numbers containing special characters (dashes, slashes, dots, etc.)
 * are accepted, and that duplicate serial numbers produce clear error messages.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { assetDb, companyDb } from './database.js';

describe('Asset Serial Number Handling', () => {
  let testCompany;
  const timestamp = Date.now();
  const createdAssetIds = [];

  beforeAll(async () => {
    await assetDb.init();

    testCompany = await companyDb.create({
      name: `Serial Test Co ${timestamp}`,
    });
  });

  afterAll(async () => {
    // Clean up created assets
    for (const id of createdAssetIds) {
      try {
        await assetDb.delete(id);
      } catch (_) { /* ignore */ }
    }
    try {
      await companyDb.delete(testCompany.id);
    } catch (_) { /* ignore */ }
  });

  const createAsset = async (serialNumber) => {
    const result = await assetDb.create({
      employee_first_name: 'Test',
      employee_last_name: 'User',
      employee_email: `serial-test-${timestamp}@example.com`,
      company_id: testCompany.id,
      asset_type: 'laptop',
      make: 'Dell',
      model: 'XPS',
      serial_number: serialNumber,
    });
    createdAssetIds.push(result.id);
    return result;
  };

  it('should accept serial numbers with dashes', async () => {
    const result = await createAsset(`AB-1234-${timestamp}`);
    expect(result.id).toBeDefined();

    const asset = await assetDb.getById(result.id);
    expect(asset.serial_number).toBe(`AB-1234-${timestamp}`);
  });

  it('should accept serial numbers with forward slashes', async () => {
    const result = await createAsset(`AB/1234/${timestamp}`);
    expect(result.id).toBeDefined();

    const asset = await assetDb.getById(result.id);
    expect(asset.serial_number).toBe(`AB/1234/${timestamp}`);
  });

  it('should accept serial numbers with dots', async () => {
    const result = await createAsset(`AB.1234.${timestamp}`);
    expect(result.id).toBeDefined();

    const asset = await assetDb.getById(result.id);
    expect(asset.serial_number).toBe(`AB.1234.${timestamp}`);
  });

  it('should accept serial numbers with mixed special characters', async () => {
    const result = await createAsset(`SN-12/34.56_${timestamp}`);
    expect(result.id).toBeDefined();

    const asset = await assetDb.getById(result.id);
    expect(asset.serial_number).toBe(`SN-12/34.56_${timestamp}`);
  });

  it('should accept serial numbers with parentheses and spaces', async () => {
    const result = await createAsset(`SN (2024) - ${timestamp}`);
    expect(result.id).toBeDefined();

    const asset = await assetDb.getById(result.id);
    expect(asset.serial_number).toBe(`SN (2024) - ${timestamp}`);
  });

  it('should accept serial numbers with colons and hashes', async () => {
    const result = await createAsset(`SN:12#34-${timestamp}`);
    expect(result.id).toBeDefined();

    const asset = await assetDb.getById(result.id);
    expect(asset.serial_number).toBe(`SN:12#34-${timestamp}`);
  });

  it('should reject duplicate serial numbers', async () => {
    const serial = `DUPE-${timestamp}`;
    const first = await createAsset(serial);
    expect(first.id).toBeDefined();

    // Second insert with same serial should fail
    await expect(
      assetDb.create({
        employee_first_name: 'Dup',
        employee_last_name: 'User',
        employee_email: `serial-dupe-${timestamp}@example.com`,
        company_id: testCompany.id,
        asset_type: 'laptop',
        make: 'Dell',
        model: 'XPS',
        serial_number: serial,
      })
    ).rejects.toThrow();
  });

  it('should allow updating an asset with special character serial number', async () => {
    const result = await createAsset(`UPDATE-TEST-${timestamp}`);

    await assetDb.update(result.id, {
      employee_first_name: 'Test',
      employee_last_name: 'User',
      employee_email: `serial-test-${timestamp}@example.com`,
      company_id: testCompany.id,
      asset_type: 'laptop',
      make: 'Dell',
      model: 'XPS',
      serial_number: `UPDATED/SN-${timestamp}`,
      status: 'active',
    });

    const updated = await assetDb.getById(result.id);
    expect(updated.serial_number).toBe(`UPDATED/SN-${timestamp}`);
  });
});
