import { fileURLToPath } from 'url';
import { resolve } from 'path';

import { assetDb, auditDb, userDb } from '../database.js';
import { safeJsonParseObject } from '../utils/json.js';
import logger from '../utils/logger.js';

const INVALID_OWNER_VALUES = new Set(['', 'n/a', 'na', 'null', 'undefined', 'unknown']);

const normalizeOwnerValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }

  return INVALID_OWNER_VALUES.has(normalized.toLowerCase()) ? null : normalized;
};

const parseEntityName = (entityName) => {
  const normalized = normalizeOwnerValue(entityName);
  if (!normalized) {
    return { firstName: null, lastName: null };
  }

  const delimiterIndex = normalized.indexOf(' - ');
  const namePart = delimiterIndex >= 0 ? normalized.slice(delimiterIndex + 3).trim() : normalized;
  const cleanName = normalizeOwnerValue(namePart);

  if (!cleanName) {
    return { firstName: null, lastName: null };
  }

  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return { firstName: null, lastName: null };
  }

  return {
    firstName: normalizeOwnerValue(parts[0]),
    lastName: normalizeOwnerValue(parts.slice(1).join(' '))
  };
};

export const isAssetOwnerRepairCandidate = (asset) => {
  if (!asset || asset.owner_id) {
    return false;
  }

  return !normalizeOwnerValue(asset.employee_email)
    || !normalizeOwnerValue(asset.employee_first_name)
    || !normalizeOwnerValue(asset.employee_last_name);
};

export const extractOwnerSnapshotFromAuditLog = (log) => {
  const details = safeJsonParseObject(log?.details, {});
  const changes = details.changes && typeof details.changes === 'object' ? details.changes : {};
  const parsedEntityName = parseEntityName(log?.entity_name);

  return {
    email: normalizeOwnerValue(changes.employee_email)
      || normalizeOwnerValue(details.employee_email),
    firstName: normalizeOwnerValue(changes.employee_first_name)
      || normalizeOwnerValue(details.employee_first_name)
      || parsedEntityName.firstName,
    lastName: normalizeOwnerValue(changes.employee_last_name)
      || normalizeOwnerValue(details.employee_last_name)
      || parsedEntityName.lastName,
    auditId: log?.id ?? null,
    action: log?.action ?? null,
    timestamp: log?.timestamp ?? null
  };
};

const findNamesForEmailInLogs = (logs, email) => {
  const normalizedEmail = normalizeOwnerValue(email)?.toLowerCase();
  if (!normalizedEmail) {
    return { firstName: null, lastName: null };
  }

  for (const log of logs) {
    const snapshot = extractOwnerSnapshotFromAuditLog(log);
    if (snapshot.email?.toLowerCase() !== normalizedEmail) {
      continue;
    }

    if (snapshot.firstName && snapshot.lastName) {
      return {
        firstName: snapshot.firstName,
        lastName: snapshot.lastName
      };
    }
  }

  return { firstName: null, lastName: null };
};

export const resolveOwnerRepairSnapshot = async (asset, logs, users = userDb) => {
  const currentSnapshot = {
    email: normalizeOwnerValue(asset.employee_email),
    firstName: normalizeOwnerValue(asset.employee_first_name),
    lastName: normalizeOwnerValue(asset.employee_last_name)
  };

  let candidateEmail = currentSnapshot.email;
  let sourceAuditId = null;
  let sourceAction = currentSnapshot.email ? 'current_asset' : null;

  if (!candidateEmail) {
    for (const log of logs) {
      const snapshot = extractOwnerSnapshotFromAuditLog(log);
      if (!snapshot.email) {
        continue;
      }

      candidateEmail = snapshot.email;
      sourceAuditId = snapshot.auditId;
      sourceAction = snapshot.action;
      currentSnapshot.firstName = currentSnapshot.firstName || snapshot.firstName;
      currentSnapshot.lastName = currentSnapshot.lastName || snapshot.lastName;
      break;
    }
  }

  if (!candidateEmail) {
    return null;
  }

  let firstName = currentSnapshot.firstName;
  let lastName = currentSnapshot.lastName;

  const matchedUser = await users.getByEmail(candidateEmail);
  if (matchedUser) {
    firstName = firstName || normalizeOwnerValue(matchedUser.first_name);
    lastName = lastName || normalizeOwnerValue(matchedUser.last_name);
  }

  if (!firstName || !lastName) {
    const historicalNames = findNamesForEmailInLogs(logs, candidateEmail);
    firstName = firstName || historicalNames.firstName;
    lastName = lastName || historicalNames.lastName;
  }

  if (!firstName || !lastName) {
    return null;
  }

  return {
    email: candidateEmail,
    firstName,
    lastName,
    sourceAuditId,
    sourceAction,
    matchedUserId: matchedUser?.id ?? null
  };
};

