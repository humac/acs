import { attestationCampaignDb, attestationRecordDb, userDb } from '../database.js';
import { sendAttestationReminderEmail, sendAttestationEscalationEmail } from './smtpMailer.js';

/**
 * Attestation Scheduler Service
 * Processes automated reminders and escalations for attestation campaigns
 */

/**
 * Process reminders for active campaigns
 * Checks if reminder_days has passed since campaign start and sends emails to non-completed employees
 */
export const processReminders = async () => {
  try {
    const campaigns = await attestationCampaignDb.getAll();
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    
    for (const campaign of activeCampaigns) {
      const startDate = new Date(campaign.start_date);
      const now = new Date();
      const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      
      // Check if it's time to send reminders
      if (daysSinceStart >= campaign.reminder_days) {
        const records = await attestationRecordDb.getByCampaignId(campaign.id);
        
        // Find pending records that haven't received a reminder yet
        const pendingRecords = records.filter(r => 
          r.status === 'pending' && !r.reminder_sent_at
        );
        
        for (const record of pendingRecords) {
          const user = await userDb.getById(record.user_id);
          if (user && user.email) {
            const attestationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-attestations`;
            
            const result = await sendAttestationReminderEmail(user.email, campaign, attestationUrl);
            
            if (result.success) {
              // Mark reminder as sent
              await attestationRecordDb.update(record.id, {
                reminder_sent_at: new Date().toISOString()
              });
              console.log(`Reminder sent to ${user.email} for campaign ${campaign.name}`);
            }
          }
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error processing attestation reminders:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process escalations for active campaigns
 * Checks if escalation_days has passed since campaign start and sends emails to managers
 */
export const processEscalations = async () => {
  try {
    const campaigns = await attestationCampaignDb.getAll();
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    
    for (const campaign of activeCampaigns) {
      const startDate = new Date(campaign.start_date);
      const now = new Date();
      const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      
      // Check if it's time to send escalations
      if (daysSinceStart >= campaign.escalation_days) {
        const records = await attestationRecordDb.getByCampaignId(campaign.id);
        
        // Find pending records that haven't received an escalation yet
        const pendingRecords = records.filter(r => 
          r.status === 'pending' && !r.escalation_sent_at
        );
        
        for (const record of pendingRecords) {
          const user = await userDb.getById(record.user_id);
          if (user && user.email && user.manager_email) {
            const employeeName = `${user.first_name} ${user.last_name}`.trim() || user.name;
            
            const result = await sendAttestationEscalationEmail(
              user.manager_email,
              employeeName,
              user.email,
              campaign
            );
            
            if (result.success) {
              // Mark escalation as sent
              await attestationRecordDb.update(record.id, {
                escalation_sent_at: new Date().toISOString()
              });
              console.log(`Escalation sent to ${user.manager_email} for employee ${user.email} in campaign ${campaign.name}`);
            }
          }
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error processing attestation escalations:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Auto-close expired campaigns
 * Checks if end_date has passed and updates status to 'completed'
 */
export const autoCloseExpiredCampaigns = async () => {
  try {
    const campaigns = await attestationCampaignDb.getAll();
    const activeCampaigns = campaigns.filter(c => c.status === 'active' && c.end_date);
    
    const now = new Date();
    
    for (const campaign of activeCampaigns) {
      const endDate = new Date(campaign.end_date);
      
      if (now > endDate) {
        await attestationCampaignDb.update(campaign.id, {
          status: 'completed'
        });
        console.log(`Campaign ${campaign.name} auto-closed (expired)`);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error auto-closing expired campaigns:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process reminders for unregistered asset owners
 * Sends reminder emails to unregistered owners based on unregistered_reminder_days
 */
export const processUnregisteredReminders = async () => {
  try {
    const { attestationPendingInviteDb, oidcSettingsDb, assetDb } = await import('../database.js');
    const { sendAttestationUnregisteredReminder } = await import('./smtpMailer.js');
    
    const campaigns = await attestationCampaignDb.getAll();
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    
    // Get OIDC settings once
    const oidcSettings = await oidcSettingsDb.get();
    const ssoEnabled = oidcSettings?.enabled || false;
    const ssoButtonText = oidcSettings?.button_text || 'Sign In with SSO';
    
    for (const campaign of activeCampaigns) {
      const startDate = new Date(campaign.start_date);
      const now = new Date();
      const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      
      const reminderDays = campaign.unregistered_reminder_days || 7;
      
      // Check if it's time to send unregistered reminders
      if (daysSinceStart >= reminderDays) {
        const pendingInvites = await attestationPendingInviteDb.getByCampaignId(campaign.id);
        
        // Find invites that haven't been reminded yet and are still unregistered
        const invitesNeedingReminder = pendingInvites.filter(invite => 
          !invite.registered_at && !invite.reminder_sent_at
        );
        
        for (const invite of invitesNeedingReminder) {
          // Get asset count for this employee
          const assets = await assetDb.getByEmployee(invite.employee_email);
          const assetCount = assets.length;
          
          const result = await sendAttestationUnregisteredReminder(
            invite.employee_email,
            invite.employee_first_name,
            invite.employee_last_name,
            campaign,
            invite.invite_token,
            assetCount,
            ssoEnabled,
            ssoButtonText
          );
          
          if (result.success) {
            await attestationPendingInviteDb.update(invite.id, {
              reminder_sent_at: new Date().toISOString()
            });
            console.log(`Unregistered reminder sent to ${invite.employee_email} for campaign ${campaign.name}`);
          }
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error processing unregistered reminders:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process escalations for unregistered asset owners
 * Notifies managers about unregistered team members
 */
export const processUnregisteredEscalations = async () => {
  try {
    const { attestationPendingInviteDb, assetDb } = await import('../database.js');
    const { sendAttestationUnregisteredEscalation } = await import('./smtpMailer.js');
    
    const campaigns = await attestationCampaignDb.getAll();
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    
    for (const campaign of activeCampaigns) {
      const startDate = new Date(campaign.start_date);
      const now = new Date();
      const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      
      // Use escalation_days for unregistered escalation too
      if (daysSinceStart >= campaign.escalation_days) {
        const pendingInvites = await attestationPendingInviteDb.getByCampaignId(campaign.id);
        
        // Find invites that haven't been escalated yet and are still unregistered
        const invitesNeedingEscalation = pendingInvites.filter(invite => 
          !invite.registered_at && !invite.escalation_sent_at
        );
        
        for (const invite of invitesNeedingEscalation) {
          // Get assets to find manager info
          const assets = await assetDb.getByEmployee(invite.employee_email);
          if (assets.length === 0) continue;
          
          const assetCount = assets.length;
          
          // Get manager from first asset (they should all have same manager)
          const managerEmail = assets[0].manager_email;
          if (!managerEmail) continue;
          
          const managerName = `${assets[0].manager_first_name || ''} ${assets[0].manager_last_name || ''}`.trim();
          const employeeName = `${invite.employee_first_name || ''} ${invite.employee_last_name || ''}`.trim() || invite.employee_email;
          
          const result = await sendAttestationUnregisteredEscalation(
            managerEmail,
            managerName,
            invite.employee_email,
            employeeName,
            campaign,
            assetCount
          );
          
          if (result.success) {
            await attestationPendingInviteDb.update(invite.id, {
              escalation_sent_at: new Date().toISOString()
            });
            console.log(`Unregistered escalation sent to ${managerEmail} for employee ${invite.employee_email} in campaign ${campaign.name}`);
          }
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error processing unregistered escalations:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Run all scheduled tasks
 * This should be called periodically (e.g., daily via cron job or interval)
 */
export const runScheduledTasks = async () => {
  console.log('Running attestation scheduled tasks...');
  
  await processReminders();
  await processEscalations();
  await processUnregisteredReminders();
  await processUnregisteredEscalations();
  await autoCloseExpiredCampaigns();
  
  console.log('Attestation scheduled tasks completed');
};

// If running as a standalone process, run tasks every 24 hours
if (process.env.RUN_ATTESTATION_SCHEDULER === 'true') {
  const INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  
  // Run immediately on start
  runScheduledTasks();
  
  // Then run every 24 hours
  setInterval(runScheduledTasks, INTERVAL);
  
  console.log('Attestation scheduler started (24-hour interval)');
}
