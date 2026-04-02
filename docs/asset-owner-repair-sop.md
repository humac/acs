# ACS Production SOP: Repair Assets Showing `N/A` as Owner

## Table of Contents

1. [Purpose](#purpose)
2. [When to Use This SOP](#when-to-use-this-sop)
3. [What the Repair Does](#what-the-repair-does)
4. [Prerequisites](#prerequisites)
5. [Safety Rules](#safety-rules)
6. [Step 1: Confirm the Fix Is Deployed](#step-1-confirm-the-fix-is-deployed)
7. [Step 2: Take a Production Database Backup](#step-2-take-a-production-database-backup)
8. [Step 3: Open a Shell in the Production Backend Runtime](#step-3-open-a-shell-in-the-production-backend-runtime)
9. [Step 4: Run a Dry Run First](#step-4-run-a-dry-run-first)
10. [Step 5: Review the Dry Run Output](#step-5-review-the-dry-run-output)
11. [Step 6: Apply the Repair](#step-6-apply-the-repair)
12. [Step 7: Verify the Results](#step-7-verify-the-results)
13. [Step 8: Handle Any Skipped Assets](#step-8-handle-any-skipped-assets)
14. [Rollback Plan](#rollback-plan)
15. [Command Reference](#command-reference)

## Purpose

This SOP explains how to repair production assets whose owner shows as `N/A` because the asset’s stored owner fields were previously blanked during self-editing.

## When to Use This SOP

Use this SOP when:

- An asset shows `N/A` for owner name in the UI
- The affected asset no longer has a valid `employee_first_name`, `employee_last_name`, `employee_email`, or `owner_id`
- The backend version containing the repair command has already been deployed

Do not use this SOP for unrelated data problems.

## What the Repair Does

The repair command:

- Scans for assets with broken owner data
- Reconstructs the owner using the asset’s own audit history and, when possible, the `users` table
- Updates the asset only if it can determine a trustworthy owner identity
- Writes a `REPAIR` audit log entry for each asset it changes

The repair command does not guess. If it cannot recover a trustworthy owner, it skips that asset.

## Prerequisites

Before starting, make sure you have:

- Production access to the backend runtime or container
- Permission to take a production database backup
- A maintenance window or at least a low-traffic window
- The production build that includes:
  - `backend/scripts/repair-asset-owners.js`
  - `backend/services/assetOwnerRepair.js`
  - `backend/package.json` script `repair:asset-owners`

## Safety Rules

1. Always run a dry run before `--apply`.
2. Always take a production database backup first.
3. Do not point this command at the wrong environment.
4. Prefer running during a low-traffic period so asset edits are not happening at the same time.
5. If the dry run output looks wrong, stop and investigate before applying anything.

> **Warning:** Do not run `--apply` until you have confirmed the output is from the production database you intend to repair.

## Step 1: Confirm the Fix Is Deployed

From the production backend checkout or runtime image, verify the script exists:

```bash
cd /app/backend
ls scripts/repair-asset-owners.js
```

If your production checkout is not under `/app/backend`, adjust the path accordingly. The important part is that the backend code currently running in production includes the repair script.

You can also verify the npm script exists:

```bash
cd /app/backend
npm run | grep repair:asset-owners
```

## Step 2: Take a Production Database Backup

Take a backup using your normal production backup process before running anything.

Examples:

- PostgreSQL: create a fresh dump or snapshot of the production database
- SQLite: copy the production database file from the configured `DATA_DIR`

Record the following in your change log or ticket:

- Backup timestamp
- Database name or file path
- Environment name
- Person performing the repair

> **Warning:** Do not skip the backup. This SOP modifies production asset records.

## Step 3: Open a Shell in the Production Backend Runtime

Open a shell in the production backend environment where the backend already has the correct production environment variables.

Examples:

- Docker:

```bash
docker exec -it <backend-container-name> sh
```

- Kubernetes:

```bash
kubectl exec -it <backend-pod-name> -- sh
```

- Managed container platform:

Use your platform’s exec or console feature to open a shell in the backend container.

Once inside:

```bash
cd /app/backend
pwd
```

The working directory should contain `package.json`, `server.js`, and `scripts/repair-asset-owners.js`.

## Step 4: Run a Dry Run First

Start with a small sample:

```bash
cd /app/backend
npm run repair:asset-owners -- --limit=20
```

If the sample looks correct, run the full dry run:

```bash
cd /app/backend
npm run repair:asset-owners
```

If you want to inspect one specific asset first:

```bash
cd /app/backend
npm run repair:asset-owners -- --asset-id=123
```

## Step 5: Review the Dry Run Output

The dry run prints:

- Total assets scanned
- Repair candidates found
- How many would be repaired
- How many would be skipped
- A detail line for each candidate

Interpret the results like this:

- `dry-run`: the asset is recoverable and would be repaired if you rerun with `--apply`
- `skipped`: the command could not find enough trustworthy data to restore the owner automatically

You are looking for:

- Correct owner names and emails in the `to:` side of the output
- No suspicious cross-user matches
- A reasonable number of skipped assets

If anything looks wrong, stop here.

## Step 6: Apply the Repair

Once the dry run output looks correct, run the apply command:

```bash
cd /app/backend
npm run repair:asset-owners -- --apply
```

If you want to repair one asset first as a final production check:

```bash
cd /app/backend
npm run repair:asset-owners -- --asset-id=123 --apply
```

What happens during apply:

- The asset owner fields are restored
- `owner_id` is repopulated when the owner email matches a registered user
- A `REPAIR` audit log is created for that asset

## Step 7: Verify the Results

After the repair completes, verify in three ways.

### 1. Re-run a Dry Run

```bash
cd /app/backend
npm run repair:asset-owners
```

Expected result:

- Previously repaired assets should no longer appear as candidates

### 2. Check the UI

In the production ACS UI:

1. Open the Assets page as an admin.
2. Search for several assets that were repaired.
3. Confirm the owner name no longer shows `N/A`.
4. Open a repaired asset and confirm the employee name and email are correct.

### 3. Check the Audit Trail

For any repaired asset, confirm there is a new `REPAIR` audit entry.

This proves the change was applied intentionally and leaves an audit trail for SOC2 evidence.

## Step 8: Handle Any Skipped Assets

Some assets may still be skipped. This means the script could not reconstruct the owner safely from current asset data plus audit history.

For each skipped asset:

1. Note the asset ID and serial number from the dry run output.
2. Review the asset’s history in the UI or database audit logs.
3. Identify the correct owner manually.
4. Update the asset as an admin through the application.
5. Confirm the owner is no longer `N/A`.

If needed, you can run the script again for one asset after manual investigation:

```bash
cd /app/backend
npm run repair:asset-owners -- --asset-id=123 --apply
```

If the asset still skips after investigation, complete that one manually.

> **Note:** A skipped asset is not a script failure. It is the intended safety behavior when there is not enough trustworthy recovery data.

## Rollback Plan

If the apply step produces unexpected results:

1. Stop further repair runs immediately.
2. Record the time of the repair run.
3. Identify the affected assets from the command output and audit logs.
4. Restore from the database backup if the issue is broad.
5. If only a small number of records are affected, correct those assets manually using the audit trail.

Because the repair writes `REPAIR` audit log entries, you can identify exactly which assets were changed by the command.

## Command Reference

Run a small dry run:

```bash
npm run repair:asset-owners -- --limit=20
```

Run a full dry run:

```bash
npm run repair:asset-owners
```

Repair one asset only:

```bash
npm run repair:asset-owners -- --asset-id=123 --apply
```

Apply the repair to all recoverable assets:

```bash
npm run repair:asset-owners -- --apply
```

## Recommended Production Sequence

Use this exact sequence in production:

1. Confirm the repair code is deployed.
2. Take a production database backup.
3. Open a shell in the production backend container.
4. Run `npm run repair:asset-owners -- --limit=20`.
5. Review the sample output carefully.
6. Run `npm run repair:asset-owners`.
7. Review the full dry run output.
8. Run `npm run repair:asset-owners -- --apply`.
9. Re-run `npm run repair:asset-owners` to confirm candidates are gone.
10. Verify repaired assets in the ACS UI and audit logs.
