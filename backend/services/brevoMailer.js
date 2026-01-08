import { smtpSettingsDb, brandingSettingsDb, emailTemplateDb } from '../database.js';
import { decryptValue } from '../utils/encryption.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger({ module: 'brevo' });

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Brevo Mailer Service
 * Handles sending emails via Brevo API using stored settings
 */

/**
 * Gets the decrypted Brevo API key from settings
 * @returns {Promise<string|null>} Decrypted API key or null
 */
const getApiKey = async () => {
    const encryptedKey = await smtpSettingsDb.getBrevoApiKey();
    if (!encryptedKey) {
        return null;
    }

    try {
        return decryptValue(encryptedKey);
    } catch (error) {
        logger.error({ err: error }, 'Failed to decrypt Brevo API key');
        throw new Error('Failed to decrypt Brevo API key. Please check KARS_MASTER_KEY configuration.');
    }
};

/**
 * Gets the app URL with fallback chain
 * @returns {Promise<string>} The base app URL
 */
const getAppUrl = async () => {
    const branding = await brandingSettingsDb.get();
    const url = branding?.app_url || process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3000';
    return url.replace(/\/+$/, '');
};

/**
 * Builds email HTML with optional logo header
 * @param {Object} branding - Branding settings
 * @param {string} siteName - Site name
 * @param {string} content - Email content HTML
 * @returns {string} Complete HTML
 */
const buildEmailHtml = (branding, siteName, content) => {
    const logoHeader = branding?.include_logo_in_emails && branding?.logo_data
        ? `<div style="text-align: center; margin-bottom: 20px;">
         <img src="${branding.logo_data}" alt="${siteName}" style="max-height: 80px; max-width: 300px; object-fit: contain;" />
       </div>`
        : '';

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${logoHeader}
      ${content}
    </div>
  `;
};

/**
 * Substitutes variables in a template string
 * @param {string} template - Template with {{variable}} placeholders
 * @param {Object} variables - Variable values
 * @returns {string} Template with variables replaced
 */
const substituteVariables = (template, variables) => {
    if (!template) return '';

    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        result = result.replace(regex, value || '');
    }
    return result;
};

/**
 * Sends an email via Brevo API
 * @param {Object} options - Email options
 * @param {Object} options.sender - Sender {name, email}
 * @param {Array} options.to - Recipients [{name, email}]
 * @param {string} options.subject - Email subject
 * @param {string} options.htmlContent - HTML content
 * @param {string} options.textContent - Plain text content (optional)
 * @returns {Promise<Object>} Result with success status
 */
export const sendEmail = async (options) => {
    const apiKey = await getApiKey();

    if (!apiKey) {
        throw new Error('Brevo API key is not configured');
    }

    const { sender, to, subject, htmlContent, textContent } = options;

    const requestBody = {
        sender,
        to,
        subject,
        htmlContent
    };

    if (textContent) {
        requestBody.textContent = textContent;
    }

    try {
        const response = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.message || data.error || `Brevo API error: ${response.status}`;
            logger.error({ status: response.status, error: data }, 'Brevo API error');
            throw new Error(errorMessage);
        }

        return {
            success: true,
            messageId: data.messageId
        };
    } catch (error) {
        if (error.message.includes('Brevo API')) {
            throw error;
        }
        logger.error({ err: error }, 'Failed to send email via Brevo');
        throw new Error(`Failed to send email via Brevo: ${error.message}`);
    }
};

/**
 * Verifies Brevo API connection by checking the API key
 * @returns {Promise<Object>} Result with success status
 */
export const verifyConnection = async () => {
    const apiKey = await getApiKey();

    if (!apiKey) {
        return {
            success: false,
            error: 'Brevo API key is not configured'
        };
    }

    try {
        // Use a simple account endpoint to verify the key
        const response = await fetch('https://api.brevo.com/v3/account', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey
            }
        });

        if (!response.ok) {
            const data = await response.json();
            return {
                success: false,
                error: data.message || `Brevo API error: ${response.status}`
            };
        }

        return {
            success: true,
            message: 'Brevo API connection verified successfully'
        };
    } catch (error) {
        logger.error({ err: error }, 'Brevo connection verification failed');
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Sends a test email to verify Brevo configuration
 * @param {string} recipient - Email address to send the test to
 * @returns {Promise<Object>} Result with success status
 */
export const sendTestEmail = async (recipient) => {
    try {
        const settings = await smtpSettingsDb.get();

        if (!settings || !settings.enabled) {
            return {
                success: false,
                error: 'Email settings are not enabled. Please enable them first.'
            };
        }

        if (settings.email_provider !== 'brevo') {
            return {
                success: false,
                error: 'Brevo is not the selected email provider'
            };
        }

        if (!settings.from_email) {
            return {
                success: false,
                error: 'From email address is not configured'
            };
        }

        const toEmail = recipient || settings.default_recipient;
        if (!toEmail) {
            return {
                success: false,
                error: 'No recipient specified and no default recipient configured'
            };
        }

        // Get branding settings
        const branding = await brandingSettingsDb.get();
        const siteName = branding?.site_name || 'ACS';

        // Try to get template from database
        const template = await emailTemplateDb.getByKey('test_email');

        const variables = {
            siteName,
            smtpHost: 'Brevo API',
            smtpPort: 'N/A',
            timestamp: new Date().toISOString()
        };

        let subject, emailContent, textContent;

        if (template) {
            subject = substituteVariables(template.subject, variables);
            emailContent = substituteVariables(template.html_body, variables);
            textContent = substituteVariables(template.text_body, variables);
        } else {
            subject = `${siteName} Test Email (via Brevo)`;
            emailContent = `
        <h2 style="color: #333;">${siteName} Test Email</h2>
        <p>This is a test email from <strong>${siteName}</strong>.</p>
        <p>If you received this email, your Brevo API settings are configured correctly.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          <strong>Provider:</strong> Brevo API<br>
          <strong>Sent at:</strong> ${new Date().toISOString()}
        </p>
      `;
            textContent = `This is a test email from ${siteName}.

If you received this email, your Brevo API settings are configured correctly.

Provider: Brevo API
Sent at: ${new Date().toISOString()}`;
        }

        const result = await sendEmail({
            sender: {
                name: settings.from_name || `${siteName} Notifications`,
                email: settings.from_email
            },
            to: [{ email: toEmail }],
            subject,
            htmlContent: buildEmailHtml(branding, siteName, emailContent),
            textContent
        });

        return {
            success: true,
            message: `Test email sent successfully to ${toEmail}`,
            messageId: result.messageId
        };
    } catch (error) {
        logger.error({ err: error }, 'Brevo test email failed');
        return {
            success: false,
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
    }
};

// Export helper functions for use by the unified email service
export { getAppUrl, buildEmailHtml, substituteVariables };
