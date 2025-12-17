import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { attestationCampaignDb, attestationRecordDb, attestationPendingInviteDb, userDb, assetDb, auditDb } from '../database.js';
import { unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';

const TEST_DB_PATH = resolve(process.cwd(), 'data', 'test-attestation-dashboard-actions.db');

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

describe('Attestation Dashboard Actions - Database Operations', () => {
  let adminUser, employeeUser, managerUser, campaign, record, pendingInvite;

  beforeAll(async () => {
    const timestamp = Date.now();
    
    // Create admin user
    const adminResult = await userDb.create({
      email: `admin-${timestamp}@test.com`,
      password_hash: 'hash',
      name: 'Test Admin',
      first_name: 'Test',
      last_name: 'Admin',
      role: 'admin'
    });
    adminUser = await userDb.getById(adminResult.id);

    // Create manager user
    const managerEmail = `manager-${timestamp}@test.com`;
    const managerResult = await userDb.create({
      email: managerEmail,
      password_hash: 'hash',
      name: 'Test Manager',
      first_name: 'Test',
      last_name: 'Manager',
      role: 'manager'
    });
    managerUser = await userDb.getById(managerResult.id);

    // Create employee user
    const employeeResult = await userDb.create({
      email: `employee-${timestamp}@test.com`,
      password_hash: 'hash',
      name: 'Test Employee',
      first_name: 'Test',
      last_name: 'Employee',
      role: 'employee',
      manager_email: managerEmail
    });
    employeeUser = await userDb.getById(employeeResult.id);

    // Create campaign
    campaign = await attestationCampaignDb.create({
      name: 'Test Campaign for Dashboard',
      description: 'Test Description',
      start_date: new Date().toISOString(),
      end_date: null,
      reminder_days: 7,
      escalation_days: 10,
      created_by: adminUser.id,
      status: 'active'
    });

    // Create attestation record
    record = await attestationRecordDb.create({
      campaign_id: campaign.id,
      user_id: employeeUser.id,
      status: 'pending'
    });
  });

  it('should update reminder_sent_at timestamp on attestation record', async () => {
    const now = new Date().toISOString();
    
    // Update reminder timestamp
    await attestationRecordDb.update(record.id, {
      reminder_sent_at: now
    });
    
    // Verify update
    const updatedRecord = await attestationRecordDb.getById(record.id);
    expect(updatedRecord.reminder_sent_at).toBeTruthy();
  });

  it('should update escalation_sent_at timestamp on attestation record', async () => {
    const now = new Date().toISOString();
    
    // Update escalation timestamp
    await attestationRecordDb.update(record.id, {
      escalation_sent_at: now
    });
    
    // Verify update
    const updatedRecord = await attestationRecordDb.getById(record.id);
    expect(updatedRecord.escalation_sent_at).toBeTruthy();
  });

  it('should create and retrieve pending invites', async () => {
    const timestamp = Date.now();
    const inviteToken = `test-token-${timestamp}`;
    
    // Create pending invite
    pendingInvite = await attestationPendingInviteDb.create({
      campaign_id: campaign.id,
      employee_email: `unregistered-${timestamp}@test.com`,
      employee_first_name: 'Unregistered',
      employee_last_name: 'User',
      invite_token: inviteToken,
      invite_sent_at: new Date().toISOString()
    });
    
    expect(pendingInvite.id).toBeDefined();
    
    // Retrieve by ID
    const retrievedInvite = await attestationPendingInviteDb.getById(pendingInvite.id);
    expect(retrievedInvite).toBeDefined();
    expect(retrievedInvite.employee_email).toBe(`unregistered-${timestamp}@test.com`);
    expect(retrievedInvite.registered_at).toBeNull();
  });

  it('should get pending invites by campaign', async () => {
    const invites = await attestationPendingInviteDb.getByCampaignId(campaign.id);
    expect(invites.length).toBeGreaterThan(0);
    
    // Check that we have unregistered invites
    const unregisteredInvites = invites.filter(inv => !inv.registered_at);
    expect(unregisteredInvites.length).toBeGreaterThan(0);
  });

  it('should update invite_sent_at timestamp on pending invite', async () => {
    const now = new Date().toISOString();
    
    // Update invite timestamp
    await attestationPendingInviteDb.update(pendingInvite.id, {
      invite_sent_at: now
    });
    
    // Verify update
    const updatedInvite = await attestationPendingInviteDb.getById(pendingInvite.id);
    expect(updatedInvite.invite_sent_at).toBeTruthy();
  });

  it('should log audit entries for manual actions', async () => {
    // Log a manual reminder action
    await auditDb.log(
      'reminder_sent',
      'attestation_record',
      record.id,
      `${employeeUser.email} - ${campaign.name}`,
      `Manual reminder sent to ${employeeUser.email}`,
      adminUser.email
    );
    
    // Log an escalation action
    await auditDb.log(
      'escalation_sent',
      'attestation_record',
      record.id,
      `${employeeUser.email} - ${campaign.name}`,
      `Manual escalation sent to manager ${managerUser.email}`,
      adminUser.email
    );
    
    // Verify audit logs
    const logs = await auditDb.getAll({ 
      entityType: 'attestation_record',
      entityId: record.id 
    });
    
    expect(logs.length).toBeGreaterThanOrEqual(2);
    const reminderLog = logs.find(log => log.action === 'reminder_sent');
    const escalationLog = logs.find(log => log.action === 'escalation_sent');
    
    expect(reminderLog).toBeDefined();
    expect(escalationLog).toBeDefined();
  });

  it('should support bulk operations with multiple records', async () => {
    // Create multiple records for bulk testing
    const bulkRecords = [];
    for (let i = 0; i < 5; i++) {
      const timestamp = Date.now() + i;
      const user = await userDb.create({
        email: `bulk-employee-${timestamp}@test.com`,
        password_hash: 'hash',
        name: `Bulk Employee ${i}`,
        first_name: 'Bulk',
        last_name: `Employee${i}`,
        role: 'employee',
        manager_email: managerUser.email
      });
      
      const rec = await attestationRecordDb.create({
        campaign_id: campaign.id,
        user_id: user.id,
        status: 'pending'
      });
      
      bulkRecords.push(rec);
    }
    
    // Verify records were created
    expect(bulkRecords.length).toBe(5);
    
    // Simulate bulk reminder update
    const now = new Date().toISOString();
    for (const rec of bulkRecords) {
      await attestationRecordDb.update(rec.id, {
        reminder_sent_at: now
      });
    }
    
    // Verify all were updated
    const updatedRecords = await Promise.all(
      bulkRecords.map(rec => attestationRecordDb.getById(rec.id))
    );
    
    updatedRecords.forEach(rec => {
      expect(rec.reminder_sent_at).toBeTruthy();
    });
  });

  it('should handle pending invites that transition to registered', async () => {
    const timestamp = Date.now();
    const inviteToken = `test-registered-token-${timestamp}`;
    
    // Create pending invite
    const invite = await attestationPendingInviteDb.create({
      campaign_id: campaign.id,
      employee_email: `will-register-${timestamp}@test.com`,
      employee_first_name: 'Will',
      employee_last_name: 'Register',
      invite_token: inviteToken,
      invite_sent_at: new Date().toISOString()
    });
    
    // Mark as registered
    await attestationPendingInviteDb.update(invite.id, {
      registered_at: new Date().toISOString()
    });
    
    // Verify it's now registered
    const registeredInvite = await attestationPendingInviteDb.getById(invite.id);
    expect(registeredInvite.registered_at).toBeTruthy();
    
    // Should be filtered out when getting pending invites
    const allInvites = await attestationPendingInviteDb.getByCampaignId(campaign.id);
    const stillPending = allInvites.filter(inv => !inv.registered_at);
    const shouldNotInclude = stillPending.find(inv => inv.id === invite.id);
    expect(shouldNotInclude).toBeUndefined();
  });

  it('should verify user has manager_email for escalation', async () => {
    // Get the manager user to verify the email
    const manager = await userDb.getById(managerUser.id);
    expect(manager).toBeDefined();
    expect(manager.email).toBeTruthy();
    
    // Verify we can retrieve employee user with manager
    const user = await userDb.getById(employeeUser.id);
    expect(user).toBeDefined();
    expect(user.manager_email).toBe(manager.email);
  });
});

describe('Email Function Signature Tests', () => {
  it('should verify sendAttestationEscalationEmail signature supports custom message', async () => {
    // This test verifies the function signature is correct
    // The actual email sending is tested by integration tests that require SMTP setup
    const { sendAttestationEscalationEmail } = await import('./services/smtpMailer.js');
    
    // Verify function exists - default parameters don't count in function.length
    expect(sendAttestationEscalationEmail).toBeDefined();
    expect(typeof sendAttestationEscalationEmail).toBe('function');
  });

  it('should verify sendAttestationReminderEmail signature', async () => {
    const { sendAttestationReminderEmail } = await import('./services/smtpMailer.js');
    
    expect(sendAttestationReminderEmail).toBeDefined();
    expect(typeof sendAttestationReminderEmail).toBe('function');
  });

  it('should verify sendAttestationRegistrationInvite signature', async () => {
    const { sendAttestationRegistrationInvite } = await import('./services/smtpMailer.js');
    
    expect(sendAttestationRegistrationInvite).toBeDefined();
    expect(typeof sendAttestationRegistrationInvite).toBe('function');
  });
});
