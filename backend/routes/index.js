/**
 * Routes Index
 * Centralizes route mounting and dependency injection
 */

import createCompaniesRouter from './companies.js';
import createAuditRouter from './audit.js';
import createAssetsRouter from './assets.js';
import createReportsRouter from './reports.js';
import createAdminRouter from './admin.js';
import createAttestationRouter from './attestation.js';

/**
 * Mount all route modules on the Express app
 * @param {Object} app - Express application
 * @param {Object} deps - Shared dependencies
 */
export function mountRoutes(app, deps) {
  // Assets routes
  const assetsDeps = {
    assetDb: deps.assetDb,
    userDb: deps.userDb,
    companyDb: deps.companyDb,
    auditDb: deps.auditDb,
    assetTypeDb: deps.assetTypeDb,
    authenticate: deps.authenticate,
    authorize: deps.authorize,
    upload: deps.upload,
    parseCSVFile: deps.parseCSVFile,
    syncAssetOwnership: deps.syncAssetOwnership,
  };
  const assetsRouter = createAssetsRouter(assetsDeps);
  app.use('/api/assets', assetsRouter);

  // Stats route (standalone endpoint for dashboard)
  app.get('/api/stats', deps.authenticate, async (req, res) => {
    try {
      const assets = await deps.assetDb.getAll();
      const users = await deps.userDb.getAll();
      const companies = await deps.companyDb.getAll();
      res.json({
        assetsCount: assets.length,
        employeesCount: users.length,
        companiesCount: companies.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Companies routes
  const companiesRouter = createCompaniesRouter({
    companyDb: deps.companyDb,
    auditDb: deps.auditDb,
    authenticate: deps.authenticate,
    authorize: deps.authorize,
    upload: deps.upload,
    parseCSVFile: deps.parseCSVFile,
  });
  app.use('/api/companies', companiesRouter);

  // Audit routes
  const auditRouter = createAuditRouter({
    auditDb: deps.auditDb,
    userDb: deps.userDb,
    authenticate: deps.authenticate,
    authorize: deps.authorize,
  });
  app.use('/api/audit', auditRouter);

  // Reports routes
  const reportsRouter = createReportsRouter({
    userDb: deps.userDb,
    assetDb: deps.assetDb,
    auditDb: deps.auditDb,
    assetTypeDb: deps.assetTypeDb,
    attestationCampaignDb: deps.attestationCampaignDb,
    attestationRecordDb: deps.attestationRecordDb,
    authenticate: deps.authenticate,
    authorize: deps.authorize,
  });
  app.use('/api/reports', reportsRouter);

  // Admin routes
  const adminRouter = createAdminRouter({
    // Database
    auditDb: deps.auditDb,
    oidcSettingsDb: deps.oidcSettingsDb,
    brandingSettingsDb: deps.brandingSettingsDb,
    passkeySettingsDb: deps.passkeySettingsDb,
    databaseSettings: deps.databaseSettings,
    databaseEngine: deps.databaseEngine,
    importSqliteDatabase: deps.importSqliteDatabase,
    hubspotSettingsDb: deps.hubspotSettingsDb,
    hubspotSyncLogDb: deps.hubspotSyncLogDb,
    smtpSettingsDb: deps.smtpSettingsDb,
    emailTemplateDb: deps.emailTemplateDb,
    assetTypeDb: deps.assetTypeDb,
    companyDb: deps.companyDb,
    // Auth middleware
    authenticate: deps.authenticate,
    authorize: deps.authorize,
    // File upload
    upload: deps.upload,
    // OIDC
    initializeOIDC: deps.initializeOIDC,
    // HubSpot
    testHubSpotConnection: deps.testHubSpotConnection,
    syncCompaniesToACS: deps.syncCompaniesToACS,
    // Email
    sendTestEmail: deps.sendTestEmail,
    encryptValue: deps.encryptValue,
    // Helpers
    parseBooleanEnv: deps.parseBooleanEnv,
  });
  app.use('/api/admin', adminRouter);

  // Attestation routes
  const attestationRouter = createAttestationRouter({
    // Database
    attestationCampaignDb: deps.attestationCampaignDb,
    attestationRecordDb: deps.attestationRecordDb,
    attestationAssetDb: deps.attestationAssetDb,
    attestationNewAssetDb: deps.attestationNewAssetDb,
    attestationPendingInviteDb: deps.attestationPendingInviteDb,
    userDb: deps.userDb,
    assetDb: deps.assetDb,
    companyDb: deps.companyDb,
    auditDb: deps.auditDb,
    oidcSettingsDb: deps.oidcSettingsDb,
    // Auth middleware
    authenticate: deps.authenticate,
    authorize: deps.authorize,
    // Helpers
    sanitizeDateValue: deps.sanitizeDateValue,
  });
  app.use('/api/attestation', attestationRouter);

  // Public branding route (needs to be outside admin router for unauthenticated access)
  app.get('/api/branding', async (req, res) => {
    try {
      const settings = await deps.brandingSettingsDb.get();
      res.json(settings || {});
    } catch (error) {
      console.error('Get branding settings error:', error);
      res.status(500).json({ error: 'Failed to load branding settings' });
    }
  });

  console.log('Mounted route modules: assets, companies, audit, reports, admin, attestation');
}

export default mountRoutes;
