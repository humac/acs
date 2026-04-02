# Discovery Notes

## Asset Owner Repair SOP

- Repository: ACS (Asset Compliance System)
- Backend runtime: Node.js service in `backend/`
- Database configuration comes from environment variables:
  - `DB_CLIENT=sqlite` or `postgres`
  - `POSTGRES_URL` for PostgreSQL
  - `DATA_DIR` for SQLite file storage
- Production backend images copy the full backend source into `/app` and run Node from there
- Repair command added for this workflow:
  - `npm run repair:asset-owners`
- Repair script path:
  - `backend/scripts/repair-asset-owners.js`
- Repair logic path:
  - `backend/services/assetOwnerRepair.js`
- Recovery source used by the repair:
  - Current asset owner fields, when partially present
  - `users` table, when `employee_email` is still known
  - `audit_logs` entries for the same asset, especially `CREATE` logs
- Safety model:
  - Only repairs assets that are clearly broken now
  - Only applies a repair when it can reconstruct a trustworthy owner identity
  - Writes a `REPAIR` audit log for every applied fix
- Limitation:
  - Some assets may remain skipped if neither the current row nor the audit trail contains enough owner data to restore them automatically
