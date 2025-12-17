import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Tests for database table creation order
 * 
 * These tests verify that tables are created in the correct dependency order
 * to satisfy foreign key constraints, especially for PostgreSQL which enforces
 * foreign key constraints immediately.
 * 
 * The correct order is:
 * 1. users (no dependencies)
 * 2. companies (no dependencies)
 * 3. assets (depends on users via owner_id and manager_id)
 * 4. audit_logs (no dependencies)
 * 5. settings tables
 * 6. passkeys (depends on users)
 */

describe('Database Table Creation Order', () => {
  const databaseJsPath = join(__dirname, 'database.js');
  const databaseJsContent = readFileSync(databaseJsPath, 'utf-8');

  it('should create users table before assets table', () => {
    // Find the positions of table creation statements
    const usersTableMatch = databaseJsContent.match(/await dbRun\(usersTable\)/);
    const assetsTableMatch = databaseJsContent.match(/await dbRun\(assetsTable\)/);
    
    expect(usersTableMatch).toBeTruthy();
    expect(assetsTableMatch).toBeTruthy();
    
    const usersTablePos = usersTableMatch.index;
    const assetsTablePos = assetsTableMatch.index;
    
    expect(usersTablePos).toBeLessThan(assetsTablePos);
  });

  it('should create companies table before assets table', () => {
    const companiesTableMatch = databaseJsContent.match(/await dbRun\(companiesTable\)/);
    const assetsTableMatch = databaseJsContent.match(/await dbRun\(assetsTable\)/);
    
    expect(companiesTableMatch).toBeTruthy();
    expect(assetsTableMatch).toBeTruthy();
    
    const companiesTablePos = companiesTableMatch.index;
    const assetsTablePos = assetsTableMatch.index;
    
    expect(companiesTablePos).toBeLessThan(assetsTablePos);
  });

  it('should create users table before passkeys table', () => {
    const usersTableMatch = databaseJsContent.match(/await dbRun\(usersTable\)/);
    const passkeysTableMatch = databaseJsContent.match(/await dbRun\(passkeysTable\)/);
    
    expect(usersTableMatch).toBeTruthy();
    expect(passkeysTableMatch).toBeTruthy();
    
    const usersTablePos = usersTableMatch.index;
    const passkeysTablePos = passkeysTableMatch.index;
    
    expect(usersTablePos).toBeLessThan(passkeysTablePos);
  });

  it('should include HubSpot columns in companies table CREATE statement', () => {
    // Find the companies table definition section
    const companiesTableSection = databaseJsContent.match(
      /const companiesTable = isPostgres[\s\S]*?`;\s*$/m
    );
    
    expect(companiesTableSection).toBeTruthy();
    const companiesTableCode = companiesTableSection[0];
    
    // Check both PostgreSQL and SQLite versions contain HubSpot columns
    expect(companiesTableCode).toContain('hubspot_id');
    expect(companiesTableCode).toContain('hubspot_synced_at');
    
    // Verify it appears in both CREATE TABLE statements
    const createTableCount = (companiesTableCode.match(/CREATE TABLE IF NOT EXISTS companies/g) || []).length;
    expect(createTableCount).toBe(2); // Should have both Postgres and SQLite versions
  });

  it('should have owner_id and manager_id in assets table CREATE statement', () => {
    // Check that assets table definition includes owner_id and manager_id
    const assetsTableMatch = databaseJsContent.match(
      /const assetsTable = isPostgres \? `[\s\S]*?CREATE TABLE IF NOT EXISTS assets[\s\S]*?`/
    );
    
    expect(assetsTableMatch).toBeTruthy();
    const assetsTableDef = assetsTableMatch[0];
    
    expect(assetsTableDef).toContain('owner_id');
    expect(assetsTableDef).toContain('manager_id');
    expect(assetsTableDef).toContain('REFERENCES users');
  });

  it('should not contain obsolete migration code for adding manager fields to users', () => {
    // These migrations should be removed since columns are in CREATE TABLE
    expect(databaseJsContent).not.toContain('ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_name');
    expect(databaseJsContent).not.toContain('ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_first_name');
  });

  it('should not contain obsolete migration code for adding HubSpot columns to companies', () => {
    // This migration should be removed since columns are in CREATE TABLE
    expect(databaseJsContent).not.toContain('ALTER TABLE companies ADD COLUMN IF NOT EXISTS hubspot_id');
    expect(databaseJsContent).not.toContain('Migrate companies table to add HubSpot columns');
  });

  it('should not contain obsolete migration code for adding owner_id/manager_id to assets', () => {
    // This migration should be removed since columns are in CREATE TABLE
    expect(databaseJsContent).not.toContain('ALTER TABLE assets ADD COLUMN IF NOT EXISTS owner_id');
    expect(databaseJsContent).not.toContain('Migrate existing assets table to add owner_id and manager_id');
  });

  it('should not contain obsolete migration code for renaming client_name to company_name', () => {
    // This migration should be removed since assets table uses company_name
    expect(databaseJsContent).not.toContain('Migrate client_name to company_name');
    expect(databaseJsContent).not.toContain('ALTER TABLE assets RENAME COLUMN client_name TO company_name');
  });

  it('should not contain obsolete migration code for making manager fields nullable', () => {
    // This migration should be removed since manager fields are already nullable
    expect(databaseJsContent).not.toContain('Migrate existing assets table to make manager fields nullable');
    expect(databaseJsContent).not.toContain('ALTER TABLE assets ALTER COLUMN manager_name DROP NOT NULL');
  });

  it('should still contain default settings initialization', () => {
    // Keep the settings initialization code
    expect(databaseJsContent).toContain('Insert default OIDC settings if not exists');
    expect(databaseJsContent).toContain('Insert default branding settings if not exists');
    expect(databaseJsContent).toContain('Insert default HubSpot settings if not exists');
  });

  it('should still contain index creation', () => {
    // Keep the index creation code
    expect(databaseJsContent).toContain('CREATE INDEX IF NOT EXISTS idx_employee_first_name');
    expect(databaseJsContent).toContain('CREATE INDEX IF NOT EXISTS idx_company_name');
    expect(databaseJsContent).toContain('CREATE INDEX IF NOT EXISTS idx_user_email');
  });

  it('should have correct table creation order in code', () => {
    // Extract all table creation statements in order
    // Using a flexible regex that handles various whitespace patterns
    const tableCreationPattern = /await\s+dbRun\s*\(\s*(\w+Table)\s*\)\s*;/g;
    const matches = [...databaseJsContent.matchAll(tableCreationPattern)];
    const tableOrder = matches.map(m => m[1]);
    
    // Expected order based on dependencies
    const expectedOrder = [
      'usersTable',      // No dependencies
      'companiesTable',  // No dependencies
      'assetsTable',     // Depends on users
      'auditLogsTable',  // No dependencies
      'oidcSettingsTable',
      'brandingSettingsTable',
      'passkeySettingsTable',
      'passkeysTable',   // Depends on users
      'hubspotSettingsTable',
      'hubspotSyncLogTable'
    ];
    
    // Verify we found the expected number of table creations
    expect(tableOrder.length).toBeGreaterThanOrEqual(expectedOrder.length);
    
    // Verify the first 10 tables match expected order
    expect(tableOrder.slice(0, expectedOrder.length)).toEqual(expectedOrder);
  });
});
