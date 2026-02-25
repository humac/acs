/**
 * Authorization middleware for Express routes
 * Handles resource-level permission checks
 */

import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger({ module: 'authorization' });

/**
 * Middleware factory that fetches an asset and returns 404 if not found.
 * Attaches the asset to req.asset for subsequent middleware/handlers.
 *
 * @param {Object} assetDb - Asset database object
 * @returns {Function} Express middleware function
 *
 * @example
 * router.get('/:id', authenticate, requireAsset(assetDb), handler);
 * // In handler: const asset = req.asset;
 */
export const requireAsset = (assetDb) => async (req, res, next) => {
  try {
    const asset = await assetDb.getById(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    req.asset = asset;
    next();
  } catch (error) {
    logger.error({ err: error, assetId: req.params.id }, 'Error fetching asset');
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
};

/**
 * Middleware factory that checks if user has permission to modify an asset.
 * Must be used after authenticate middleware. Can be used with or without requireAsset.
 *
 * Permission logic:
 * - Admins can always modify any asset
 * - Owners can edit and delete their own assets (all roles including employees)
 *
 * @param {Object} assetDb - Asset database object
 * @param {Object} userDb - User database object
 * @param {Object} options - Configuration options
 * @param {string} [options.action='edit'] - The action being performed ('edit' or 'delete')
 * @returns {Function} Express middleware function
 *
 * @example
 * // For edit operations (owners can edit their own)
 * router.put('/:id', authenticate, requireAssetPermission(assetDb, userDb), handler);
 *
 * // For delete operations (owners can delete their own)
 * router.delete('/:id', authenticate, requireAssetPermission(assetDb, userDb, { action: 'delete' }), handler);
 */
export const requireAssetPermission = (assetDb, userDb, options = {}) => async (req, res, next) => {
  const { action = 'edit' } = options;

  try {
    // Use existing asset from req.asset if available (from requireAsset middleware)
    const asset = req.asset || await assetDb.getById(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    req.asset = asset;

    const user = await userDb.getById(req.user.id);
    const isAdmin = user.role === 'admin';
    const isOwner = asset.employee_email?.toLowerCase() === user.email.toLowerCase();

    // Admins can always perform any action
    if (isAdmin) {
      return next();
    }

    // Check ownership-based permissions
    if (isOwner) {
      // Owners can edit and delete their own assets (all roles)
      return next();
    }

    // Non-admin, non-owner - no permission
    return res.status(403).json({
      error: `You do not have permission to ${action} this asset`
    });
  } catch (error) {
    logger.error({ err: error, assetId: req.params.id, userId: req.user?.id }, 'Error checking asset permission');
    res.status(500).json({ error: 'Failed to check permissions' });
  }
};
