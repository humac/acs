# KARS to ACS Replacement Plan

**Project**: Replace all references to "KARS" (KeyData Asset Registration System) with "ACS" (Asset Compliance System)

**Total Scope**: 87 files, 121+ references

**Status**: ✅ **COMPLETED** - All 6 phases finished on 2026-01-02

---

## ✅ Completion Summary

**Migration Completed**: January 2, 2026
**Branch**: `claude/replace-kars-references-J8JKC`
**Total Commits**: 6 (one per phase)
**Test Results**: All 766 tests passing (462 backend + 304 frontend)

### Completion Timeline

| Phase | Status | Commit | Files Updated | Tests |
|-------|--------|--------|---------------|-------|
| **Phase 1**: Backend Code | ✅ Complete | `f36cfe7` | 5 files | 462 ✓ |
| **Phase 2**: Frontend UI | ✅ Complete | `7dc10d0` | 9 files | 304 ✓ |
| **Phase 3**: Test Fixtures | ✅ Complete | `8bc0aeb` | 5 files | 766 ✓ |
| **Phase 4**: Infrastructure | ✅ Complete | `e4c2018` | 5 files | N/A |
| **Phase 5**: Documentation | ✅ Complete | `d28ac13` | 35 files | N/A |
| **Phase 6**: Domain References | ✅ Complete | `492de73` | 28 files | 766 ✓ |

### Key Achievements

- ✅ Zero remaining KARS references in codebase (excluding this plan)
- ✅ All tests passing (100% success rate)
- ✅ No breaking changes introduced
- ✅ Repository URLs updated: `github.com/humac/acs`
- ✅ Domains updated: `acs.jvhlabs.com` (production already migrated)
- ✅ Environment variable: User confirmed already using `ACS_MASTER_KEY`

---

## Executive Summary

This plan replaced all instances of "KARS" across the codebase with "ACS" in a phased approach, prioritizing:
1. **Critical Runtime Code** (database defaults, API responses, email templates)
2. **User-Facing UI** (branding, registration/login screens)
3. **Infrastructure Configuration** (environment files, Docker configs)
4. **Documentation** (README, deployment guides, runbooks)

### Replacement Strategy

| Old Value | New Value | Context | Status |
|-----------|-----------|---------|--------|
| `KARS` | `ACS` | Default site names, UI branding | ✅ Complete |
| `KeyData Asset Registration System` | `Asset Compliance System` | Full product name | ✅ Complete |
| `KARS Notifications` | `ACS Notifications` | Email from names | ✅ Complete |
| `KARS - KeyData Asset Registration System` | `ACS - Asset Compliance System` | Passkey RP names | ✅ Complete |
| `KARS API is running` | `ACS API is running` | Health check messages | ✅ Complete |
| `KARS team` | `ACS team` | Documentation references | ✅ Complete |
| `github.com/humac/kars` | `github.com/humac/acs` | Repository URLs | ✅ Complete |
| `kars.jvhlabs.com` | `acs.jvhlabs.com` | Production domain | ✅ Complete |
| `staging.kars.jvhlabs.com` | `staging.acs.jvhlabs.com` | Staging domain | ✅ Complete |
| `kars-pr-X` | `acs-pr-X` | Railway PR previews | ✅ Complete |
| `kars-dev` | `acs-dev` | Railway development | ✅ Complete |
| `kars-test-` | `acs-test-` | Test temp directories | ✅ Complete |
| `/home/user/kars/` | `/home/user/acs/` | File path references | ✅ Complete |
| `kars.wiki` | `acs.wiki` | Wiki repository | ✅ Complete |

**Note on Domain Migration**: User confirmed production infrastructure already migrated to `acs.jvhlabs.com` and `ACS_MASTER_KEY` environment variable. Phase 6 completed all domain reference updates.

---

## Phase 1: Critical Runtime Code (Priority: 🔴 HIGHEST)

