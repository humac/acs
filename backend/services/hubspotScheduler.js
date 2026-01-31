import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { hubspotSettingsDb, hubspotSyncLogDb, companyDb, auditDb } from '../database.js';
import { syncCompaniesToACS } from '../hubspot.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger({ module: 'hubspot-scheduler' });

/**
 * HubSpot Sync Scheduler Service
 * Automatically syncs companies from HubSpot based on the configured sync_interval
 */

/**
 * Convert sync_interval setting to milliseconds
 * @param {string} syncInterval - 'hourly', 'daily', or 'weekly'
 * @returns {number} Interval in milliseconds
 */
export const getIntervalMs = (syncInterval) => {
  switch (syncInterval) {
    case 'hourly':
      return 60 * 60 * 1000; // 1 hour
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000; // 7 days
    case 'daily':
    default:
      return 24 * 60 * 60 * 1000; // 24 hours
  }
};

/**
 * Run a single HubSpot sync cycle
 * Checks settings, performs sync if enabled, and logs results
 */
export const runHubSpotSync = async () => {
  try {
    // Check if HubSpot sync is enabled
    const settings = await hubspotSettingsDb.get();

    if (!settings.enabled || !settings.auto_sync_enabled) {
      logger.debug('HubSpot auto-sync is disabled, skipping');
      return { success: true, skipped: true };
    }

    const accessToken = await hubspotSettingsDb.getAccessToken();

    if (!accessToken) {
      logger.warn('HubSpot access token is not configured, skipping auto-sync');
      return { success: true, skipped: true };
    }

    logger.info('Starting scheduled HubSpot sync');
    const syncStartedAt = new Date().toISOString();

    try {
      const result = await syncCompaniesToACS(accessToken, companyDb, auditDb, null);

      const syncCompletedAt = new Date().toISOString();

      // Log the sync
      await hubspotSyncLogDb.log({
        sync_started_at: syncStartedAt,
        sync_completed_at: syncCompletedAt,
        status: 'success',
        companies_found: result.companiesFound,
        companies_created: result.companiesCreated,
        companies_updated: result.companiesUpdated,
        error_message: result.errors.length > 0 ? JSON.stringify(result.errors) : null
      });

      // Update HubSpot settings with last sync info
      await hubspotSettingsDb.updateSyncStatus(
        'success',
        result.companiesCreated + result.companiesUpdated
      );

      logger.info({
        companiesFound: result.companiesFound,
        companiesCreated: result.companiesCreated,
        companiesUpdated: result.companiesUpdated,
        errors: result.errors.length
      }, 'Scheduled HubSpot sync completed');

      return { success: true, ...result };
    } catch (syncError) {
      const syncCompletedAt = new Date().toISOString();

      // Log the failed sync
      await hubspotSyncLogDb.log({
        sync_started_at: syncStartedAt,
        sync_completed_at: syncCompletedAt,
        status: 'error',
        companies_found: 0,
        companies_created: 0,
        companies_updated: 0,
        error_message: syncError.message
      });

      // Update HubSpot settings with last sync info
      await hubspotSettingsDb.updateSyncStatus('error', 0);

      logger.error({ err: syncError }, 'Scheduled HubSpot sync failed');
      return { success: false, error: syncError.message };
    }
  } catch (error) {
    logger.error({ err: error }, 'Error in HubSpot scheduler');
    return { success: false, error: error.message };
  }
};

/**
 * Schedule the next sync using setTimeout
 * Re-reads settings each cycle so interval changes take effect
 */
const scheduleNext = async () => {
  try {
    const settings = await hubspotSettingsDb.get();
    const intervalMs = getIntervalMs(settings.sync_interval);

    logger.debug({ interval: settings.sync_interval, intervalMs }, 'Scheduling next HubSpot sync');

    setTimeout(async () => {
      await runHubSpotSync();
      scheduleNext();
    }, intervalMs);
  } catch (error) {
    // If we can't read settings, default to daily and retry
    logger.error({ err: error }, 'Failed to read settings for scheduling, defaulting to daily');
    setTimeout(async () => {
      await runHubSpotSync();
      scheduleNext();
    }, 24 * 60 * 60 * 1000);
  }
};

const isDirectRun = (() => {
  if (!process.argv[1]) return false;
  try {
    return fileURLToPath(import.meta.url) === resolve(process.argv[1]);
  } catch {
    return false;
  }
})();

// If running as a standalone process, run sync immediately then schedule
if (process.env.RUN_HUBSPOT_SCHEDULER === 'true' || isDirectRun) {
  // Run immediately on start
  runHubSpotSync().then(() => {
    // Then schedule subsequent runs based on interval
    scheduleNext();
  });

  logger.info('HubSpot scheduler started');
}
