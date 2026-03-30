import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import {
  assetDb,
  attestationAssetDb,
  attestationCampaignDb,
  attestationRecordDb,
  companyDb,
  userDb
} from './database.js';

describe('Attestation history defaults', () => {
  let employeeUser;
  let company;
  let historyAsset;
  let returnedAsset;
  let previousCampaign;
  let currentCampaign;
  let updateCampaign;
  let previousRecord;
  let currentRecord;
  let updateRecord;
  const timestamp = Date.now();

  beforeAll(async () => {
    await assetDb.init();

    const employeeEmail = `history-employee-${timestamp}@test.com`;

    await userDb.create({
      email: employeeEmail,
      password_hash: 'hash',
      name: 'History Employee',
      role: 'employee',
      first_name: 'History',
      last_name: 'Employee'
    });
    employeeUser = await userDb.getByEmail(employeeEmail);

    company = await companyDb.create({
      name: `History Co ${timestamp}`,
      description: 'Attestation history tests'
    });

    const createdHistoryAsset = await assetDb.create({
      employee_first_name: 'History',
      employee_last_name: 'Employee',
      employee_email: employeeUser.email,
      company_id: company.id,
      asset_type: 'Laptop',
      make: 'Dell',
      model: 'Latitude',
      serial_number: `HISTORY-SN-${timestamp}`,
      asset_tag: `HISTORY-TAG-${timestamp}`,
      status: 'active'
    });
    historyAsset = await assetDb.getById(createdHistoryAsset.id);

    const createdReturnedAsset = await assetDb.create({
      employee_first_name: 'History',
      employee_last_name: 'Employee',
      employee_email: employeeUser.email,
      company_id: company.id,
      asset_type: 'Monitor',
      make: 'LG',
      model: 'Ultrafine',
      serial_number: `RETURNED-SN-${timestamp}`,
      asset_tag: `RETURNED-TAG-${timestamp}`,
      status: 'returned',
      returned_date: '2026-01-10'
    });
    returnedAsset = await assetDb.getById(createdReturnedAsset.id);

    previousCampaign = await attestationCampaignDb.create({
      name: `Previous Campaign ${timestamp}`,
      description: 'Previous monthly certification',
      start_date: '2026-02-01T00:00:00.000Z',
      status: 'completed',
      reminder_days: 7,
      escalation_days: 10,
      created_by: employeeUser.id
    });

    previousRecord = await attestationRecordDb.create({
      campaign_id: previousCampaign.id,
      user_id: employeeUser.id,
      status: 'completed',
      started_at: '2026-02-05T10:00:00.000Z',
      completed_at: '2026-02-05T10:15:00.000Z'
    });

    await attestationAssetDb.create({
      attestation_record_id: previousRecord.id,
      asset_id: historyAsset.id,
      attested_status: 'returned',
      previous_status: 'active',
      returned_date: '2026-02-15',
      notes: 'Returned during February certification',
      attested_at: '2026-02-05T10:05:00.000Z'
    });

    currentCampaign = await attestationCampaignDb.create({
      name: `Current Campaign ${timestamp}`,
      description: 'Current monthly certification',
      start_date: '2026-03-01T00:00:00.000Z',
      status: 'active',
      reminder_days: 7,
      escalation_days: 10,
      created_by: employeeUser.id
    });

    currentRecord = await attestationRecordDb.create({
      campaign_id: currentCampaign.id,
      user_id: employeeUser.id,
      status: 'pending'
    });

    updateCampaign = await attestationCampaignDb.create({
      name: `Update Campaign ${timestamp}`,
      description: 'Update returned date test',
      start_date: '2026-04-01T00:00:00.000Z',
      status: 'active',
      reminder_days: 7,
      escalation_days: 10,
      created_by: employeeUser.id
    });

    updateRecord = await attestationRecordDb.create({
      campaign_id: updateCampaign.id,
      user_id: employeeUser.id,
      status: 'pending'
    });
  });

  afterAll(async () => {
    if (updateCampaign?.id) await attestationCampaignDb.delete(updateCampaign.id);
    if (currentCampaign?.id) await attestationCampaignDb.delete(currentCampaign.id);
    if (previousCampaign?.id) await attestationCampaignDb.delete(previousCampaign.id);
    if (historyAsset?.id) await assetDb.delete(historyAsset.id);
    if (returnedAsset?.id) await assetDb.delete(returnedAsset.id);
    if (employeeUser?.id) await userDb.delete(employeeUser.id);
    if (company?.id) await companyDb.delete(company.id);
  });

  it('returns the latest certification result for an asset when excluding the current record', async () => {
    const lastCertification = await attestationAssetDb.getLatestByAssetId(historyAsset.id, currentRecord.id);

    expect(lastCertification).toEqual(expect.objectContaining({
      asset_id: historyAsset.id,
      attested_status: 'returned',
      returned_date: '2026-02-15'
    }));
  });

  it('persists returned_date on the attestation record and updates the live asset when status stays returned', async () => {
    await attestationAssetDb.create({
      attestation_record_id: updateRecord.id,
      asset_id: returnedAsset.id,
      attested_status: 'returned',
      previous_status: returnedAsset.status,
      returned_date: '2026-02-20',
      notes: 'Confirmed returned again',
      attested_at: '2026-04-05T10:05:00.000Z'
    });
    await attestationRecordDb.update(updateRecord.id, {
      status: 'in_progress',
      started_at: '2026-04-05T10:00:00.000Z'
    });
    await assetDb.updateStatus(returnedAsset.id, 'returned', 'Confirmed returned again', '2026-02-20');

    const attestedAssets = await attestationAssetDb.getByRecordId(updateRecord.id);
    const persistedAttestation = attestedAssets.find(({ asset_id }) => asset_id === returnedAsset.id);
    const refreshedAsset = await assetDb.getById(returnedAsset.id);
    const refreshedRecord = await attestationRecordDb.getById(updateRecord.id);

    expect(persistedAttestation).toEqual(expect.objectContaining({
      asset_id: returnedAsset.id,
      attested_status: 'returned',
      returned_date: '2026-02-20'
    }));
    expect(refreshedAsset.returned_date).toBe('2026-02-20');
    expect(refreshedRecord.status).toBe('in_progress');
  });
});
