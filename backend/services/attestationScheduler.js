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
 * Run all scheduled tasks
 * This should be called periodically (e.g., daily via cron job or interval)
 */
export const runScheduledTasks = async () => {
  console.log('Running attestation scheduled tasks...');
  
  await processReminders();
  await processEscalations();
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
