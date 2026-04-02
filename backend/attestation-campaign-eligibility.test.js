import { afterEach, beforeAll, describe, expect, it } from '@jest/globals';

import {
  assetDb,
  attestationAssetDb,
  attestationCampaignDb,
  attestationRecordDb,
  companyDb,
  userDb
} from './database.js';
import {
  filterCampaignTargetsByEligibleAssets,
  getEligibleAssetsForCampaignUser
} from './routes/attestation.js';

const createdCampaignIds = [];
const createdAssetIds = [];
const createdUserIds = [];
const createdCompanyIds = [];

const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const remember = (collection, value) => {
  collection.push(value);
  return value;
};

const createUser = async ({ suffix, role = 'employee', emailPrefix, firstName, lastName, managerEmail = null }) => {
  const email = `${emailPrefix}-${suffix}@test.com`;
  await userDb.create({
    email,
    password_hash: 'hash',
    name: `${firstName} ${lastName}`,
    role,
    first_name: firstName,
    last_name: lastName,
    manager_email: managerEmail
  });
  const user = await userDb.getByEmail(email);
  remember(createdUserIds, user.id);
  return user;
};

const createCompany = async (suffix, namePrefix = 'Eligibility Co') => {
  const result = await companyDb.create({
    name: `${namePrefix} ${suffix}`,
    description: 'Attestation eligibility test company'
  });
  remember(createdCompanyIds, result.id);
  return companyDb.getById(result.id);
};

const createAsset = async (asset) => {
  const result = await assetDb.create(asset);
  remember(createdAssetIds, result.id);
  return assetDb.getById(result.id);
};

const createCampaign = async (campaign) => {
  const result = await attestationCampaignDb.create(campaign);
  remember(createdCampaignIds, result.id);
  return attestationCampaignDb.getById(result.id);
};

