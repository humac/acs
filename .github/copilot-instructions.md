# GitHub Copilot Instructions for KARS

## Repository Overview

KARS (KeyData Asset Registration System) is a SOC2-compliant asset tracking web app. ~100MB repo with Node.js backend and React frontend.

**Stack:** Node.js 18 + Express + SQLite/Postgres | React 18 + Vite + Tailwind + shadcn/ui | Jest/Vitest | Docker (ARM64/AMD64)

## Build & Test Commands

### Backend (`/backend`)

**⚠️ CRITICAL: Use Node 18** (`>=18 <19`) - required for native modules (better-sqlite3). Node 20 works but shows warnings. Use `nvm use 18` if errors.

```bash
npm ci                # Install (ALWAYS use ci, not install)
npm test              # Jest tests (5 suites, 67+ tests, ~2s)
npm run dev           # Dev with auto-restart (port 3001)
npm start             # Production
```

**Requirements:** `.env` file with `JWT_SECRET` (copy from `.env.example`)
**Issues:** Missing .env → copy example | Native errors → use Node 18 | DB locked → delete `backend/data/*.db`

### Frontend (`/frontend`)

```bash
npm ci                # Install (use ci, not install)
npm test              # Vitest (4 files, 23+ tests, ~5s)
npm run dev           # Dev server (port 3000, proxies /api to :3001)
npm run build         # Production build (~4s, ~550KB, expect chunk warnings)
```

**Issues:** API errors → ensure backend running | Build warnings about 500KB chunks are normal

### Full Stack Development

**Start backend first, then frontend:**
```bash
cd backend && npm run dev     # Terminal 1
cd frontend && npm run dev    # Terminal 2
# Access: http://localhost:3000
```

## Project Architecture

### Repository Structure

```
/
├── backend/              # Node.js Express API
│   ├── server.js         # Main server (3067 lines) - all API routes
│   ├── database.js       # DB abstraction (1538 lines) - SQLite/Postgres adapters
│   ├── auth.js           # JWT/password auth
│   ├── oidc.js           # SSO/OIDC integration
│   ├── mfa.js            # TOTP 2FA
│   ├── *.test.js         # Jest test files
│   ├── jest.config.js    # Jest configuration
│   ├── Dockerfile        # Production image (Node 18)
│   └── package.json      # Deps: express, better-sqlite3, pg, bcryptjs, jsonwebtoken
│
├── frontend/             # React SPA
│   ├── src/
│   │   ├── App.jsx       # Main app component with routing (344 lines)
│   │   ├── components/   # React components (shadcn/ui primitives)
│   │   │   ├── ui/       # Radix-based UI primitives (button, dialog, table, etc.)
│   │   │   └── *.jsx     # Feature components (Dashboard, AssetTable, etc.)
│   │   ├── pages/        # Page-level components
│   │   ├── contexts/     # React contexts (AuthContext)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Helper functions
│   │   └── test/         # Test setup
│   ├── vite.config.js    # Vite config with API proxy
│   ├── tailwind.config.js
│   ├── Dockerfile        # Multi-stage: build + nginx
│   └── package.json      # Deps: react, react-router-dom, @radix-ui/*
│
├── .github/
│   ├── workflows/
│   │   ├── unit-tests.yml           # Runs on PR/push to main/develop
│   │   ├── verify-files.yml         # Validates critical files exist
│   │   └── deploy-portainer.yml     # Builds multi-arch images, deploys
│   └── verify-critical-files.sh     # Checks file integrity
│
├── docker-compose*.yml   # Various deployment configs
├── AGENTS.md            # Agent-specific guidance (more detailed than this file)
└── README.md            # User-facing documentation
```

### Key Patterns

**Backend:**
- API routes: `/api/*` in `server.js` | DB: `database.js` exports (assetDb, userDb, etc.) | Auth: `authenticate`, `authorize(roles)` | Audit: `auditDb.log()` for all mutations

**Frontend:**
- Router: React Router v7 | Auth: `AuthContext` | UI: shadcn/ui from `components/ui/` | Style: Tailwind | API: `/api/*` (proxied in dev)

## CI/CD & Validation

### GitHub Workflows (`.github/workflows/`)

**unit-tests.yml** - Triggers: Push/PR to main/develop/claude/** | Runs: `npm ci && npm test` in both modules (Node 20) | **MUST pass**

**verify-files.yml** - Triggers: Push/PR to main/develop | Validates critical files complete (server.js ≥2400 lines, database.js ≥1200 lines)

**deploy-portainer.yml** - Triggers: Push to main | Builds multi-platform Docker images → GitHub Container Registry → Portainer webhook

### Before Committing
1. Run `npm test` in changed module(s)
2. Backend: verify server starts | Frontend: run `npm run build`
3. Full stack: test integration manually

## Common Tasks

**New API Endpoint:** Add to `server.js` → use `authenticate`/`authorize()` → log with `auditDb.log()` → return JSON → add tests

**New Component:** Create in `components/` or `pages/` → use shadcn/ui primitives → functional + hooks → @ alias for imports → add tests (mock useToast)

**DB Changes:** Update `database.js` (both SQLite & Postgres) → add migrations in `initDb` → update `.env.example` if needed

**Docker:** `docker-compose up -d` or build individually with `docker build -t name:tag ./path`

## Environment

**Backend `.env`** (copy from `.env.example`):
- `JWT_SECRET` **REQUIRED** - Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `PORT` (default 3001) | `DB_CLIENT` (sqlite/postgres) | `ADMIN_EMAIL` (optional) | OIDC/Passkey (optional)

## Troubleshooting

**Backend won't start:** Check `.env` with JWT_SECRET | Use Node 18 | Delete `backend/data/*.db` | Check port 3001

**Frontend API fails:** Ensure backend running on :3001 | Check vite proxy | Browser console for CORS

**Tests fail:** Run `npm ci` | Use Node 18 (backend) | Delete test DBs | Mock useToast in frontend tests

**Docker fails:** Use Node 18 base (backend) | Test `npm run build` locally | Check `.dockerignore`

**CI fails:** Check Actions logs | Test locally with `npm ci && npm test` | Most common: test/dependency issues

## Security & Best Practices

**Never commit:** .env, secrets | **Always use:** `npm ci` (not install) | **DB changes:** Test both SQLite & Postgres | **Audit:** Log mutations with user ID | **Auth:** Use `authorize()` for protected routes | **Validation:** Sanitize inputs | **Errors:** Don't leak sensitive data

**File monitoring:** `server.js` ≥2400 lines, `database.js` ≥1200 lines (large deletions trigger CI failures)

## Tips for Coding Agents

1. **Trust these instructions** - Don't re-explore unless info seems outdated
2. **Node 18 for backend** - This is the most common build failure cause
3. **Use `npm ci`** - Not `npm install` (CI/CD requirement)
4. **Test incrementally** - Run tests after each change, don't batch
5. **Check both modules** - If API changes, update both backend and frontend
6. **Follow existing patterns** - Code consistency is highly valued
7. **Read AGENTS.md** - More detailed guidelines on code style and architecture
8. **Verify locally** - Always test `npm test` and `npm run build` before committing
