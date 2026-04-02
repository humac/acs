import { afterEach, beforeAll, describe, expect, it } from '@jest/globals';

import { assetDb, auditDb, companyDb, userDb } from './database.js';
import { repairAssetOwners, resolveOwnerRepairSnapshot } from './services/assetOwnerRepair.js';

const createdAssetIds = [];
const createdCompanyIds = [];
const createdUserIds = [];

const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe('Asset owner repair', () => {
  beforeAll(async () => {
    await assetDb.init();
  });

  afterEach(async () => {
    while (createdAssetIds.length) {
      await assetDb.delete(createdAssetIds.pop());
    }

    while (createdUserIds.length) {
      await userDb.delete(createdUserIds.pop());
    }

    while (createdCompanyIds.length) {
      await companyDb.delete(createdCompanyIds.pop());
    }
  });

  it('reconstructs the owner from audit history and restores the asset in apply mode', async () => {
    const suffix = uniqueSuffix();
    const company = await companyDb.create({
      name: `Repair Co ${suffix}`,
      description: 'Asset owner repair test'
    });
    createdCompanyIds.push(company.id);

    await userDb.create({
      email: `repair-owner-${suffix}@test.com`,
      password_hash: 'hash',
      name: 'Repair Owner',
      role: 'employee',
      first_name: 'Riley',
      last_name: 'Owner'
    });
    const user = await userDb.getByEmail(`repair-owner-${suffix}@test.com`);
    createdUserIds.push(user.id);

    const createdAsset = await assetDb.create({
      employee_first_name: 'Riley',
      employee_last_name: 'Owner',
      employee_email: user.email,
      company_name: `Repair Co ${suffix}`,
      asset_type: 'laptop',
      make: 'Dell',
      model: 'Latitude',
      serial_number: `REPAIR-${suffix}`,
      asset_tag: `REPAIR-TAG-${suffix}`,
      status: 'active',
      notes: 'Original state'
    });
    createdAssetIds.push(createdAsset.id);

    await auditDb.log(
      'CREATE',
      'asset',
      createdAsset.id,
      `REPAIR-${suffix} - Riley Owner`,
      {
        employee_first_name: 'Riley',
        employee_last_name: 'Owner',
        employee_email: user.email,
        company_name: `Repair Co ${suffix}`,
        asset_type: 'laptop',
        serial_number: `REPAIR-${suffix}`
      },
      'admin@test.com'
    );

    await assetDb.update(createdAsset.id, {
      employee_first_name: '',
      employee_last_name: '',
      employee_email: '',
      company_name: `Repair Co ${suffix}`,
      asset_type: 'laptop',
      make: 'Dell',
      model: 'Latitude',
      serial_number: `REPAIR-${suffix}`,
      asset_tag: `REPAIR-TAG-${suffix}`,
      status: 'active',
      notes: 'Corrupted state'
    });

    const damagedAsset = await assetDb.getById(createdAsset.id);
    expect(damagedAsset.employee_email).toBe('');
    expect(damagedAsset.owner_id).toBeNull();

    const dryRunSummary = await repairAssetOwners({
      assetId: createdAsset.id
    });
    expect(dryRunSummary.repaired).toBe(0);
    expect(dryRunSummary.results).toHaveLength(1);
    expect(dryRunSummary.results[0]).toEqual(expect.objectContaining({
      status: 'dry-run',
      to: expect.objectContaining({
        employee_first_name: 'Riley',
        employee_last_name: 'Owner',
        employee_email: user.email
      })
    }));

    const applySummary = await repairAssetOwners({
      apply: true,
      assetId: createdAsset.id
    });

    expect(applySummary.repaired).toBe(1);
    const repairedAsset = await assetDb.getById(createdAsset.id);
    expect(repairedAsset).toEqual(expect.objectContaining({
      employee_first_name: 'Riley',
      employee_last_name: 'Owner',
      employee_email: user.email,
      owner_id: user.id
    }));

    const auditLogs = await auditDb.getByEntity('asset', createdAsset.id);
    expect(auditLogs.some((log) => log.action === 'REPAIR')).toBe(true);
  });

  it('uses the current email plus the user record when names are missing', async () => {
    const logs = [];
    const asset = {
      employee_email: 'repair-name-fill@test.com',
      employee_first_name: '',
      employee_last_name: '',
      owner_id: null
    };
    const fakeUserDb = {
      async getByEmail(email) {
        if (email.toLowerCase() === 'repair-name-fill@test.com') {
          return {
            id: 99,
            first_name: 'Pat',
            last_name: 'Example'
          };
        }
        return null;
      }
    };

    const resolved = await resolveOwnerRepairSnapshot(asset, logs, fakeUserDb);
    expect(resolved).toEqual(expect.objectContaining({
      email: 'repair-name-fill@test.com',
      firstName: 'Pat',
      lastName: 'Example',
      matchedUserId: 99
    }));
  });
});
