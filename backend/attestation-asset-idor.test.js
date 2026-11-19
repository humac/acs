/**
 * Regression: PUT /api/attestation/records/:id/assets/:assetId must only let a
 * user attest assets that belong to their own attestation record.
 *
 * Previously the route checked that the record belonged to the caller but not
 * that the asset did, so any employee with an attestation record could change
 * the status (and notes) of any asset by ID.
 */
import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import {
  assetDb,
  auditDb,
  companyDb,
  userDb,
  oidcSettingsDb,
  attestationAssetDb,
  attestationCampaignDb,
  attestationNewAssetDb,
  attestationPendingInviteDb,
  attestationRecordDb,
  sanitizeDateValue
} from './database.js';
import { authenticate, authorize, generateToken } from './auth.js';
import createAttestationRouter from './routes/attestation.js';

describe('Attestation asset IDOR', () => {
  const ts = Date.now();
  let app;
  let attackerToken;
  let attackerRecord;
  let ownAsset;
  let victimAsset;
  let attacker;

  const createUser = async (label) => {
    const email = `idor-${label}-${ts}@test.com`;
    await userDb.create({ email, name: label, password_hash: 'hash', role: 'employee', first_name: label, last_name: 'User' });
    return userDb.getByEmail(email);
  };

  const createAsset = async (owner, serial, companyName = `IDOR Co ${ts}`) => {
    const company = await companyDb.getByName(companyName);
    const created = await assetDb.create({
      employee_first_name: owner.first_name,
      employee_last_name: 'User',
      employee_email: owner.email,
      company_id: company.id,
      asset_type: 'Laptop',
      make: 'Dell',
      model: 'Latitude',
      serial_number: `${serial}-${ts}`,
      asset_tag: `${serial}-TAG-${ts}`,
      status: 'active'
    });
    return assetDb.getById(created.id);
  };

  beforeAll(async () => {
    await assetDb.init();

    app = express();
    app.use(express.json());
    app.use('/api/attestation', createAttestationRouter({
      attestationCampaignDb,
      attestationRecordDb,
      attestationAssetDb,
      attestationNewAssetDb,
      attestationPendingInviteDb,
      userDb,
      assetDb,
      companyDb,
      auditDb,
      oidcSettingsDb,
      authenticate,
      authorize,
      sanitizeDateValue
    }));

    await companyDb.create({ name: `IDOR Co ${ts}`, description: 'IDOR tests' });

    attacker = await createUser('attacker');
    const victim = await createUser('victim');
    attackerToken = generateToken(attacker);

    ownAsset = await createAsset(attacker, 'OWN');
    victimAsset = await createAsset(victim, 'VICTIM');

    const campaign = await attestationCampaignDb.create({
      name: `IDOR Campaign ${ts}`,
      description: 'IDOR regression',
      start_date: '2026-05-01T00:00:00.000Z',
      status: 'active',
      reminder_days: 7,
      escalation_days: 10,
      created_by: attacker.id
    });

    attackerRecord = await attestationRecordDb.create({
      campaign_id: campaign.id,
      user_id: attacker.id,
      status: 'pending'
    });
  });

  it('rejects attesting an asset owned by someone else and leaves it unchanged', async () => {
    const res = await request(app)
      .put(`/api/attestation/records/${attackerRecord.id}/assets/${victimAsset.id}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({ attested_status: 'lost', notes: 'tampered' });

    expect(res.status).toBe(403);

    const after = await assetDb.getById(victimAsset.id);
    expect(after.status).toBe('active');
    expect(after.notes || '').not.toContain('tampered');

    const attested = await attestationAssetDb.getByRecordId(attackerRecord.id);
    expect(attested.some((a) => a.asset_id === victimAsset.id)).toBe(false);
  });

  it('rejects an invalid attested_status', async () => {
    const res = await request(app)
      .put(`/api/attestation/records/${attackerRecord.id}/assets/${ownAsset.id}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({ attested_status: 'stolen-by-me' });

    expect(res.status).toBe(400);
    const after = await assetDb.getById(ownAsset.id);
    expect(after.status).toBe('active');
  });

  it('still allows attesting the caller\'s own asset', async () => {
    const res = await request(app)
      .put(`/api/attestation/records/${attackerRecord.id}/assets/${ownAsset.id}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({ attested_status: 'damaged', notes: 'Cracked screen' });

    expect(res.status).toBe(200);
    const after = await assetDb.getById(ownAsset.id);
    expect(after.status).toBe('damaged');
  });

  const certify = (assetId, body, recordId = attackerRecord.id) => request(app)
    .put(`/api/attestation/records/${recordId}/assets/${assetId}`)
    .set('Authorization', `Bearer ${attackerToken}`)
    .send(body);

  describe('status handling', () => {
    it('accepts an unchanged legacy mixed-case status without rewriting it', async () => {
      const legacy = await createAsset(attacker, 'LEGACY-CASE');
      await assetDb.updateStatus(legacy.id, 'Active', '');

      const res = await certify(legacy.id, { attested_status: 'Active' });
      expect(res.status).toBe(200);
      expect((await assetDb.getById(legacy.id)).status).toBe('Active');
    });

    it.each([null, undefined, ''])('treats a missing status (%p) as unchanged', async (status) => {
      const asset = await createAsset(attacker, `NO-STATUS-${String(status)}`);
      const res = await certify(asset.id, status === undefined ? {} : { attested_status: status });
      expect(res.status).toBe(200);
      expect((await assetDb.getById(asset.id)).status).toBe('active');
      const attested = await attestationAssetDb.getByRecordId(attackerRecord.id);
      expect(attested.find((a) => a.asset_id === asset.id)?.attested_status).toBe('active');
    });

    it('accepts a status change in any case and stores it normalized', async () => {
      const asset = await createAsset(attacker, 'CASE-CHANGE');
      const res = await certify(asset.id, { attested_status: 'LOST' });
      expect(res.status).toBe(200);
      expect((await assetDb.getById(asset.id)).status).toBe('lost');
    });

    it('rejects a non-string status', async () => {
      const res = await certify(ownAsset.id, { attested_status: { $ne: 'x' } });
      expect(res.status).toBe(400);
    });
  });

  it('rejects an owned asset outside the campaign company scope', async () => {
    await companyDb.create({ name: `IDOR Other Co ${ts}`, description: 'Out of scope' });
    const inScope = await companyDb.getByName(`IDOR Co ${ts}`);
    const outOfScopeAsset = await createAsset(attacker, 'OUT-OF-SCOPE', `IDOR Other Co ${ts}`);

    const scopedCampaign = await attestationCampaignDb.create({
      name: `IDOR Scoped Campaign ${ts}`,
      description: 'Company-scoped',
      start_date: '2026-05-01T00:00:00.000Z',
      status: 'active',
      reminder_days: 7,
      escalation_days: 10,
      created_by: attacker.id,
      target_type: 'companies',
      target_company_ids: JSON.stringify([inScope.id])
    });
    const scopedRecord = await attestationRecordDb.create({
      campaign_id: scopedCampaign.id,
      user_id: attacker.id,
      status: 'pending'
    });

    const res = await certify(outOfScopeAsset.id, { attested_status: 'lost' }, scopedRecord.id);
    expect(res.status).toBe(403);
    expect((await assetDb.getById(outOfScopeAsset.id)).status).toBe('active');
  });

  it('allows re-attesting the same asset within the same record', async () => {
    const res = await request(app)
      .put(`/api/attestation/records/${attackerRecord.id}/assets/${ownAsset.id}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({ attested_status: 'active' });

    expect(res.status).toBe(200);
    const after = await assetDb.getById(ownAsset.id);
    expect(after.status).toBe('active');
  });
});
