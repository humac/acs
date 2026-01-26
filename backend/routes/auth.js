/**
 * Authentication Routes
 * Handles: registration, login, password reset, profile, MFA, passkeys, users, OIDC
 */

import { Router } from 'express';
import { requireFields, validateEmail } from '../middleware/validation.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger({ module: 'auth' });

/**
 * Create and configure the auth router
 * @param {Object} deps - Dependencies
 */
export default function createAuthRouter(deps) {
  const router = Router();

  const {
    // Database
    userDb,
    auditDb,
    passwordResetTokenDb,
    emailVerificationTokenDb,
    attestationCampaignDb,
    attestationRecordDb,
    attestationPendingInviteDb,
    smtpSettingsDb,
    // Auth
    authenticate,
    hashPassword,
    comparePassword,
    generateToken,
    // Rate limiters
    authRateLimiter,
    passwordResetRateLimiter,
    // Helpers
    syncAssetOwnership,
    mfaSessions,
    // Email
    sendPasswordResetEmail,
    sendEmailVerificationEmail,
    sendEmailChangeVerificationEmail,
    getAppUrl,
    // Settings
    authSettingsDb,
    oidcSettingsDb,
  } = deps;

  // ===== Public Auth Configuration =====

  router.get('/config', async (req, res) => {
    try {
      const authSettings = await authSettingsDb?.get();
      const oidcSettings = await oidcSettingsDb?.get();

      res.json({
        registration_enabled: authSettings?.registration_enabled !== 0,
        password_login_enabled: authSettings?.password_login_enabled !== 0,
        oidc_enabled: oidcSettings?.enabled === 1
      });
    } catch (error) {
      // Default to all enabled on error to prevent lockout
      logger.error({ err: error }, 'Failed to fetch auth config');
      res.json({
        registration_enabled: true,
        password_login_enabled: true,
        oidc_enabled: false
      });
    }
  });

  // ===== Registration =====

  router.post('/register', authRateLimiter, async (req, res) => {
    try {
      // Check if registration is enabled
      const authSettings = await authSettingsDb?.get();
      if (authSettings?.registration_enabled === 0) {
        return res.status(403).json({
          error: 'Registration is currently disabled. Please contact your administrator.'
        });
      }

      let { email, password, name, first_name, last_name, manager_first_name, manager_last_name, manager_name, manager_email } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (!name && (!first_name || !last_name)) {
        return res.status(400).json({ error: 'Either name or both first_name and last_name are required' });
      }

      // Support both split fields and combined field for backward compatibility
      if (manager_first_name && manager_last_name) {
        // Split fields provided - use them
      } else if (manager_name) {
        const nameParts = manager_name.trim().split(/\s+/);
        manager_first_name = nameParts[0] || '';
        manager_last_name = nameParts.slice(1).join(' ') || '';
      } else {
        return res.status(400).json({ error: 'Manager first name and last name are required' });
      }

      if (!manager_email) {
        return res.status(400).json({ error: 'Manager email is required' });
      }

      // Check if user already exists
      const existingUser = await userDb.getByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const password_hash = await hashPassword(password);

      // Determine user role
      const allUsers = await userDb.getAll();
      const isFirstUser = allUsers.length === 0;
      const isAdminEmail = process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

      let userRole = 'employee';
      if (isFirstUser || isAdminEmail) {
        userRole = 'admin';
        logger.info({ email, isFirstUser, isAdminEmail }, `Creating admin user: ${email} (${isFirstUser ? 'first user' : 'admin email match'})`);
      }

      // Create user
      const result = await userDb.create({
        email,
        password_hash,
        name: name || `${first_name} ${last_name}`,
        first_name: first_name || null,
        last_name: last_name || null,
        manager_first_name,
        manager_last_name,
        manager_email,
        role: userRole
      });

      const newUser = await userDb.getById(result.id);

      // Sync asset ownership for pre-loaded assets
      const syncResult = await syncAssetOwnership(newUser.email);

      // Update manager info on assets
      let assetsUpdated = 0;
      if (manager_email) {
        const assetDb = deps.assetDb;
        if (assetDb) {
          const updateResult = await assetDb.updateManagerForEmployee(
            newUser.email,
            manager_first_name,
            manager_last_name,
            manager_email
          );
          assetsUpdated = updateResult.changes;
        }
      }

      if (syncResult.ownerUpdates > 0 || syncResult.managerUpdates > 0 || assetsUpdated > 0) {
        logger.info({ email: newUser.email, ownerUpdates: syncResult.ownerUpdates, managerUpdates: syncResult.managerUpdates, assetsUpdated }, `Synced asset ownership/manager for ${newUser.email}`);

        await auditDb.log(
          'sync_assets',
          'user',
          newUser.id,
          newUser.email,
          {
            owner_assets_synced: syncResult.ownerUpdates,
            manager_assets_synced: syncResult.managerUpdates,
            manager_info_updated_count: assetsUpdated
          },
          'system'
        );
      }

      // Check if this user is a manager for existing assets and should be auto-assigned manager role
      const autoAssignManagerRoleIfNeeded = deps.autoAssignManagerRoleIfNeeded;
      let roleUpdated = false;
      if (autoAssignManagerRoleIfNeeded) {
        roleUpdated = await autoAssignManagerRoleIfNeeded(newUser.email);
      }

      // Re-fetch user if role was updated to get the latest data for JWT
      const finalUser = roleUpdated ? await userDb.getById(newUser.id) : newUser;

      // Generate JWT token with the potentially updated role
      const token = generateToken({
        id: finalUser.id,
        email: finalUser.email,
        role: finalUser.role
      });

      // Log audit
      await auditDb.log(
        'REGISTER',
        'user',
        finalUser.id,
        finalUser.email,
        { role: finalUser.role, manager_email },
        finalUser.email
      );

      // Check for pending attestation invites and convert them
      let hasActiveAttestation = false;
      try {
        if (attestationPendingInviteDb && attestationCampaignDb && attestationRecordDb) {
          const pendingInvites = await attestationPendingInviteDb.getActiveByEmail(finalUser.email);
          for (const invite of pendingInvites) {
            // Only convert if campaign is still active
            const campaign = await attestationCampaignDb.getById(invite.campaign_id);
            if (campaign && campaign.status === 'active') {
              // Create attestation record
              const record = await attestationRecordDb.create({
                campaign_id: invite.campaign_id,
                user_id: finalUser.id,
                status: 'pending'
              });

              // Update invite
              await attestationPendingInviteDb.update(invite.id, {
                registered_at: new Date().toISOString(),
                converted_record_id: record.id
              });

              hasActiveAttestation = true;

              logger.info({ email: finalUser.email, campaignName: campaign.name }, 'Converted pending invite to attestation record during registration');
            }
          }
        }
      } catch (inviteError) {
        logger.error({ err: inviteError }, 'Error converting pending attestation invites during registration');
        // Don't fail registration if invite conversion fails
      }

      // Send email verification if SMTP is enabled
      let emailVerificationSent = false;
      let requiresEmailVerification = false;
      try {
        if (smtpSettingsDb && emailVerificationTokenDb && sendEmailVerificationEmail && getAppUrl) {
          const smtpSettings = await smtpSettingsDb.get();
          if (smtpSettings && smtpSettings.enabled) {
            // Generate verification token
            const crypto = await import('crypto');
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            // Store token in database
            await emailVerificationTokenDb.create(
              finalUser.email,
              verificationToken,
              expiresAt.toISOString(),
              'registration',
              finalUser.id
            );

            // Mark user as unverified
            await userDb.setEmailUnverified(finalUser.id);
            requiresEmailVerification = true;

            // Send verification email
            const baseUrl = await getAppUrl();
            const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

            const emailResult = await sendEmailVerificationEmail(finalUser.email, verificationToken, verifyUrl);
            if (emailResult.success) {
              emailVerificationSent = true;
              logger.info({ email: finalUser.email }, 'Email verification sent to new user');
            } else {
              logger.error({ email: finalUser.email, error: emailResult.error }, 'Failed to send verification email');
            }
          }
        }
      } catch (emailError) {
        logger.error({ err: emailError }, 'Error sending email verification during registration');
        // Don't fail registration if email verification fails
      }

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: finalUser.id,
          email: finalUser.email,
          first_name: finalUser.first_name,
          last_name: finalUser.last_name,
          role: finalUser.role,
          manager_first_name: finalUser.manager_first_name,
          manager_last_name: finalUser.manager_last_name,
          manager_email: finalUser.manager_email,
          email_verified: !requiresEmailVerification
        },
        redirectToAttestations: hasActiveAttestation,
        requiresEmailVerification,
        emailVerificationSent
      });
    } catch (error) {
      logger.error({ err: error }, 'Registration error');
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // ===== Login =====

  router.post('/login', authRateLimiter, requireFields('email', 'password'), async (req, res) => {
    try {
      // Check if password login is enabled
      const authSettings = await authSettingsDb?.get();
      if (authSettings?.password_login_enabled === 0) {
        return res.status(403).json({
          error: 'Password login is disabled. Please use SSO to sign in.'
        });
      }

      const { email, password } = req.body;

      const user = await userDb.getByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if MFA is enabled
      if (user.mfa_enabled) {
        // Generate a temporary session for MFA verification
        const crypto = await import('crypto');
        const mfaSessionId = crypto.randomBytes(32).toString('hex');

        mfaSessions.set(mfaSessionId, {
          userId: user.id,
          email: user.email,
          role: user.role,
          createdAt: Date.now()
        });

        // Clean up old sessions (older than 5 minutes)
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        for (const [key, session] of mfaSessions.entries()) {
          if (session.createdAt < fiveMinutesAgo) {
            mfaSessions.delete(key);
          }
        }

        return res.json({
          requiresMFA: true,
          mfaSessionId,
          message: 'Please provide your 2FA code'
        });
      }

      // No MFA - generate token directly
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      await auditDb.log('LOGIN', 'user', user.id, user.email, { method: 'password' }, user.email);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          manager_first_name: user.manager_first_name,
          manager_last_name: user.manager_last_name,
          manager_email: user.manager_email,
          profile_complete: Boolean(user.first_name && user.last_name && user.manager_email),
          profile_image: user.profile_image,
          email_verified: Boolean(user.email_verified)
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Login error');
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // ===== Password Reset =====

  router.post('/forgot-password', passwordResetRateLimiter, requireFields('email'), async (req, res) => {
    try {
      // Check if password login is enabled (password reset is irrelevant if password login is disabled)
      const authSettings = await authSettingsDb?.get();
      if (authSettings?.password_login_enabled === 0) {
        return res.status(403).json({
          error: 'Password reset is not available when password login is disabled.'
        });
      }

      const { email } = req.body;

      const user = await userDb.getByEmail(email);

      // Always return success to prevent email enumeration
      if (!user) {
        logger.info({ email }, `Password reset requested for non-existent email: ${email}`);
        return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
      }

      // Generate reset token
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token in database
      await passwordResetTokenDb.create(user.id, token, expiresAt.toISOString());

      // Send email
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetLink = `${frontendUrl}/reset-password?token=${token}`;

      try {
        await sendPasswordResetEmail(user.email, user.first_name || user.name || 'User', resetLink);
        logger.info({ email }, `Password reset email sent to ${email}`);
      } catch (emailError) {
        logger.error({ err: emailError, email }, 'Failed to send password reset email');
        // Don't fail the request if email fails - user can request again
      }

      await auditDb.log(
        'PASSWORD_RESET_REQUEST',
        'user',
        user.id,
        user.email,
        { requested_at: new Date().toISOString() },
        user.email
      );

      res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    } catch (error) {
      logger.error({ err: error }, 'Forgot password error');
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  });

  router.get('/verify-reset-token/:token', async (req, res) => {
    try {
      const { token } = req.params;

      const resetToken = await passwordResetTokenDb.findByToken(token);

      if (!resetToken) {
        return res.status(400).json({ valid: false, error: 'Invalid or expired reset token' });
      }

      // Check if token is expired
      const expiresAt = new Date(resetToken.expires_at);
      if (expiresAt < new Date()) {
        await passwordResetTokenDb.deleteByUserId(resetToken.user_id);
        return res.status(400).json({ valid: false, error: 'Reset token has expired' });
      }

      // Check if token has been used
      if (resetToken.used) {
        return res.status(400).json({ valid: false, error: 'Reset token has already been used' });
      }

      res.json({ valid: true });
    } catch (error) {
      logger.error({ err: error }, 'Verify reset token error');
      res.status(500).json({ valid: false, error: 'Failed to verify reset token' });
    }
  });

  router.post('/reset-password', requireFields('token', 'password'), async (req, res) => {
    try {
      const { token, password } = req.body;

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      const resetToken = await passwordResetTokenDb.findByToken(token);

      if (!resetToken) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Check if token is expired
      const expiresAt = new Date(resetToken.expires_at);
      if (expiresAt < new Date()) {
        await passwordResetTokenDb.deleteByUserId(resetToken.user_id);
        return res.status(400).json({ error: 'Reset token has expired' });
      }

      // Check if token has been used
      if (resetToken.used) {
        return res.status(400).json({ error: 'Reset token has already been used' });
      }

      // Hash new password
      const password_hash = await hashPassword(password);

      // Update user's password
      await userDb.updatePassword(resetToken.user_id, password_hash);

      // Mark token as used
      await passwordResetTokenDb.markAsUsed(resetToken.id);

      // Get user for audit log
      const user = await userDb.getById(resetToken.user_id);

      await auditDb.log(
        'PASSWORD_RESET',
        'user',
        user.id,
        user.email,
        { reset_at: new Date().toISOString() },
        user.email
      );

      res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
      logger.error({ err: error }, 'Reset password error');
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // ===== Profile =====

  router.get('/me', authenticate, async (req, res) => {
    try {
      const user = await userDb.getById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        manager_first_name: user.manager_first_name,
        manager_last_name: user.manager_last_name,
        manager_email: user.manager_email,
        mfa_enabled: user.mfa_enabled,
        profile_complete: Boolean(user.first_name && user.last_name && user.manager_email),
        profile_image: user.profile_image,
        email_verified: Boolean(user.email_verified)
      });
    } catch (error) {
      logger.error({ err: error, userId: req.user?.id }, 'Get profile error');
      res.status(500).json({ error: 'Failed to get profile' });
    }
  });

  router.put('/profile', authenticate, requireFields('first_name', 'last_name'), async (req, res) => {
    try {
      const { first_name, last_name, manager_first_name, manager_last_name, manager_email, profile_image } = req.body;

      const user = await userDb.getById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Handle profile_image - validate if provided
      let normalizedProfileImage = user.profile_image;
      if (Object.prototype.hasOwnProperty.call(req.body, 'profile_image')) {
        if (!profile_image) {
          normalizedProfileImage = null;
        } else if (typeof profile_image !== 'string' || !profile_image.startsWith('data:image/')) {
          return res.status(400).json({ error: 'Invalid profile image format' });
        } else {
          const base64Payload = profile_image.split(',')[1] || '';
          if (base64Payload.length > 500000) {
            return res.status(400).json({ error: 'Profile image too large (max 500KB)' });
          }
          normalizedProfileImage = profile_image;
        }
      }

      // Build profile object, preserving existing values for optional fields
      const profile = {
        first_name,
        last_name,
        name: `${first_name} ${last_name}`,
        manager_first_name: manager_first_name !== undefined ? manager_first_name : user.manager_first_name,
        manager_last_name: manager_last_name !== undefined ? manager_last_name : user.manager_last_name,
        manager_email: manager_email !== undefined ? manager_email : user.manager_email,
        profile_image: normalizedProfileImage
      };

      await userDb.updateProfile(user.id, profile);

      // If manager changed, sync assets
      if (manager_email && (manager_email !== user.manager_email || manager_first_name !== user.manager_first_name || manager_last_name !== user.manager_last_name)) {
        await syncAssetOwnership(user.email);

        // Also update manager info on assets
        const assetDb = deps.assetDb;
        if (assetDb) {
          try {
            await assetDb.updateManagerForEmployee(
              user.email,
              manager_first_name !== undefined ? manager_first_name : user.manager_first_name,
              manager_last_name !== undefined ? manager_last_name : user.manager_last_name,
              manager_email
            );
          } catch (err) {
            logger.error({ err, userId: user.id }, 'Failed to sync manager info to assets during profile update');
          }
        }
      }

      const updatedUser = await userDb.getById(user.id);

      // Track which fields were actually updated
      const updatedFields = ['first_name', 'last_name', 'name'];
      if (manager_first_name !== undefined) updatedFields.push('manager_first_name');
      if (manager_last_name !== undefined) updatedFields.push('manager_last_name');
      if (manager_email !== undefined) updatedFields.push('manager_email');
      if (Object.prototype.hasOwnProperty.call(req.body, 'profile_image')) updatedFields.push('profile_image');

      await auditDb.log(
        'UPDATE_PROFILE',
        'user',
        user.id,
        user.email,
        { updated_fields: updatedFields },
        user.email
      );

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          role: updatedUser.role,
          manager_first_name: updatedUser.manager_first_name,
          manager_last_name: updatedUser.manager_last_name,
          manager_email: updatedUser.manager_email,
          profile_image: updatedUser.profile_image,
          profile_complete: Boolean(updatedUser.first_name && updatedUser.last_name && updatedUser.manager_email)
        }
      });
    } catch (error) {
      logger.error({ err: error, userId: req.user?.id }, 'Update profile error');
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // ===== Complete Profile (for OIDC users) =====

  router.post('/complete-profile', authenticate, requireFields('manager_first_name', 'manager_last_name', 'manager_email'), validateEmail('manager_email'), async (req, res) => {
    try {
      const { manager_first_name, manager_last_name, manager_email } = req.body;

      // Get current user
      const user = await userDb.getById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update user with manager information and mark profile as complete
      await userDb.completeProfile(req.user.id, {
        manager_first_name,
        manager_last_name,
        manager_email
      });

      // Get updated user
      const updatedUser = await userDb.getById(req.user.id);

      // Log audit
      await auditDb.log(
        'complete_profile',
        'user',
        updatedUser.id,
        updatedUser.email,
        {
          manager_first_name,
          manager_last_name,
          manager_email
        },
        updatedUser.email
      );

      // Sync manager info to existing assets
      try {
        const assetDb = deps.assetDb;
        if (assetDb) {
          const updatedAssets = await assetDb.updateManagerForEmployee(
            updatedUser.email,
            manager_first_name,
            manager_last_name,
            manager_email
          );

          if (updatedAssets.changes > 0) {
            logger.info({ email: updatedUser.email, changes: updatedAssets.changes }, `Updated manager info for ${updatedAssets.changes} assets for employee ${updatedUser.email}`);

            // Log audit for asset manager sync
            await auditDb.log(
              'update',
              'asset',
              null,
              `Manager synced for ${updatedUser.email}`,
              {
                employee_email: updatedUser.email,
                old_manager_first_name: null,
                old_manager_last_name: null,
                old_manager_email: null,
                new_manager_first_name: manager_first_name,
                new_manager_last_name: manager_last_name,
                new_manager_email: manager_email,
                updated_count: updatedAssets.changes
              },
              updatedUser.email
            );
          }
        }
      } catch (syncError) {
        logger.error({ err: syncError, userId: req.user?.id }, 'Error syncing manager info to assets during profile completion');
        // Don't fail profile completion if asset sync fails
      }

      // Auto-assign manager role if manager exists
      const autoAssignManagerRole = deps.autoAssignManagerRole;
      if (autoAssignManagerRole) {
        try {
          await autoAssignManagerRole(manager_email, updatedUser.email);
        } catch (roleError) {
          logger.error({ err: roleError, userId: req.user?.id }, 'Error auto-assigning manager role during profile completion');
          // Don't fail profile completion if role assignment fails
        }
      }

      res.json({
        message: 'Profile completed successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          manager_first_name: updatedUser.manager_first_name,
          manager_last_name: updatedUser.manager_last_name,
          manager_email: updatedUser.manager_email,
          profile_image: updatedUser.profile_image,
          profile_complete: updatedUser.profile_complete
        }
      });
    } catch (error) {
      logger.error({ err: error, userId: req.user?.id }, 'Complete profile error');
      res.status(500).json({ error: 'Failed to complete profile' });
    }
  });

  // ===== Change Password =====

  router.put('/change-password', authenticate, requireFields('currentPassword', 'newPassword', 'confirmPassword'), async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          error: 'New password and confirmation do not match'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          error: 'New password must be at least 6 characters long'
        });
      }

      // Get current user
      const user = await userDb.getById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password in database
      await userDb.updatePassword(req.user.id, newPasswordHash);

      // Log the password change
      await auditDb.log(
        'change_password',
        'user',
        user.id,
        user.email,
        'Password changed successfully',
        user.email
      );

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      logger.error({ err: error, userId: req.user?.id }, 'Change password error');
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // ===== Email Verification =====

  // Verify email with token (for registration)
  router.post('/verify-email', requireFields('token'), async (req, res) => {
    try {
      const { token } = req.body;

      if (!emailVerificationTokenDb) {
        return res.status(500).json({ error: 'Email verification not configured' });
      }

      const verificationToken = await emailVerificationTokenDb.findByToken(token);

      if (!verificationToken) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      // Check if token is expired
      const expiresAt = new Date(verificationToken.expires_at);
      if (expiresAt < new Date()) {
        return res.status(400).json({ error: 'Verification token has expired' });
      }

      // Check if token has been used
      if (verificationToken.used) {
        return res.status(400).json({ error: 'Verification token has already been used' });
      }

      // Handle based on token type
      if (verificationToken.token_type === 'registration') {
        // Mark email as verified for the user
        if (verificationToken.user_id) {
          await userDb.setEmailVerified(verificationToken.user_id);
        } else {
          // Find user by email and verify
          const user = await userDb.getByEmail(verificationToken.email);
          if (user) {
            await userDb.setEmailVerified(user.id);
          }
        }

        // Mark token as used
        await emailVerificationTokenDb.markAsUsed(verificationToken.id);

        // Get user for audit log
        const user = verificationToken.user_id
          ? await userDb.getById(verificationToken.user_id)
          : await userDb.getByEmail(verificationToken.email);

        if (user) {
          await auditDb.log(
            'EMAIL_VERIFIED',
            'user',
            user.id,
            user.email,
            { verified_at: new Date().toISOString() },
            user.email
          );
        }

        res.json({ message: 'Email verified successfully' });
      } else if (verificationToken.token_type === 'email_change') {
        // Handle email change verification
        if (!verificationToken.user_id) {
          return res.status(400).json({ error: 'Invalid email change token' });
        }

        const user = await userDb.getById(verificationToken.user_id);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        const oldEmail = user.email;
        const newEmail = verificationToken.email;

        // Check if new email is already in use
        const existingUser = await userDb.getByEmail(newEmail);
        if (existingUser && existingUser.id !== user.id) {
          return res.status(409).json({ error: 'Email address is already in use' });
        }

        // Update user's email
        await userDb.updateEmail(user.id, newEmail);

        // Mark token as used
        await emailVerificationTokenDb.markAsUsed(verificationToken.id);

        // Log audit
        await auditDb.log(
          'EMAIL_CHANGED',
          'user',
          user.id,
          newEmail,
          { old_email: oldEmail, new_email: newEmail, changed_at: new Date().toISOString() },
          newEmail
        );

        res.json({ message: 'Email changed successfully', newEmail });
      } else {
        res.status(400).json({ error: 'Unknown token type' });
      }
    } catch (error) {
      logger.error({ err: error }, 'Verify email error');
      res.status(500).json({ error: 'Failed to verify email' });
    }
  });

  // Resend verification email
  router.post('/resend-verification', authenticate, async (req, res) => {
    try {
      const user = await userDb.getById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if email is already verified
      if (user.email_verified) {
        return res.status(400).json({ error: 'Email is already verified' });
      }

      // Check if SMTP is enabled
      if (!smtpSettingsDb || !sendEmailVerificationEmail || !getAppUrl) {
        return res.status(500).json({ error: 'Email service not configured' });
      }

      const smtpSettings = await smtpSettingsDb.get();
      if (!smtpSettings || !smtpSettings.enabled) {
        return res.status(500).json({ error: 'Email service not enabled' });
      }

      // Delete any existing verification tokens for this user
      await emailVerificationTokenDb.deleteByUserId(user.id);

      // Generate new verification token
      const crypto = await import('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store token in database
      await emailVerificationTokenDb.create(
        user.email,
        verificationToken,
        expiresAt.toISOString(),
        'registration',
        user.id
      );

      // Send verification email
      const baseUrl = await getAppUrl();
      const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

      const emailResult = await sendEmailVerificationEmail(user.email, verificationToken, verifyUrl);
      if (!emailResult.success) {
        logger.error({ email: user.email, error: emailResult.error }, 'Failed to resend verification email');
        return res.status(500).json({ error: 'Failed to send verification email' });
      }

      logger.info({ email: user.email }, 'Verification email resent');
      res.json({ message: 'Verification email sent' });
    } catch (error) {
      logger.error({ err: error, userId: req.user?.id }, 'Resend verification error');
      res.status(500).json({ error: 'Failed to resend verification email' });
    }
  });

  // Request email change
  router.post('/request-email-change', authenticate, requireFields('newEmail', 'password'), validateEmail('newEmail'), async (req, res) => {
    try {
      const { newEmail, password } = req.body;

      const user = await userDb.getById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Password is incorrect' });
      }

      // Check if new email is the same as current
      if (newEmail.toLowerCase() === user.email.toLowerCase()) {
        return res.status(400).json({ error: 'New email must be different from current email' });
      }

      // Check if new email is already in use
      const existingUser = await userDb.getByEmail(newEmail);
      if (existingUser) {
        return res.status(409).json({ error: 'Email address is already in use' });
      }

      // Check if SMTP is enabled
      if (!smtpSettingsDb || !sendEmailChangeVerificationEmail || !getAppUrl) {
        return res.status(500).json({ error: 'Email service not configured' });
      }

      const smtpSettings = await smtpSettingsDb.get();
      if (!smtpSettings || !smtpSettings.enabled) {
        return res.status(500).json({ error: 'Email service not enabled' });
      }

      // Delete any existing email change tokens for this user
      await emailVerificationTokenDb.deleteByUserId(user.id);

      // Generate verification token
      const crypto = await import('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store token in database (store the NEW email in the token)
      await emailVerificationTokenDb.create(
        newEmail,
        verificationToken,
        expiresAt.toISOString(),
        'email_change',
        user.id
      );

      // Send verification email to the NEW email address
      const baseUrl = await getAppUrl();
      const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

      const emailResult = await sendEmailChangeVerificationEmail(newEmail, user.email, verificationToken, verifyUrl);
      if (!emailResult.success) {
        logger.error({ email: newEmail, error: emailResult.error }, 'Failed to send email change verification');
        return res.status(500).json({ error: 'Failed to send verification email' });
      }

      await auditDb.log(
        'EMAIL_CHANGE_REQUESTED',
        'user',
        user.id,
        user.email,
        { new_email: newEmail, requested_at: new Date().toISOString() },
        user.email
      );

      logger.info({ email: user.email, newEmail }, 'Email change verification sent');
      res.json({ message: 'Verification email sent to your new email address' });
    } catch (error) {
      logger.error({ err: error, userId: req.user?.id }, 'Request email change error');
      res.status(500).json({ error: 'Failed to request email change' });
    }
  });

  // Check verification token validity (for frontend validation)
  router.get('/verify-email-token/:token', async (req, res) => {
    try {
      const { token } = req.params;

      if (!emailVerificationTokenDb) {
        return res.status(500).json({ valid: false, error: 'Email verification not configured' });
      }

      const verificationToken = await emailVerificationTokenDb.findByToken(token);

      if (!verificationToken) {
        return res.status(400).json({ valid: false, error: 'Invalid verification token' });
      }

      // Check if token is expired
      const expiresAt = new Date(verificationToken.expires_at);
      if (expiresAt < new Date()) {
        return res.status(400).json({ valid: false, error: 'Verification token has expired' });
      }

      // Check if token has been used
      if (verificationToken.used) {
        return res.status(400).json({ valid: false, error: 'Verification token has already been used' });
      }

      res.json({
        valid: true,
        tokenType: verificationToken.token_type,
        email: verificationToken.email
      });
    } catch (error) {
      logger.error({ err: error }, 'Verify email token check error');
      res.status(500).json({ valid: false, error: 'Failed to verify token' });
    }
  });

  return router;
}
