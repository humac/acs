import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { notificationSettingsDb } from './database.js';
import Database from 'better-sqlite3';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

// Create a test database
const testDbDir = join(process.cwd(), 'test-data-notification-settings');
const testDbPath = join(testDbDir, 'test.db');

let db;

// Mock encryption/decryption functions for testing
const ENCRYPTION_KEY = createHash('sha256').update('test-secret-key').digest();
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Import crypto functions
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const encrypt = (text) => {
  if (!text) return null;
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

const decrypt = (text) => {
  if (!text) return null;
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return null;
  }
};

describe('Notification Settings', () => {
  beforeAll(async () => {
    // Create test directory
    mkdirSync(testDbDir, { recursive: true });
    
    // Create test database
    db = new Database(testDbPath);
    
    // Create notification_settings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        enabled INTEGER NOT NULL DEFAULT 0,
        smtp_host TEXT,
        smtp_port INTEGER DEFAULT 587,
        smtp_use_tls INTEGER DEFAULT 1,
        smtp_username TEXT,
        smtp_password TEXT,
        smtp_from_name TEXT,
        smtp_from_email TEXT,
        updated_at TEXT NOT NULL,
        updated_by TEXT
      )
    `);
    
    // Insert default settings
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO notification_settings (id, enabled, smtp_port, smtp_use_tls, updated_at)
      VALUES (1, 0, 587, 1, ?)
    `).run(now);
  });

  afterAll(() => {
    if (db) db.close();
    // Clean up test database
    try {
      rmSync(testDbDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore errors
    }
  });

  describe('Default Settings', () => {
    it('should have default settings after initialization', () => {
      const settings = db.prepare('SELECT * FROM notification_settings WHERE id = 1').get();
      
      expect(settings).toBeDefined();
      expect(settings.enabled).toBe(0);
      expect(settings.smtp_port).toBe(587);
      expect(settings.smtp_use_tls).toBe(1);
      expect(settings.smtp_host).toBeNull();
      expect(settings.smtp_username).toBeNull();
      expect(settings.smtp_password).toBeNull();
      expect(settings.smtp_from_name).toBeNull();
      expect(settings.smtp_from_email).toBeNull();
    });
  });

  describe('SMTP Settings Update', () => {
    it('should update SMTP settings', () => {
      const now = new Date().toISOString();
      
      db.prepare(`
        UPDATE notification_settings
        SET enabled = ?,
            smtp_host = ?,
            smtp_port = ?,
            smtp_use_tls = ?,
            smtp_username = ?,
            smtp_from_name = ?,
            smtp_from_email = ?,
            updated_at = ?,
            updated_by = ?
        WHERE id = 1
      `).run(
        1,
        'smtp.example.com',
        587,
        1,
        'user@example.com',
        'KARS Notifications',
        'noreply@example.com',
        now,
        'admin@test.com'
      );
      
      const settings = db.prepare('SELECT * FROM notification_settings WHERE id = 1').get();
      
      expect(settings.enabled).toBe(1);
      expect(settings.smtp_host).toBe('smtp.example.com');
      expect(settings.smtp_port).toBe(587);
      expect(settings.smtp_use_tls).toBe(1);
      expect(settings.smtp_username).toBe('user@example.com');
      expect(settings.smtp_from_name).toBe('KARS Notifications');
      expect(settings.smtp_from_email).toBe('noreply@example.com');
      expect(settings.updated_by).toBe('admin@test.com');
    });
  });

  describe('Password Encryption', () => {
    it('should encrypt and decrypt passwords correctly', () => {
      const originalPassword = 'mySecurePassword123!';
      
      // Encrypt
      const encrypted = encrypt(originalPassword);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalPassword);
      expect(encrypted).toContain(':'); // Should have IV:encrypted format
      
      // Decrypt
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(originalPassword);
    });

    it('should handle null password', () => {
      const encrypted = encrypt(null);
      expect(encrypted).toBeNull();
      
      const decrypted = decrypt(null);
      expect(decrypted).toBeNull();
    });

    it('should handle empty password', () => {
      const encrypted = encrypt('');
      expect(encrypted).toBeNull();
    });

    it('should generate different encrypted values for same password', () => {
      const password = 'testPassword';
      const encrypted1 = encrypt(password);
      const encrypted2 = encrypt(password);
      
      // Different IVs should produce different encrypted strings
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to the same value
      expect(decrypt(encrypted1)).toBe(password);
      expect(decrypt(encrypted2)).toBe(password);
    });

    it('should store and retrieve encrypted password in database', () => {
      const password = 'myDatabasePassword';
      const encrypted = encrypt(password);
      const now = new Date().toISOString();
      
      db.prepare(`
        UPDATE notification_settings
        SET smtp_password = ?,
            updated_at = ?
        WHERE id = 1
      `).run(encrypted, now);
      
      const settings = db.prepare('SELECT smtp_password FROM notification_settings WHERE id = 1').get();
      
      expect(settings.smtp_password).toBe(encrypted);
      expect(settings.smtp_password).not.toBe(password);
      
      const decrypted = decrypt(settings.smtp_password);
      expect(decrypted).toBe(password);
    });
  });

  describe('Settings Validation', () => {
    it('should enforce id = 1 constraint', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO notification_settings (id, enabled, smtp_port, smtp_use_tls, updated_at)
          VALUES (2, 0, 587, 1, ?)
        `).run(new Date().toISOString());
      }).toThrow();
    });

    it('should allow null optional fields', () => {
      const now = new Date().toISOString();
      
      db.prepare(`
        UPDATE notification_settings
        SET smtp_host = NULL,
            smtp_username = NULL,
            smtp_password = NULL,
            smtp_from_name = NULL,
            smtp_from_email = NULL,
            updated_at = ?
        WHERE id = 1
      `).run(now);
      
      const settings = db.prepare('SELECT * FROM notification_settings WHERE id = 1').get();
      
      expect(settings.smtp_host).toBeNull();
      expect(settings.smtp_username).toBeNull();
      expect(settings.smtp_password).toBeNull();
      expect(settings.smtp_from_name).toBeNull();
      expect(settings.smtp_from_email).toBeNull();
    });
  });

  describe('Port Configuration', () => {
    it('should support common SMTP ports', () => {
      const ports = [25, 465, 587, 2525];
      const now = new Date().toISOString();
      
      ports.forEach(port => {
        db.prepare('UPDATE notification_settings SET smtp_port = ?, updated_at = ? WHERE id = 1')
          .run(port, now);
        
        const settings = db.prepare('SELECT smtp_port FROM notification_settings WHERE id = 1').get();
        expect(settings.smtp_port).toBe(port);
      });
    });
  });

  describe('TLS Configuration', () => {
    it('should toggle TLS setting', () => {
      const now = new Date().toISOString();
      
      // Enable TLS
      db.prepare('UPDATE notification_settings SET smtp_use_tls = ?, updated_at = ? WHERE id = 1')
        .run(1, now);
      let settings = db.prepare('SELECT smtp_use_tls FROM notification_settings WHERE id = 1').get();
      expect(settings.smtp_use_tls).toBe(1);
      
      // Disable TLS
      db.prepare('UPDATE notification_settings SET smtp_use_tls = ?, updated_at = ? WHERE id = 1')
        .run(0, now);
      settings = db.prepare('SELECT smtp_use_tls FROM notification_settings WHERE id = 1').get();
      expect(settings.smtp_use_tls).toBe(0);
    });
  });

  describe('Audit Trail', () => {
    it('should track who updated settings', () => {
      const now = new Date().toISOString();
      const updater = 'test-admin@example.com';
      
      db.prepare('UPDATE notification_settings SET updated_by = ?, updated_at = ? WHERE id = 1')
        .run(updater, now);
      
      const settings = db.prepare('SELECT updated_by, updated_at FROM notification_settings WHERE id = 1').get();
      
      expect(settings.updated_by).toBe(updater);
      expect(settings.updated_at).toBe(now);
    });
  });
});