export const repairAssetOwners = async (options = {}, deps = {}) => {
  const {
    apply = false,
    assetId = null,
    limit = null
  } = options;

  const assets = deps.assetDb || assetDb;
  const audits = deps.auditDb || auditDb;
  const users = deps.userDb || userDb;

  const allAssets = assetId
    ? [await assets.getById(assetId)].filter(Boolean)
    : await assets.getAll();

  const candidates = allAssets.filter(isAssetOwnerRepairCandidate);
  const limitedCandidates = Number.isInteger(limit) && limit > 0
    ? candidates.slice(0, limit)
    : candidates;

  const summary = {
    apply,
    scanned: allAssets.length,
    candidates: limitedCandidates.length,
    repaired: 0,
    skipped: 0,
    skippedNoRecoveryData: 0,
    results: []
  };

  for (const candidate of limitedCandidates) {
    const logs = await audits.getByEntity('asset', candidate.id);
    const resolved = await resolveOwnerRepairSnapshot(candidate, logs, users);

    if (!resolved) {
      summary.skipped += 1;
      summary.skippedNoRecoveryData += 1;
      summary.results.push({
        assetId: candidate.id,
        serialNumber: candidate.serial_number,
        status: 'skipped',
        reason: 'No trustworthy owner identity found in current data or audit history'
      });
      continue;
    }

    const repairRecord = {
      assetId: candidate.id,
      serialNumber: candidate.serial_number,
      status: apply ? 'repaired' : 'dry-run',
      from: {
        employee_first_name: candidate.employee_first_name || '',
        employee_last_name: candidate.employee_last_name || '',
        employee_email: candidate.employee_email || '',
        owner_id: candidate.owner_id || null
      },
      to: {
        employee_first_name: resolved.firstName,
        employee_last_name: resolved.lastName,
        employee_email: resolved.email,
        owner_id: resolved.matchedUserId
      },
      sourceAuditId: resolved.sourceAuditId,
      sourceAction: resolved.sourceAction
    };

    if (apply) {
      await assets.update(candidate.id, {
        employee_first_name: resolved.firstName,
        employee_last_name: resolved.lastName,
        employee_email: resolved.email
      });

      const updatedAsset = await assets.getById(candidate.id);
      repairRecord.to.owner_id = updatedAsset?.owner_id ?? resolved.matchedUserId;

      await audits.log(
        'REPAIR',
        'asset',
        candidate.id,
        `${candidate.serial_number} - ${resolved.firstName} ${resolved.lastName}`,
        {
          repair_type: 'owner_identity_backfill',
          previous_owner: repairRecord.from,
          restored_owner: repairRecord.to,
          source_audit_id: resolved.sourceAuditId,
          source_action: resolved.sourceAction
        },
        'system'
      );

      summary.repaired += 1;
    }

    summary.results.push(repairRecord);
  }

  logger.info({
    scanned: summary.scanned,
    candidates: summary.candidates,
    repaired: summary.repaired,
    skipped: summary.skipped,
    apply
  }, 'Asset owner repair run completed');

  return summary;
};

export const formatRepairSummary = (summary) => {
  const formatName = (firstName, lastName) => [firstName, lastName].filter(Boolean).join(' ').trim() || 'blank';
  const lines = [
    `Mode: ${summary.apply ? 'apply' : 'dry-run'}`,
    `Scanned assets: ${summary.scanned}`,
    `Repair candidates: ${summary.candidates}`,
    `Repaired: ${summary.repaired}`,
    `Skipped: ${summary.skipped}`
  ];

  if (summary.results.length > 0) {
    lines.push('');
    lines.push('Details:');
    for (const result of summary.results) {
      if (result.status === 'skipped') {
        lines.push(`- Asset #${result.assetId} (${result.serialNumber}): skipped, ${result.reason}`);
        continue;
      }

      lines.push(
        `- Asset #${result.assetId} (${result.serialNumber}): ${result.status}, `
        + `${formatName(result.from.employee_first_name, result.from.employee_last_name)} -> `
        + `${formatName(result.to.employee_first_name, result.to.employee_last_name)} `
        + `(${result.from.employee_email || 'blank'} -> ${result.to.employee_email})`
      );
    }
  }

  return lines.join('\n');
};

const isDirectRun = (() => {
  if (!process.argv[1]) return false;
  try {
    return fileURLToPath(import.meta.url) === resolve(process.argv[1]);
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  logger.warn('Run backend/scripts/repair-asset-owners.js instead of invoking assetOwnerRepair.js directly');
}