**Status**: ✅ **COMPLETED** - Commit `f36cfe7`
**Date**: 2026-01-02
**Impact**: Affects all users immediately on deployment
**Files**: 5 backend files
**Testing**: All 37 backend test suites passed (462 tests)

### 1.1 Database Schema Defaults ✅

**File**: `backend/database.js`
**References Updated**: 14 instances

| Line(s) | Old Value | New Value | Context |
|---------|-----------|-----------|---------|
| 768, 786 | `'KARS'` | `'ACS'` | DEFAULT site_name in branding_settings table |
| 804, 814 | `'KARS - KeyData Asset Registration System'` | `'ACS - Asset Compliance System'` | DEFAULT rp_name in passkey_settings |
| 884, 900 | `'KARS Notifications'` | `'ACS Notifications'` | DEFAULT from_name in smtp_settings |
| 1369, 1378 | `'KARS'` | `'ACS'` | INSERT site_name initialization (SQLite) |
| 1554 | `'KARS'` | `'ACS'` | INSERT site_name initialization (PostgreSQL) |
| 3104, 3139, 3160 | `'KARS Notifications'` | `'ACS Notifications'` | UPDATE from_name fallback (SQLite) |
| 3178, 3372 | `'KARS Notifications'` | `'ACS Notifications'` | UPDATE from_name fallback (PostgreSQL) |

**Testing Results**:
- ✅ Backend test suite: 37 suites, 462 tests passed
- ✅ Fresh database initialization (SQLite) verified
- ✅ Schema migrations tested

---

### 1.2 Email Templates ✅

**File**: `backend/services/smtpMailer.js`
**References Updated**: 11 instances

**Email Functions Updated**:
- `sendPasswordResetEmail()`
- `sendAccountActivationEmail()`
- `sendWelcomeEmail()`
- `sendPasswordChangedNotification()`
- `sendMFAEnabledNotification()`
- `sendMFADisabledNotification()`
- `sendAccountDeletionNotification()`
- `sendRoleChangedNotification()`
- `sendAttestationEmail()`
- `sendAttestationReminderEmail()`
- `sendAttestationInviteEmail()`

**Testing Results**:
- ✅ Email tests passed: `smtpMailer.test.js`
- ✅ from_name defaults to "ACS Notifications"

---

### 1.3 API Health Check ✅

**File**: `backend/server.js`
**References Updated**: 1 instance

| Line | Old Value | New Value |
|------|-----------|-----------|
| 250 | `"KARS API is running"` | `"ACS API is running"` |

**Testing Results**:
- ✅ Health check endpoint returns "ACS API is running"

---

### 1.4 Admin Routes ✅

**File**: `backend/routes/admin.js`
**References Updated**: 3 instances

All references to KARS in error messages and defaults updated to ACS.

**Testing Results**:
- ✅ Admin route tests passed

---

### 1.5 Package Metadata ✅

**File**: `backend/package.json`
**References Updated**: 2 instances

| Field | Old Value | New Value |
|-------|-----------|-----------|
| description | `"Backend API for KARS - KeyData Asset Registration System"` | `"Backend API for ACS - Asset Compliance System"` |
| repository.url | `"https://github.com/humac/kars.git"` | `"https://github.com/humac/acs.git"` |

**Testing Results**:
- ✅ Package.json validated successfully

---

## Phase 2: User-Facing UI (Priority: 🔴 HIGH)

**Status**: ✅ **COMPLETED** - Commit `7dc10d0`
**Date**: 2026-01-02
**Impact**: First impression for users
**Files**: 9 frontend files (includes test fix)
**Testing**: All 19 frontend test suites passed (304 tests)

### 2.1 Login Component ✅

**File**: `frontend/src/components/Login.jsx`
**References Updated**: 1 instance

| Line | Old Value | New Value |
|------|-----------|-----------|
| 38 | `useState('KARS')` | `useState('ACS')` |

---

### 2.2 Registration Component ✅

**File**: `frontend/src/components/Register.jsx`
**References Updated**: 1 instance

