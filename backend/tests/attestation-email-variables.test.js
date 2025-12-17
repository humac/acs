/**
 * Attestation Email Template Variables Test
 * 
 * This test verifies that the new attestation email templates have the correct
 * variables list including campaignDescription where applicable.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { assetDb, emailTemplateDb } from '../database.js';

const TEST_DB_DIR = join(process.cwd(), 'test-data-attestation-email-variables');
const TEST_DB_PATH = join(TEST_DB_DIR, 'assets.db');

describe('Attestation Email Template Variables', () => {
  beforeAll(async () => {
    // Create clean test directory
    try {
      rmSync(TEST_DB_DIR, { recursive: true, force: true });
    } catch (err) {
      // Directory doesn't exist, that's fine
    }
    mkdirSync(TEST_DB_DIR, { recursive: true });
    
    // Set DATA_DIR to test directory
    process.env.DATA_DIR = TEST_DB_DIR;
    
    // Initialize database (this should create tables and seed data)
    await assetDb.init();
  });

  afterAll(() => {
    // Clean up test directory
    try {
      rmSync(TEST_DB_DIR, { recursive: true, force: true });
    } catch (err) {
      console.error('Failed to clean up test directory:', err);
    }
  });

  it('should have campaignDescription in attestation_registration_invite variables', async () => {
    const template = await emailTemplateDb.getByKey('attestation_registration_invite');
    expect(template).toBeDefined();
    expect(template.variables).toBeDefined();
    
    const variables = JSON.parse(template.variables);
    expect(variables).toContain('campaignDescription');
    expect(variables).toContain('siteName');
    expect(variables).toContain('firstName');
    expect(variables).toContain('lastName');
    expect(variables).toContain('assetCount');
    expect(variables).toContain('campaignName');
    expect(variables).toContain('endDate');
    expect(variables).toContain('registerUrl');
  });

  it('should have campaignDescription in attestation_unregistered_reminder variables', async () => {
    const template = await emailTemplateDb.getByKey('attestation_unregistered_reminder');
    expect(template).toBeDefined();
    expect(template.variables).toBeDefined();
    
    const variables = JSON.parse(template.variables);
    expect(variables).toContain('campaignDescription');
    expect(variables).toContain('siteName');
    expect(variables).toContain('firstName');
    expect(variables).toContain('lastName');
    expect(variables).toContain('assetCount');
    expect(variables).toContain('campaignName');
    expect(variables).toContain('endDate');
    expect(variables).toContain('registerUrl');
  });

  it('should have correct variables in attestation_unregistered_escalation (no campaignDescription)', async () => {
    const template = await emailTemplateDb.getByKey('attestation_unregistered_escalation');
    expect(template).toBeDefined();
    expect(template.variables).toBeDefined();
    
    const variables = JSON.parse(template.variables);
    expect(variables).not.toContain('campaignDescription');
    expect(variables).toContain('siteName');
    expect(variables).toContain('managerName');
    expect(variables).toContain('employeeName');
    expect(variables).toContain('employeeEmail');
    expect(variables).toContain('campaignName');
    expect(variables).toContain('assetCount');
    expect(variables).toContain('endDate');
  });



  it('should have valid JSON in all template variables fields', async () => {
    const templates = await emailTemplateDb.getAll();
    
    for (const template of templates) {
      expect(template.variables).toBeDefined();
      expect(template.variables).not.toBe('null');
      expect(template.variables).not.toBe('[]');
      
      // Should be valid JSON
      let variables;
      expect(() => {
        variables = JSON.parse(template.variables);
      }).not.toThrow();
      
      // Should be an array
      expect(Array.isArray(variables)).toBe(true);
      
      // Should have at least one variable
      expect(variables.length).toBeGreaterThan(0);
    }
  });
});
