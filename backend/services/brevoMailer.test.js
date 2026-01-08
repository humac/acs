import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock modules before importing the module under test
const mockSmtpSettingsDb = {
    get: jest.fn(),
    getBrevoApiKey: jest.fn()
};

const mockBrandingSettingsDb = {
    get: jest.fn()
};

const mockEmailTemplateDb = {
    getByKey: jest.fn()
};

const mockDecryptValue = jest.fn();

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.unstable_mockModule('../database.js', () => ({
    smtpSettingsDb: mockSmtpSettingsDb,
    brandingSettingsDb: mockBrandingSettingsDb,
    emailTemplateDb: mockEmailTemplateDb
}));

jest.unstable_mockModule('../utils/encryption.js', () => ({
    decryptValue: mockDecryptValue
}));

// Now import the module under test
const { sendEmail, sendTestEmail, verifyConnection } = await import('./brevoMailer.js');

describe('Brevo Mailer Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockSmtpSettingsDb.get.mockReset();
        mockSmtpSettingsDb.getBrevoApiKey.mockReset();
        mockBrandingSettingsDb.get.mockReset();
        mockEmailTemplateDb.getByKey.mockReset();
        mockDecryptValue.mockReset();
        mockFetch.mockReset();

        // Set default branding mock
        mockBrandingSettingsDb.get.mockResolvedValue({
            site_name: 'ACS',
            logo_data: null
        });

        // Set default emailTemplateDb mock
        mockEmailTemplateDb.getByKey.mockResolvedValue(null);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('sendEmail', () => {
        it('should send email successfully via Brevo API', async () => {
            const mockSettings = {
                enabled: 1,
                email_provider: 'brevo',
                from_name: 'ACS',
                from_email: 'noreply@example.com'
            };

            mockSmtpSettingsDb.get.mockResolvedValue(mockSettings);
            mockSmtpSettingsDb.getBrevoApiKey.mockResolvedValue('encrypted:api:key');
            mockDecryptValue.mockReturnValue('xkeysib-real-api-key');
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ messageId: '<msg123@brevo.com>' })
            });

            const result = await sendEmail({
                to: 'recipient@example.com',
                subject: 'Test Subject',
                htmlContent: '<p>Hello</p>',
                textContent: 'Hello'
            });

            expect(result.success).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.brevo.com/v3/smtp/email',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'api-key': 'xkeysib-real-api-key',
                        'Content-Type': 'application/json'
                    })
                })
            );
        });

        it('should fail when Brevo API key is not configured', async () => {
            mockSmtpSettingsDb.get.mockResolvedValue({
                enabled: 1,
                email_provider: 'brevo',
                from_email: 'noreply@example.com'
            });
            mockSmtpSettingsDb.getBrevoApiKey.mockResolvedValue(null);

            await expect(sendEmail({
                to: 'recipient@example.com',
                subject: 'Test',
                htmlContent: '<p>Hello</p>'
            })).rejects.toThrow('API key');
        });

        it('should handle Brevo API errors gracefully', async () => {
            const mockSettings = {
                enabled: 1,
                email_provider: 'brevo',
                from_name: 'ACS',
                from_email: 'noreply@example.com'
            };

            mockSmtpSettingsDb.get.mockResolvedValue(mockSettings);
            mockSmtpSettingsDb.getBrevoApiKey.mockResolvedValue('encrypted:api:key');
            mockDecryptValue.mockReturnValue('invalid-api-key');
            mockFetch.mockResolvedValue({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ message: 'Invalid API key', code: 'unauthorized' })
            });

            await expect(sendEmail({
                to: 'recipient@example.com',
                subject: 'Test',
                htmlContent: '<p>Hello</p>'
            })).rejects.toThrow('Brevo API error');
        });
    });

    describe('sendTestEmail', () => {
        it('should send test email successfully', async () => {
            const mockSettings = {
                enabled: 1,
                email_provider: 'brevo',
                from_name: 'ACS',
                from_email: 'noreply@example.com',
                default_recipient: 'admin@example.com'
            };

            mockSmtpSettingsDb.get.mockResolvedValue(mockSettings);
            mockSmtpSettingsDb.getBrevoApiKey.mockResolvedValue('encrypted:api:key');
            mockDecryptValue.mockReturnValue('xkeysib-real-api-key');
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ messageId: '<msg123@brevo.com>' })
            });

            const result = await sendTestEmail('test@example.com');

            expect(result.success).toBe(true);
            expect(result.message).toContain('test@example.com');
        });

        it('should use default recipient when none provided', async () => {
            const mockSettings = {
                enabled: 1,
                email_provider: 'brevo',
                from_name: 'ACS',
                from_email: 'noreply@example.com',
                default_recipient: 'admin@example.com'
            };

            mockSmtpSettingsDb.get.mockResolvedValue(mockSettings);
            mockSmtpSettingsDb.getBrevoApiKey.mockResolvedValue('encrypted:api:key');
            mockDecryptValue.mockReturnValue('xkeysib-real-api-key');
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ messageId: '<msg123@brevo.com>' })
            });

            const result = await sendTestEmail();

            expect(result.success).toBe(true);
            expect(result.message).toContain('admin@example.com');
        });
    });

    describe('verifyConnection', () => {
        it('should verify Brevo API key successfully', async () => {
            const mockSettings = {
                enabled: 1,
                email_provider: 'brevo'
            };

            mockSmtpSettingsDb.get.mockResolvedValue(mockSettings);
            mockSmtpSettingsDb.getBrevoApiKey.mockResolvedValue('encrypted:api:key');
            mockDecryptValue.mockReturnValue('xkeysib-real-api-key');
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ email: 'account@example.com' })
            });

            const result = await verifyConnection();

            expect(result.success).toBe(true);
            expect(result.message).toContain('verified');
        });

        it('should fail when API key is invalid', async () => {
            const mockSettings = {
                enabled: 1,
                email_provider: 'brevo'
            };

            mockSmtpSettingsDb.get.mockResolvedValue(mockSettings);
            mockSmtpSettingsDb.getBrevoApiKey.mockResolvedValue('encrypted:api:key');
            mockDecryptValue.mockReturnValue('invalid-api-key');
            mockFetch.mockResolvedValue({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ message: 'Invalid API key' })
            });

            const result = await verifyConnection();

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid');
        });
    });
});