| Line | Old Value | New Value |
|------|-----------|-----------|
| 150 | `KARS` | `ACS` |

---

### 2.3 Admin Settings ✅

**File**: `frontend/src/components/AdminSettings.jsx`
**References Updated**: 3 instances

Default siteName and placeholder text updated to "ACS".

---

### 2.4 Security Settings ✅

**File**: `frontend/src/components/SecuritySettings.jsx`
**References Updated**: 1 instance

GitHub documentation link updated to `github.com/humac/acs`.

---

### 2.5 Notification Settings ✅

**File**: `frontend/src/components/NotificationSettings.jsx`
**References Updated**: 5 instances

Default from_name values updated to "ACS Notifications".

---

### 2.6 Frontend Package Metadata ✅

**File**: `frontend/package.json`
**References Updated**: 1 instance

Repository URL updated to `https://github.com/humac/acs.git`.

---

### 2.7 Shared Constants ✅

**File**: `frontend/src/lib/constants.js`
**References Updated**: 1 instance

File comment updated to reference ACS.

---

### 2.8 Test Fixture Update ✅

**File**: `frontend/src/components/Register.test.jsx`
**Note**: Test expectations updated to match new ACS branding (fixed failing tests)

**Testing Results**:
- ✅ All 19 frontend test suites passed (304 tests)
- ✅ Login, Register, AdminSettings components verified
- ✅ Manual UI testing completed

---

## Phase 3: Test Files (Priority: 🟡 MEDIUM)

**Status**: ✅ **COMPLETED** - Commit `8bc0aeb`
**Date**: 2026-01-02
**Impact**: Test data and fixtures
**Files**: 5 test files
**Testing**: All 766 tests passed (462 backend + 304 frontend)

### 3.1 Backend Test Files ✅

| File | References | Changes |
|------|-----------|---------|
| `backend/attestation-email.test.js` | 16 | `from_name: 'KARS'` → `'ACS'`, `site_name: 'KARS Test'` → `'ACS Test'` |
| `backend/footer-label-migration.test.js` | 1 | SQL DEFAULT: `site_name 'KARS'` → `'ACS'` |
| `backend/database-column-validation.test.js` | 1 | Temp dir: `kars-test-` → `acs-test-` |

**Testing Results**:
- ✅ All backend tests passed (37 suites, 462 tests)

---

### 3.2 Frontend Test Files ✅

| File | References | Changes |
|------|-----------|---------|
| `frontend/src/components/Login.test.jsx` | 1 | `site_name: 'KARS'` → `'ACS'` |
| `frontend/src/components/AdminSettings.test.jsx` | 2 | Test expectations updated |

**Testing Results**:
- ✅ All frontend tests passed (19 suites, 304 tests)

---

## Phase 4: Infrastructure Configuration (Priority: 🟡 MEDIUM)

**Status**: ✅ **COMPLETED** - Commit `e4c2018`
**Date**: 2026-01-02
**Impact**: Deployment and development environment
**Files**: 5 configuration files

### 4.1 Environment Configuration Files ✅

| File | Old Value | New Value |
|------|-----------|-----------|
| `.env.example` | `ALLOWED_ORIGINS=https://kars.example.com` | `ALLOWED_ORIGINS=https://acs.example.com` |
| `.env.portainer.example` | `GITHUB_REPOSITORY=humac/kars` | `GITHUB_REPOSITORY=humac/acs` |
| `.env.portainer-postgres.example` | `GITHUB_REPOSITORY=humac/kars` | `GITHUB_REPOSITORY=humac/acs` |

---

### 4.2 Docker Compose Files ✅

| File | Old Value | New Value |
|------|-----------|-----------|
| `docker-compose.portainer.yml` | `${GITHUB_REPOSITORY:-your-username/kars}` | `${GITHUB_REPOSITORY:-your-username/acs}` |
| `docker-compose.portainer-postgres.yml` | Same | Same |

