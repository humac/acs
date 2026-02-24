/**
 * HubSpot Scheduler Tests
 *
 * Unit tests for the HubSpot sync scheduler service.
 * Tests verify sync execution, settings checks, logging, and interval calculation.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock database modules
const mockHubspotSettingsDb = {
  get: jest.fn(),
  getAccessToken: jest.fn(),
  updateSyncStatus: jest.fn()
};

const mockHubspotSyncLogDb = {
  log: jest.fn()
};

const mockCompanyDb = {};
const mockAuditDb = {};

// Mock sync function
const mockSyncCompaniesToACS = jest.fn();

// Setup module mocks
jest.unstable_mockModule('./database.js', () => ({
  hubspotSettingsDb: mockHubspotSettingsDb,
  hubspotSyncLogDb: mockHubspotSyncLogDb,
  companyDb: mockCompanyDb,
  auditDb: mockAuditDb
}));

jest.unstable_mockModule('./hubspot.js', () => ({
  syncCompaniesToACS: mockSyncCompaniesToACS
}));

// Import module under test
const { runHubSpotSync, getIntervalMs, shouldSyncNow } = await import('./services/hubspotScheduler.js');

describe('HubSpot Scheduler - getIntervalMs()', () => {
  it('should return 1 hour for hourly', () => {
    expect(getIntervalMs('hourly')).toBe(60 * 60 * 1000);
  });

  it('should return 24 hours for daily', () => {
    expect(getIntervalMs('daily')).toBe(24 * 60 * 60 * 1000);
  });

  it('should return 7 days for weekly', () => {
    expect(getIntervalMs('weekly')).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('should default to 24 hours for unknown values', () => {
    expect(getIntervalMs('unknown')).toBe(24 * 60 * 60 * 1000);
    expect(getIntervalMs(undefined)).toBe(24 * 60 * 60 * 1000);
  });
});

describe('HubSpot Scheduler - runHubSpotSync()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should sync when enabled, auto_sync_enabled, and access token configured', async () => {
    mockHubspotSettingsDb.get.mockResolvedValue({
      enabled: 1,
      auto_sync_enabled: 1,
      sync_interval: 'daily'
    });
    mockHubspotSettingsDb.getAccessToken.mockResolvedValue('test-token-123');
    mockSyncCompaniesToACS.mockResolvedValue({
      companiesFound: 10,
      companiesCreated: 3,
      companiesUpdated: 2,
      errors: []
    });

    const result = await runHubSpotSync();

    expect(result.success).toBe(true);
    expect(result.skipped).toBeUndefined();
    expect(mockSyncCompaniesToACS).toHaveBeenCalledWith(
      'test-token-123',
      mockCompanyDb,
      mockAuditDb,
      null
    );
    expect(mockHubspotSyncLogDb.log).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        companies_found: 10,
        companies_created: 3,
        companies_updated: 2,
        error_message: null
      })
    );
    expect(mockHubspotSettingsDb.updateSyncStatus).toHaveBeenCalledWith('success', 5);
  });

  it('should skip when enabled is false', async () => {
    mockHubspotSettingsDb.get.mockResolvedValue({
      enabled: 0,
      auto_sync_enabled: 1,
      sync_interval: 'daily'
    });

    const result = await runHubSpotSync();

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(mockSyncCompaniesToACS).not.toHaveBeenCalled();
    expect(mockHubspotSyncLogDb.log).not.toHaveBeenCalled();
  });

  it('should skip when auto_sync_enabled is false', async () => {
    mockHubspotSettingsDb.get.mockResolvedValue({
      enabled: 1,
      auto_sync_enabled: 0,
      sync_interval: 'daily'
    });

    const result = await runHubSpotSync();

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(mockSyncCompaniesToACS).not.toHaveBeenCalled();
    expect(mockHubspotSyncLogDb.log).not.toHaveBeenCalled();
  });

  it('should skip when no access token is configured', async () => {
    mockHubspotSettingsDb.get.mockResolvedValue({
      enabled: 1,
      auto_sync_enabled: 1,
      sync_interval: 'daily'
    });
    mockHubspotSettingsDb.getAccessToken.mockResolvedValue(null);

    const result = await runHubSpotSync();

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(mockSyncCompaniesToACS).not.toHaveBeenCalled();
    expect(mockHubspotSyncLogDb.log).not.toHaveBeenCalled();
  });

  it('should log sync errors and update status on failure', async () => {
    mockHubspotSettingsDb.get.mockResolvedValue({
      enabled: 1,
      auto_sync_enabled: 1,
      sync_interval: 'daily'
    });
    mockHubspotSettingsDb.getAccessToken.mockResolvedValue('test-token-123');
    mockSyncCompaniesToACS.mockRejectedValue(new Error('HubSpot API error: Unauthorized'));

    const result = await runHubSpotSync();

    expect(result.success).toBe(false);
    expect(result.error).toBe('HubSpot API error: Unauthorized');
    expect(mockHubspotSyncLogDb.log).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        companies_found: 0,
        companies_created: 0,
        companies_updated: 0,
        error_message: 'HubSpot API error: Unauthorized'
      })
    );
    expect(mockHubspotSettingsDb.updateSyncStatus).toHaveBeenCalledWith('error', 0);
  });

  it('should log partial errors in error_message when some companies fail', async () => {
    mockHubspotSettingsDb.get.mockResolvedValue({
      enabled: 1,
      auto_sync_enabled: 1,
      sync_interval: 'hourly'
    });
    mockHubspotSettingsDb.getAccessToken.mockResolvedValue('test-token-123');

    const partialErrors = [
      { company_id: '123', company_name: 'Bad Corp', error: 'Duplicate name' }
    ];
    mockSyncCompaniesToACS.mockResolvedValue({
      companiesFound: 5,
      companiesCreated: 3,
      companiesUpdated: 1,
      errors: partialErrors
    });

    const result = await runHubSpotSync();

    expect(result.success).toBe(true);
    expect(mockHubspotSyncLogDb.log).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        companies_found: 5,
        companies_created: 3,
        companies_updated: 1,
        error_message: JSON.stringify(partialErrors)
      })
    );
  });

  it('should handle settings read failure gracefully', async () => {
    mockHubspotSettingsDb.get.mockRejectedValue(new Error('Database connection failed'));

    const result = await runHubSpotSync();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database connection failed');
    expect(mockSyncCompaniesToACS).not.toHaveBeenCalled();
  });
});

describe('HubSpot Scheduler - shouldSyncNow()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sync immediately when no previous sync exists', async () => {
    mockHubspotSettingsDb.get.mockResolvedValue({
      sync_interval: 'weekly',
      last_sync: null
    });

    const result = await shouldSyncNow();

    expect(result.shouldSync).toBe(true);
    expect(result.delayMs).toBe(0);
  });

  it('should sync immediately when interval has fully elapsed', async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    mockHubspotSettingsDb.get.mockResolvedValue({
      sync_interval: 'weekly',
      last_sync: eightDaysAgo
    });

    const result = await shouldSyncNow();

    expect(result.shouldSync).toBe(true);
    expect(result.delayMs).toBe(0);
  });

  it('should not sync when interval has not elapsed and return remaining delay', async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    mockHubspotSettingsDb.get.mockResolvedValue({
      sync_interval: 'weekly',
      last_sync: twoHoursAgo
    });

    const result = await shouldSyncNow();

    expect(result.shouldSync).toBe(false);
    // Weekly = 7 days, 2 hours elapsed, so ~6 days 22 hours remaining
    const expectedDelay = 7 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000;
    // Allow 5 seconds of tolerance for test execution time
    expect(result.delayMs).toBeGreaterThan(expectedDelay - 5000);
    expect(result.delayMs).toBeLessThanOrEqual(expectedDelay);
  });

  it('should respect hourly interval', async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    mockHubspotSettingsDb.get.mockResolvedValue({
      sync_interval: 'hourly',
      last_sync: thirtyMinutesAgo
    });

    const result = await shouldSyncNow();

    expect(result.shouldSync).toBe(false);
    // Hourly = 60 min, 30 min elapsed, ~30 min remaining
    const expectedDelay = 60 * 60 * 1000 - 30 * 60 * 1000;
    expect(result.delayMs).toBeGreaterThan(expectedDelay - 5000);
    expect(result.delayMs).toBeLessThanOrEqual(expectedDelay);
  });

  it('should sync when exactly at interval boundary', async () => {
    const exactlyOneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    mockHubspotSettingsDb.get.mockResolvedValue({
      sync_interval: 'daily',
      last_sync: exactlyOneDayAgo
    });

    const result = await shouldSyncNow();

    expect(result.shouldSync).toBe(true);
    expect(result.delayMs).toBe(0);
  });
});
