# Email Notifications Configuration Guide

KARS supports email notifications via SMTP (Simple Mail Transfer Protocol). This guide will help you configure email notifications for your organization.

## Overview

The email notification system allows KARS to send automated emails for various events. Currently, it supports:
- Test email functionality to verify SMTP configuration
- Foundation for future notification features (password resets, asset alerts, etc.)

## Prerequisites

You'll need the following information from your email provider:
- SMTP server hostname (e.g., `smtp.gmail.com`, `smtp.office365.com`)
- SMTP port (usually 587 for TLS, 465 for SSL, or 25 for unencrypted)
- Authentication credentials (username/email and password/app password)
- A "from" email address that the system will use to send emails

## Accessing Notification Settings

1. Log in to KARS as an **Admin** user
2. Click on **Admin Settings** in the navigation menu
3. Select the **Notifications** tab
4. You'll see the Email Notifications (SMTP) configuration panel

## Configuration Steps

### 1. Enable Email Notifications

Check the "Enable email notifications" checkbox to activate the email system.

### 2. Configure SMTP Server

Fill in the following required fields:

- **SMTP Host** (required): Your email provider's SMTP server address
  - Gmail: `smtp.gmail.com`
  - Office 365: `smtp.office365.com`
  - Outlook: `smtp-mail.outlook.com`
  - Yahoo: `smtp.mail.yahoo.com`
  - Custom: Contact your email provider for details

- **SMTP Port**: The port number for your SMTP server
  - `587` - Recommended for TLS (most common)
  - `465` - For SSL connections
  - `25` - Unencrypted (not recommended)

- **Use TLS/SSL encryption**: Check this box for secure connections (recommended)

### 3. Authentication (Optional)

If your SMTP server requires authentication:

- **SMTP Username**: Your email address or username
- **SMTP Password**: Your email password or app-specific password
  - **Note**: For Gmail and many other providers, you must use an "App Password" instead of your regular password
  - The password is encrypted using AES-256-CBC before being stored in the database
  - The password is never returned in API responses

### 4. Configure From Address

- **From Name**: The display name for emails (e.g., "KARS Notifications")
- **From Email Address** (required): The email address emails will be sent from

### 5. Save Settings

Click the **Save Settings** button to store your configuration.

## Testing Your Configuration

After saving your settings, it's important to test the configuration:

1. Click the **Send Test Email** button
2. Enter a recipient email address (defaults to the "from" email address)
3. Click **Send Test Email** in the dialog
4. Check the recipient's inbox for the test email
5. If successful, you'll see a success message; if it fails, you'll receive an error with details

### Common Test Failures

- **Authentication failed**: Check your username and password (use app password for Gmail)
- **Connection timeout**: Verify the SMTP host and port are correct
- **TLS/SSL errors**: Try toggling the TLS/SSL setting or use a different port
- **Relay denied**: Your SMTP server may not allow relaying; check with your provider

## Popular Email Provider Settings

### Gmail

To use Gmail for sending emails:

1. **Enable 2-Step Verification** on your Google account
2. **Generate an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Generate a new app password for "Mail"
   - Use this password in KARS (not your regular password)

**Configuration:**
- SMTP Host: `smtp.gmail.com`
- SMTP Port: `587`
- Use TLS/SSL: ✓ Checked
- Username: Your full Gmail address
- Password: The app password (16 characters, no spaces)

### Microsoft 365 / Outlook.com

**Configuration:**
- SMTP Host: `smtp.office365.com` (or `smtp-mail.outlook.com` for personal accounts)
- SMTP Port: `587`
- Use TLS/SSL: ✓ Checked
- Username: Your full email address
- Password: Your account password (or app password if MFA is enabled)

### Other Providers

Consult your email provider's documentation for:
- SMTP server hostname
- Port and encryption requirements
- Authentication requirements
- Any special configuration (e.g., app passwords, allowlists)

## Security Best Practices

1. **Use TLS/SSL**: Always enable encryption when available
2. **App Passwords**: Use app-specific passwords instead of your main account password
3. **Dedicated Account**: Consider creating a dedicated email account for system notifications
4. **Regular Rotation**: Periodically update your SMTP password
5. **Monitor Usage**: Review the audit logs for email sending activity
6. **Test Regularly**: Periodically send test emails to ensure the system is working

## Password Security

- SMTP passwords are encrypted using AES-256-CBC encryption before storage
- Passwords are never returned in API responses (only a `has_password` flag is provided)
- Each encryption uses a unique initialization vector (IV) for added security
- The encryption key is derived from the `JWT_SECRET` environment variable
- All password changes are logged in the audit trail

## Troubleshooting

### "Authentication failed" Error

**Possible causes:**
- Incorrect username or password
- Need to use an app password instead of account password
- Account requires additional security setup (e.g., enable "Less secure app access" for older email services)

**Solutions:**
- Verify credentials are correct
- Generate and use an app password
- Check your email provider's security settings

### "Connection timeout" Error

**Possible causes:**
- Incorrect SMTP host or port
- Firewall blocking outbound SMTP connections
- SMTP server is down

**Solutions:**
- Double-check the SMTP host and port
- Test connectivity: `telnet smtp.example.com 587`
- Try an alternative port (465 or 25)
- Contact your network administrator about firewall rules

### "TLS/SSL handshake failed" Error

**Possible causes:**
- Incorrect TLS/SSL setting
- Using wrong port for encryption type

**Solutions:**
- Try disabling TLS/SSL for port 25
- Use port 587 with TLS enabled
- Use port 465 with SSL enabled

### Test Email Not Received

**Possible causes:**
- Email in spam/junk folder
- Email provider rejecting messages
- Incorrect recipient address

**Solutions:**
- Check spam/junk folders
- Verify the recipient address is correct
- Review error messages in the KARS interface
- Check your email provider's sending logs

## Audit Trail

All notification-related activities are logged:
- Notification settings updates (who changed what)
- Test email sends (recipient and result)
- All logged with timestamp and admin user email

Access audit logs from the **Audit & Reports** page in the main navigation.

## Future Enhancements

The email notification system is designed to support future features:
- Password reset emails
- Asset assignment notifications
- Upcoming return date reminders
- Security alerts
- Scheduled reports

## Environment Variables (Optional)

For production deployments, you can also configure SMTP settings via environment variables (useful for containerized deployments):

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=notifications@example.com
SMTP_PASSWORD=your-encrypted-password
SMTP_FROM_NAME="KARS Notifications"
SMTP_FROM_EMAIL=notifications@example.com
```

**Note**: Settings configured in the admin UI take precedence over environment variables.

## Support

For additional help:
- Check the [KARS Wiki](../../wiki) for more guides
- Review the [GitHub Issues](../../issues) for known problems
- Contact your system administrator

---

**Security Notice**: Never share your SMTP credentials publicly or commit them to version control. Use the admin UI for configuration, which encrypts sensitive data automatically.