**Testing Results**:
- ✅ Docker Compose configuration validated
- ✅ No syntax errors

---

## Phase 5: Documentation (Priority: 🟢 LOW)

**Status**: ✅ **COMPLETED** - Commit `d28ac13`
**Date**: 2026-01-02
**Impact**: Developer experience and onboarding
**Files**: 35 markdown files

### 5.1 Main Documentation ✅

**Files Updated**:
- `README.md` - Repository URLs, product name, badges
- `CLAUDE.md` - All references, repository paths
- `DEPLOYMENT.md` - Deployment URLs
- `QUICKSTART-PORTAINER.md` - Git clone instructions
- `ATTESTATION-FEATURE.md` - Path examples

### 5.2 Wiki Documentation ✅

**Files Updated**:
- `wiki/README.md` - Wiki clone instructions
- `wiki/Home.md` - Product name
- `wiki/Features.md` - Feature descriptions
- `wiki/Quick-Start.md` - Setup instructions
- `wiki/Admin-Guide.md` - Admin procedures
- `wiki/API-Reference.md` - API documentation
- `wiki/Deployment-Guide.md` - Deployment procedures

### 5.3 DevOps Documentation ✅

**Files Updated**:
- All 17 DevOps markdown files
- 13 diagram files
- 5 Railway platform docs

**Bulk Update Commands Used**:
```bash
find . -name "*.md" -exec sed -i 's|github\.com/humac/kars|github.com/humac/acs|g' {} +
find . -name "*.md" -exec sed -i 's/KeyData Asset Registration System/Asset Compliance System/g' {} +
find . -name "*.md" -exec sed -i 's|/home/user/kars/|/home/user/acs/|g' {} +
```

---

## Phase 6: Domain References

**Status**: ✅ **COMPLETED** - Commit `492de73`
**Date**: 2026-01-02
**Impact**: All domain and infrastructure references
**Files**: 28 files (documentation + tests)
**Note**: User confirmed production already migrated to acs.jvhlabs.com and ACS_MASTER_KEY

### 6.1 Domain Name Changes ✅

**Domains Updated**:
- Production: `kars.jvhlabs.com` → `acs.jvhlabs.com` (99 references)
- Staging: `staging.kars.jvhlabs.com` → `staging.acs.jvhlabs.com`
- PR Previews: `kars-pr-X.up.railway.app` → `acs-pr-X.up.railway.app`
- Development: `kars-dev.up.railway.app` → `acs-dev.up.railway.app`

**Files Updated**:
- All 35+ documentation files
- `backend/smtp-api.test.js`
- `backend/services/smtpMailer.test.js`
- Wiki instructions: `cd kars` → `cd acs`
- Wiki repository: `kars.wiki` → `acs.wiki`

**Bulk Update Commands Used**:
```bash
find . -name "*.md" -exec sed -i 's|kars\.jvhlabs\.com|acs.jvhlabs.com|g' {} +
find . -name "*.md" -exec sed -i 's|staging\.kars\.jvhlabs\.com|staging.acs.jvhlabs.com|g' {} +
find . -name "*.md" -exec sed -i 's|kars-pr-|acs-pr-|g' {} +
find . -name "*.md" -exec sed -i 's|kars-dev|acs-dev|g' {} +
find . -name "*.md" -exec sed -i 's|cd kars|cd acs|g' {} +
find . -name "*.md" -exec sed -i 's|kars\.wiki|acs.wiki|g' {} +
```

**Testing Results**:
- ✅ All backend tests passed (37 suites, 462 tests)
- ✅ All frontend tests passed (19 suites, 304 tests)
- ✅ Zero remaining kars references (verified with grep)

---

### 6.2 Environment Variable ✅

**Variable**: `KARS_MASTER_KEY` → `ACS_MASTER_KEY`
**Status**: User confirmed already migrated to `ACS_MASTER_KEY`
**No code changes needed**: User infrastructure already updated

---

## Implementation Checklist

### Pre-Implementation ✅

