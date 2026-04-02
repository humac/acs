#!/usr/bin/env node

import { assetDb } from '../database.js';
import { formatRepairSummary, repairAssetOwners } from '../services/assetOwnerRepair.js';

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const readOption = (name) => {
  const exact = `${name}=`;
  const found = args.find((arg) => arg.startsWith(exact));
  return found ? found.slice(exact.length) : null;
};

const apply = hasFlag('--apply');
const assetId = readOption('--asset-id');
const limit = readOption('--limit');

const parsedAssetId = assetId ? Number.parseInt(assetId, 10) : null;
const parsedLimit = limit ? Number.parseInt(limit, 10) : null;

if (assetId && !Number.isInteger(parsedAssetId)) {
  console.error(`Invalid --asset-id value: ${assetId}`);
  process.exit(1);
}

if (limit && (!Number.isInteger(parsedLimit) || parsedLimit <= 0)) {
  console.error(`Invalid --limit value: ${limit}`);
  process.exit(1);
}

await assetDb.init();

const summary = await repairAssetOwners({
  apply,
  assetId: parsedAssetId,
  limit: parsedLimit
});

console.log(formatRepairSummary(summary));

if (!apply) {
  console.log('\nDry run only. Re-run with --apply to persist the repairs.');
}
