import { afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { assetDb, companyDb, userDb } from './database.js';
import { requireAssetPermission } from './middleware/authorization.js';

const createdAssetIds = [];
const createdUserIds = [];
const createdCompanyIds = [];

const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe('Asset self-edit regression', () => {
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

  it('preserves employee identity fields and ownership when an employee updates their own asset', async () => {
    const suffix = uniqueSuffix();
    const companyResult = await companyDb.create({
      name: `Regression Co ${suffix}`,
      description: 'Asset self-edit regression test'
    });
    createdCompanyIds.push(companyResult.id);

    await userDb.create({
      email: `employee-${suffix}@test.com`,
      password_hash: 'hash',
      name: 'Employee Regression',
      role: 'employee',
      first_name: 'Emily',
      last_name: 'Owner'
    });
    const employee = await userDb.getByEmail(`employee-${suffix}@test.com`);
    createdUserIds.push(employee.id);

    const assetResult = await assetDb.create({
      employee_first_name: 'Emily',
      employee_last_name: 'Owner',
      employee_email: employee.email,
      company_name: `Regression Co ${suffix}`,
      asset_type: 'laptop',
      make: 'Dell',
      model: 'Latitude',
      serial_number: `SELF-EDIT-${suffix}`,
      asset_tag: `SELF-EDIT-TAG-${suffix}`,
      status: 'active',
      notes: 'Before update'
    });
    createdAssetIds.push(assetResult.id);

    // Simulate the non-admin route behavior after forbidden ownership fields are stripped.
    await assetDb.update(assetResult.id, {
      company_name: `Regression Co ${suffix}`,
      asset_type: 'laptop',
      make: 'Lenovo',
      model: 'T14',
      serial_number: `SELF-EDIT-${suffix}`,
      asset_tag: `SELF-EDIT-TAG-${suffix}`,
      status: 'active',
      notes: 'Updated by owner'
    });

    const reloadedAsset = await assetDb.getById(assetResult.id);
    expect(reloadedAsset).toEqual(expect.objectContaining({
      employee_first_name: 'Emily',
      employee_last_name: 'Owner',
      employee_email: employee.email,
      owner_id: employee.id,
      make: 'Lenovo',
      model: 'T14',
      notes: 'Updated by owner'
    }));

    const req = {
      params: { id: String(assetResult.id) },
      user: { id: employee.id },
      asset: reloadedAsset
    };
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      }
    };
    const next = jest.fn();

    await requireAssetPermission(assetDb, userDb)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});