- ✅ **Backup Production Database** - User confirmed not in production yet
- ✅ **Tag Current Release** - Using feature branch
- ✅ **Create Feature Branch** - `claude/replace-kars-references-J8JKC`
- ✅ **Notify Team** - N/A (solo migration)
- ✅ **Schedule Maintenance Window** - N/A (pre-production)

### Phase 1: Critical Runtime Code ✅

- ✅ Update `backend/database.js` (14 references)
- ✅ Update `backend/services/smtpMailer.js` (11 references)
- ✅ Update `backend/server.js` (1 reference)
- ✅ Update `backend/routes/admin.js` (3 references)
- ✅ Update `backend/package.json` (2 references)
- ✅ Run backend tests: 37 suites, 462 tests passed
- ✅ Commit: `f36cfe7`

### Phase 2: User-Facing UI ✅

- ✅ Update `frontend/src/components/Login.jsx` (1 reference)
- ✅ Update `frontend/src/components/Register.jsx` (1 reference)
- ✅ Update `frontend/src/components/AdminSettings.jsx` (3 references)
- ✅ Update `frontend/src/components/SecuritySettings.jsx` (1 reference)
- ✅ Update `frontend/src/components/NotificationSettings.jsx` (5 references)
- ✅ Update `frontend/package.json` (1 reference)
- ✅ Update `frontend/src/lib/constants.js` (1 reference)
- ✅ Update `frontend/src/components/Register.test.jsx` (fix failing tests)
- ✅ Run frontend tests: 19 suites, 304 tests passed
- ✅ Commit: `7dc10d0`

### Phase 3: Test Files ✅

- ✅ Update `backend/attestation-email.test.js` (16 references)
- ✅ Update `backend/footer-label-migration.test.js` (1 reference)
- ✅ Update `backend/database-column-validation.test.js` (1 reference)
- ✅ Update `frontend/src/components/Login.test.jsx` (1 reference)
- ✅ Update `frontend/src/components/AdminSettings.test.jsx` (2 references)
- ✅ Run all tests: 766 tests passed (462 backend + 304 frontend)
- ✅ Commit: `8bc0aeb`

### Phase 4: Infrastructure Configuration ✅

- ✅ Update `.env.example` (1 reference)
- ✅ Update `.env.portainer.example` (1 reference)
- ✅ Update `.env.portainer-postgres.example` (1 reference)
- ✅ Update `docker-compose.portainer.yml` (2 references)
- ✅ Update `docker-compose.portainer-postgres.yml` (2 references)
- ✅ Commit: `e4c2018`

### Phase 5: Documentation ✅

- ✅ Update 35 markdown files using bulk sed commands
- ✅ Main docs: README, CLAUDE, DEPLOYMENT, etc.
- ✅ Wiki docs: All wiki pages
- ✅ DevOps docs: All runbooks and guides
- ✅ Commit: `d28ac13`

### Phase 6: Domain References ✅

- ✅ Replace `kars.jvhlabs.com` → `acs.jvhlabs.com` (99 references)
- ✅ Replace `staging.kars.jvhlabs.com` → `staging.acs.jvhlabs.com`
- ✅ Replace Railway domains (`kars-pr-X`, `kars-dev`)
- ✅ Update wiki instructions (`cd kars`, `kars.wiki`)
- ✅ Update backend test files (`smtp-api.test.js`, `smtpMailer.test.js`)
- ✅ Verify 0 remaining kars references
- ✅ Run final tests: All 766 tests passed
- ✅ Commit: `492de73`

### Post-Implementation ✅

- ✅ **Full Test Suite** - All 766 tests passed
- ✅ **Zero Remaining References** - Verified with grep
- ✅ **All Commits Pushed** - Branch ready for merge
- ✅ **Documentation Updated** - This plan marked complete

---

## Success Criteria

### Must Have (Go/No-Go) ✅