describe('Attestation campaign eligibility', () => {
  beforeAll(async () => {
    await assetDb.init();
  });

  afterEach(async () => {
    while (createdCampaignIds.length) {
      await attestationCampaignDb.delete(createdCampaignIds.pop());
    }

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

  it('omits previously certified returned assets from attestation record details', async () => {
    const suffix = uniqueSuffix();
    const admin = await createUser({
      suffix,
      role: 'admin',
      emailPrefix: 'admin-record',
      firstName: 'Admin',
      lastName: 'Record'
    });
    const employee = await createUser({
      suffix,
      emailPrefix: 'employee-record',
      firstName: 'Erin',
      lastName: 'Employee'
    });
    const company = await createCompany(suffix, 'Record Detail Co');

    const activeAsset = await createAsset({
      employee_first_name: 'Erin',
      employee_last_name: 'Employee',
      employee_email: employee.email,
      company_id: company.id,
      asset_type: 'laptop',
      make: 'Lenovo',
      model: 'T14',
      serial_number: `ACTIVE-${suffix}`,
      asset_tag: `ACTIVE-TAG-${suffix}`,
      status: 'active'
    });

    const returnedAsset = await createAsset({
      employee_first_name: 'Erin',
      employee_last_name: 'Employee',
      employee_email: employee.email,
      company_id: company.id,
      asset_type: 'monitor',
      make: 'LG',
      model: 'UltraFine',
      serial_number: `RETURNED-${suffix}`,
      asset_tag: `RETURNED-TAG-${suffix}`,
      status: 'returned',
      returned_date: '2026-02-15'
    });

    const previousCampaign = await createCampaign({
      name: `Previous Returned ${suffix}`,
      description: 'Previous certification',
      start_date: '2026-02-01',
      status: 'completed',
      created_by: admin.id
    });
    const previousRecord = await attestationRecordDb.create({
      campaign_id: previousCampaign.id,
      user_id: employee.id,
      status: 'completed'
    });
    await attestationAssetDb.create({
      attestation_record_id: previousRecord.id,
      asset_id: returnedAsset.id,
      attested_status: 'returned',
      previous_status: 'active',
      returned_date: '2026-02-15',
      notes: 'Already returned',
      attested_at: '2026-02-05T10:00:00.000Z'
    });

    const currentCampaign = await createCampaign({
      name: `Current Returned ${suffix}`,
      description: 'Current certification',
      start_date: '2026-03-01',
      status: 'active',
      created_by: admin.id
    });
    const currentRecord = await attestationRecordDb.create({
      campaign_id: currentCampaign.id,
      user_id: employee.id,
      status: 'pending'
    });

    const { eligibleAssets } = await getEligibleAssetsForCampaignUser({
      campaign: currentCampaign,
      email: employee.email,
      assetDb,
      attestationAssetDb,
      excludeRecordId: currentRecord.id
    });

    expect(eligibleAssets).toHaveLength(1);
    expect(eligibleAssets[0].id).toBe(activeAsset.id);
    expect(eligibleAssets.find((asset) => asset.id === returnedAsset.id)).toBeUndefined();
  });

  it('counts only eligible users and assets in company-scoped scope preview', async () => {
    const suffix = uniqueSuffix();
    const admin = await createUser({
      suffix,
      role: 'admin',
      emailPrefix: 'admin-scope',
      firstName: 'Admin',
      lastName: 'Scope'
    });
    const eligibleEmployee = await createUser({
      suffix,
      emailPrefix: 'eligible-scope',
      firstName: 'Eli',
      lastName: 'Eligible'
    });
    const excludedEmployee = await createUser({
      suffix,
      emailPrefix: 'excluded-scope',
      firstName: 'Rita',
      lastName: 'Returned'
    });
    const company = await createCompany(suffix, 'Scope Preview Co');

    await createAsset({
      employee_first_name: 'Eli',
      employee_last_name: 'Eligible',
      employee_email: eligibleEmployee.email,
      company_id: company.id,
      asset_type: 'laptop',
      make: 'Dell',
      model: 'Latitude',
      serial_number: `SCOPE-ACTIVE-${suffix}`,
      asset_tag: `SCOPE-ACTIVE-TAG-${suffix}`,
      status: 'active'
    });

    const excludedAsset = await createAsset({
      employee_first_name: 'Rita',
      employee_last_name: 'Returned',
      employee_email: excludedEmployee.email,
      company_id: company.id,
      asset_type: 'mobile_phone',
      make: 'Apple',
      model: 'iPhone',
      serial_number: `SCOPE-RETURNED-${suffix}`,
      asset_tag: `SCOPE-RETURNED-TAG-${suffix}`,
      status: 'returned',
      returned_date: '2026-02-10'
    });

    const previousCampaign = await createCampaign({
      name: `Scope Previous ${suffix}`,
      description: 'Previous scope certification',
      start_date: '2026-02-01',
      status: 'completed',
      created_by: admin.id
    });
    const previousRecord = await attestationRecordDb.create({
      campaign_id: previousCampaign.id,
      user_id: excludedEmployee.id,
      status: 'completed'
    });
    await attestationAssetDb.create({
      attestation_record_id: previousRecord.id,
      asset_id: excludedAsset.id,
      attested_status: 'returned',
      previous_status: 'active',
      returned_date: '2026-02-10',
      notes: 'Already certified returned',
      attested_at: '2026-02-02T10:00:00.000Z'
    });

    const draftCampaign = await createCampaign({
      name: `Scope Draft ${suffix}`,
      description: 'Draft campaign',
      start_date: '2026-04-01',
      status: 'draft',
      target_type: 'companies',
      target_company_ids: JSON.stringify([company.id]),
      created_by: admin.id
    });

    const result = await filterCampaignTargetsByEligibleAssets(
      draftCampaign,
      [eligibleEmployee, excludedEmployee],
      [],
      { assetDb, attestationAssetDb }
    );

    expect({
      registeredUsers: result.eligibleUsers.length,
      unregisteredOwners: result.eligibleOwners.length,
      totalEmployees: result.eligibleUsers.length + result.eligibleOwners.length,
      totalAssets: result.totalEligibleAssets,
      companiesInScope: result.companiesInScope.size
    }).toEqual(expect.objectContaining({
      registeredUsers: 1,
      unregisteredOwners: 0,
      totalEmployees: 1,
      totalAssets: 1,
      companiesInScope: 1
    }));
  });

  it('skips selected targets with no eligible assets when starting a campaign', async () => {
    const suffix = uniqueSuffix();
    const admin = await createUser({
      suffix,
      role: 'admin',
      emailPrefix: 'admin-start',
      firstName: 'Admin',
      lastName: 'Start'
    });
    const eligibleEmployee = await createUser({
      suffix,
      emailPrefix: 'eligible-start',
      firstName: 'Ava',
      lastName: 'Active'
    });
    const excludedEmployee = await createUser({
      suffix,
      emailPrefix: 'excluded-start',
      firstName: 'Rory',
      lastName: 'Returned'
    });
    const company = await createCompany(suffix, 'Start Campaign Co');

    await createAsset({
      employee_first_name: 'Ava',
      employee_last_name: 'Active',
      employee_email: eligibleEmployee.email,
      company_id: company.id,
      asset_type: 'laptop',
      make: 'HP',
      model: 'EliteBook',
      serial_number: `START-ACTIVE-${suffix}`,
      asset_tag: `START-ACTIVE-TAG-${suffix}`,
      status: 'active'
    });

    const excludedAsset = await createAsset({
      employee_first_name: 'Rory',
      employee_last_name: 'Returned',
      employee_email: excludedEmployee.email,
      company_id: company.id,
      asset_type: 'monitor',
      make: 'Dell',
      model: 'U2720Q',
      serial_number: `START-RETURNED-${suffix}`,
      asset_tag: `START-RETURNED-TAG-${suffix}`,
      status: 'returned',
      returned_date: '2026-01-20'
    });

    const previousCampaign = await createCampaign({
      name: `Start Previous ${suffix}`,
      description: 'Previous selected certification',
      start_date: '2026-01-01',
      status: 'completed',
      created_by: admin.id
    });
    const previousRecord = await attestationRecordDb.create({
      campaign_id: previousCampaign.id,
      user_id: excludedEmployee.id,
      status: 'completed'
    });
    await attestationAssetDb.create({
      attestation_record_id: previousRecord.id,
      asset_id: excludedAsset.id,
      attested_status: 'returned',
      previous_status: 'active',
      returned_date: '2026-01-20',
      notes: 'Previously certified returned',
      attested_at: '2026-01-15T10:00:00.000Z'
    });

    const draftCampaign = await createCampaign({
      name: `Start Selected ${suffix}`,
      description: 'Selected target campaign',
      start_date: '2026-04-10',
      status: 'draft',
      target_type: 'selected',
      target_user_ids: JSON.stringify([eligibleEmployee.id, excludedEmployee.id]),
      target_emails: JSON.stringify([
        { email: `invite-no-assets-${suffix}@test.com`, firstName: 'No', lastName: 'Assets' }
      ]),
      created_by: admin.id
    });

    const result = await filterCampaignTargetsByEligibleAssets(
      draftCampaign,
      [eligibleEmployee, excludedEmployee],
      [{ email: `invite-no-assets-${suffix}@test.com`, firstName: 'No', lastName: 'Assets' }],
      { assetDb, attestationAssetDb }
    );

    expect(result.eligibleUsers.map((user) => user.id)).toEqual([eligibleEmployee.id]);
    expect(result.eligibleOwners).toHaveLength(0);
    expect(result.skippedTargets).toHaveLength(2);
  });

  it('returns a clear error when every company-scoped target asset is already satisfied', async () => {
    const suffix = uniqueSuffix();
    const admin = await createUser({
      suffix,
      role: 'admin',
      emailPrefix: 'admin-empty',
      firstName: 'Admin',
      lastName: 'Empty'
    });
    const employee = await createUser({
      suffix,
      emailPrefix: 'employee-empty',
      firstName: 'Casey',
      lastName: 'Closed'
    });
    const company = await createCompany(suffix, 'No Eligible Assets Co');

    const excludedAsset = await createAsset({
      employee_first_name: 'Casey',
      employee_last_name: 'Closed',
      employee_email: employee.email,
      company_id: company.id,
      asset_type: 'tablet',
      make: 'Apple',
      model: 'iPad',
      serial_number: `EMPTY-RETURNED-${suffix}`,
      asset_tag: `EMPTY-RETURNED-TAG-${suffix}`,
      status: 'returned',
      returned_date: '2026-02-25'
    });

    const previousCampaign = await createCampaign({
      name: `Empty Previous ${suffix}`,
      description: 'Previous completed campaign',
      start_date: '2026-02-01',
      status: 'completed',
      created_by: admin.id
    });
    const previousRecord = await attestationRecordDb.create({
      campaign_id: previousCampaign.id,
      user_id: employee.id,
      status: 'completed'
    });
    await attestationAssetDb.create({
      attestation_record_id: previousRecord.id,
      asset_id: excludedAsset.id,
      attested_status: 'returned',
      previous_status: 'active',
      returned_date: '2026-02-25',
      notes: 'Already done',
      attested_at: '2026-02-26T09:00:00.000Z'
    });

    const draftCampaign = await createCampaign({
      name: `Empty Draft ${suffix}`,
      description: 'No eligible assets remain',
      start_date: '2026-04-15',
      status: 'draft',
      target_type: 'companies',
      target_company_ids: JSON.stringify([company.id]),
      created_by: admin.id
    });

    const result = await filterCampaignTargetsByEligibleAssets(
      draftCampaign,
      [employee],
      [],
      { assetDb, attestationAssetDb }
    );

    expect(result.eligibleUsers).toHaveLength(0);
    expect(result.eligibleOwners).toHaveLength(0);
    expect(result.skippedTargets).toEqual([employee.email]);
  });
});
