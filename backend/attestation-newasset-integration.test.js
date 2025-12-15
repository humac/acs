import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { 
  attestationCampaignDb, 
  attestationRecordDb, 
  attestationNewAssetDb,
  userDb, 
  assetDb,
  companyDb 
} from './database.js';
import { unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';

const TEST_DB_PATH = resolve(process.cwd(), 'data', 'test-attestation-newasset.db');

// Clean up test database
const cleanupTestDb = () => {
  if (existsSync(TEST_DB_PATH)) {
    try {
      unlinkSync(TEST_DB_PATH);
    } catch (err) {
      // Ignore errors
    }
  }
};

beforeAll(async () => {
  cleanupTestDb();
  process.env.DB_PATH = TEST_DB_PATH;
  await assetDb.init();
});

afterAll(() => {
  cleanupTestDb();
});

describe('Attestation New Asset Integration Test', () => {
  it('should transfer new assets to main assets table when attestation is completed', async () => {
    const timestamp = Date.now();
    
    // 1. Create admin user
    const admin = await userDb.create({
      email: `admin-integration-${timestamp}@test.com`,
      password_hash: 'hash',
      name: 'Admin Integration',
      role: 'admin',
      first_name: 'Admin',
      last_name: 'Integration'
    });
    expect(admin.id).toBeDefined();
    
    // 2. Create employee user
    const employeeEmail = `employee-integration-${timestamp}@test.com`;
    const employeeCreated = await userDb.create({
      email: employeeEmail,
      password_hash: 'hash',
      name: 'Employee Integration',
      role: 'employee',
      first_name: 'Employee',
      last_name: 'Integration'
    });
    expect(employeeCreated.id).toBeDefined();
    
    // Get full employee object
    const employee = await userDb.getByEmail(employeeEmail);
    expect(employee).toBeDefined();
    
    // 3. Create company
    const company = await companyDb.create({ 
      name: `Integration Test Company ${timestamp}` 
    });
    expect(company.id).toBeDefined();
    
    // 4. Create attestation campaign
    const campaign = await attestationCampaignDb.create({
      name: 'Integration Test Campaign',
      description: 'Testing new asset transfer on completion',
      start_date: new Date().toISOString(),
      end_date: null,
      reminder_days: 7,
      escalation_days: 10,
      created_by: admin.id
    });
    expect(campaign.id).toBeDefined();
    
    // 5. Create attestation record for employee
    const record = await attestationRecordDb.create({
      campaign_id: campaign.id,
      user_id: employee.id,
      status: 'in_progress'
    });
    expect(record.id).toBeDefined();
    
    // 6. Employee adds a new asset during attestation
    const newAssetData = {
      attestation_record_id: record.id,
      asset_type: 'Laptop',
      make: 'Dell',
      model: 'XPS 15',
      serial_number: `INTEGRATION-SN-${timestamp}`,
      asset_tag: `INTEGRATION-TAG-${timestamp}`,
      company_id: company.id,
      notes: 'Added during attestation - integration test'
    };
    
    const newAsset = await attestationNewAssetDb.create(newAssetData);
    expect(newAsset.id).toBeDefined();
    
    // 7. Verify the new asset is in attestation_new_assets table
    const newAssets = await attestationNewAssetDb.getByRecordId(record.id);
    expect(newAssets.length).toBe(1);
    expect(newAssets[0].serial_number).toBe(`INTEGRATION-SN-${timestamp}`);
    
    // 8. Verify the asset is NOT in main assets table yet
    const assetsBeforeCompletion = await assetDb.getAll();
    const assetBeforeCount = assetsBeforeCompletion.filter(
      a => a.serial_number === `INTEGRATION-SN-${timestamp}`
    ).length;
    expect(assetBeforeCount).toBe(0);
    
    // 9. Simulate the completion endpoint logic
    // Get newly added assets during attestation
    const newAssetsToTransfer = await attestationNewAssetDb.getByRecordId(record.id);
    
    // Transfer new assets to the main assets table
    for (const asset of newAssetsToTransfer) {
      await assetDb.create({
        employee_email: employee.email,
        employee_first_name: employee.first_name || '',
        employee_last_name: employee.last_name || '',
        manager_email: employee.manager_email || null,
        company_id: asset.company_id,
        asset_type: asset.asset_type,
        make: asset.make || '',
        model: asset.model || '',
        serial_number: asset.serial_number,
        asset_tag: asset.asset_tag,
        status: 'active',
        notes: asset.notes || ''
      });
    }
    
    // 10. Mark attestation as completed
    await attestationRecordDb.update(record.id, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });
    
    // 11. Verify the attestation is completed
    const completedRecord = await attestationRecordDb.getById(record.id);
    expect(completedRecord.status).toBe('completed');
    expect(completedRecord.completed_at).toBeTruthy();
    
    // 12. Verify the asset IS NOW in main assets table
    const assetsAfterCompletion = await assetDb.getAll();
    const assetsMatchingSerial = assetsAfterCompletion.filter(
      a => a.serial_number === `INTEGRATION-SN-${timestamp}`
    );
    expect(assetsMatchingSerial.length).toBe(1);
    
    // 13. Verify the asset has correct details
    const transferredAsset = assetsMatchingSerial[0];
    
    expect(transferredAsset.asset_type).toBe('Laptop');
    expect(transferredAsset.make).toBe('Dell');
    expect(transferredAsset.model).toBe('XPS 15');
    expect(transferredAsset.asset_tag).toBe(`INTEGRATION-TAG-${timestamp}`);
    expect(transferredAsset.company_id).toBe(company.id);
    expect(transferredAsset.status).toBe('active');
    expect(transferredAsset.notes).toBe('Added during attestation - integration test');
    
    // The owner_id should be set, which allows the JOIN to get the email
    expect(transferredAsset.owner_id).toBe(employee.id);
    expect(transferredAsset.employee_email).toBe(employee.email);
    expect(transferredAsset.employee_first_name).toBe('Employee');
    expect(transferredAsset.employee_last_name).toBe('Integration');
  });
});