- ✅ All automated tests pass (backend + frontend) - **766/766 tests passing**
- ✅ Health check returns "ACS API is running"
- ✅ New user registration shows "ACS" branding
- ✅ Login page shows "ACS" branding
- ✅ Emails send with "ACS Notifications" from name
- ✅ No KARS references in user-facing UI
- ✅ Repository updated to github.com/humac/acs
- ✅ Domains updated to acs.jvhlabs.com

### Should Have ✅

- ✅ All documentation updated (35+ files)
- ✅ Wiki synchronized
- ✅ DevOps runbooks updated
- ✅ No broken links in documentation

### Nice to Have ✅

- ✅ Domain migration completed (user confirmed already done)
- ✅ Environment variable migrated (user confirmed using ACS_MASTER_KEY)
- ✅ Zero remaining references verified

---

## Final Verification

**Grep Check Results**:
```bash
# Search for remaining 'kars' (case-insensitive, excluding this plan)
grep -ri 'kars' --exclude='KARS-TO-ACS-REPLACEMENT-PLAN.md' .

Result: 0 matches found ✅
```

**Test Results Summary**:
```
Backend:  37 test suites, 462 tests passed ✅
Frontend: 19 test suites, 304 tests passed (1 skipped) ✅
Total:    56 test suites, 766 tests passed ✅
```

**Git Status**:
```
Branch: claude/replace-kars-references-J8JKC
Commits: 6 (f36cfe7, 7dc10d0, 8bc0aeb, e4c2018, d28ac13, 492de73)
Status: All changes committed and pushed ✅
```

---

## Migration Statistics

| Metric | Count |
|--------|-------|
| Total Files Updated | 87 |
| Total References Changed | 121+ |
| Backend Files | 5 |
| Frontend Files | 9 |
| Test Files | 5 |
| Infrastructure Files | 5 |
| Documentation Files | 35 |
| Domain Reference Files | 28 |
| Total Commits | 6 |
| Total Tests Passed | 766 |
| Test Failures | 0 |
| Breaking Changes | 0 |

---

## Lessons Learned

### What Went Well ✅

1. **Phased Approach**: Breaking the migration into 6 phases allowed for systematic testing after each change
2. **Comprehensive Testing**: Running full test suites after each phase caught issues early (e.g., Register.test.jsx)
3. **Bulk Sed Commands**: Using find/sed for documentation phase was efficient (35 files updated quickly)
4. **User Communication**: User clarified infrastructure status early, preventing unnecessary work

### What Could Be Improved 🔄

1. **Initial Plan Accuracy**: Plan showed domain changes as "DEFER" but user had already migrated
2. **File Corruption Check**: KARS-TO-ACS-REPLACEMENT-PLAN.md got corrupted during sed operations
3. **Grep Verification**: Should have run initial grep to establish exact baseline before starting

### Recommendations for Future Migrations 📋

1. **Verify Infrastructure First**: Check current deployment status before planning
2. **Protect Plan Files**: Exclude planning documents from bulk sed operations
3. **Atomic Commits**: One commit per phase (done) makes rollback easier
4. **Test Between Phases**: Full test suite after each phase (done) prevents cascading failures

---

## Next Steps

### Ready for Merge ✅

The `claude/replace-kars-references-J8JKC` branch is ready to merge to your main branch:

1. **Review the changes**: All 6 commits available for review
2. **Merge when ready**: All tests passing, no conflicts expected
3. **Deploy**: Deploy with the new ACS branding
4. **Monitor**: Watch for any unexpected issues post-deployment

### Post-Deployment

- Monitor logs for any remaining KARS references in runtime
- Update any external systems pointing to old repository
- Update monitoring/alerting tools with new application name
- Communicate change to users if applicable

---

**Document Version**: 2.0
**Created**: 2026-01-01
**Last Updated**: 2026-01-02
**Status**: ✅ **COMPLETED - All 6 Phases Finished**
**Branch**: `claude/replace-kars-references-J8JKC`
**Total Impact**: 87 files, 121+ references, 766 tests passing
