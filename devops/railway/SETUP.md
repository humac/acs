# Railway Setup Guide

Complete guide for initial Railway setup and ACS deployment.

> **Note:** For Railway Starter plan deployment (no private networking), see [STARTER-PLAN-SETUP.md](STARTER-PLAN-SETUP.md) for the recommended approach using Dockerfile with Nginx.

## Prerequisites

- Railway account (sign up at railway.app)
- GitHub account with repository access
- Railway CLI installed
- Node.js 22 LTS (local development)

## Initial Setup

### 1. Install Railway CLI

```bash
# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh

# Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex

# Verify
railway --version
```

### 2. Create Railway Project

**Via Dashboard:**
1. Login to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `humac/acs`
5. Select your branch (`main`, `kars-prod`, or `kars-dev`)

**Via CLI:**
```bash
cd /path/to/acs
railway login
railway init
railway link
```

### 3. Add PostgreSQL Database

1. In Railway Dashboard → Add Service
2. Select "Database" → "PostgreSQL"
3. Database automatically provisions
4. `DATABASE_URL` automatically injected into services

### 4. Configure Environment Variables

**Backend Variables:**
```bash
# Required variables
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
railway variables set NODE_ENV=production
railway variables set ADMIN_EMAIL=admin@yourdomain.com
railway variables set BASE_URL=https://your-backend.up.railway.app
railway variables set FRONTEND_URL=https://your-frontend.up.railway.app
railway variables set DB_CLIENT=postgres

# Database (auto-injected by Railway)
# DATABASE_URL=postgresql://...

# Optional
railway variables set ACS_MASTER_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
```

**Frontend Variables (for Dockerfile deployment):**
```bash
railway variables set NODE_ENV=production
railway variables set BACKEND_URL=https://your-backend.up.railway.app
railway variables set PORT=80
```

**Note:** Replace `your-backend.up.railway.app` and `your-frontend.up.railway.app` with your actual Railway-provided URLs.

### 5. Configure Custom Domain

1. Railway Dashboard → Frontend Service → Settings
2. Domains → Add Custom Domain
3. Enter your domain (e.g., `acs.yourdomain.com`)
4. Add CNAME record in your DNS provider:
   - Name: `acs` (or your subdomain)
   - Target: `[service-name].up.railway.app`
5. SSL automatically provisioned

**Important:** After setting up custom domains, update environment variables:
- Backend `BASE_URL` and `FRONTEND_URL`
- Backend `PASSKEY_RP_ID` and `PASSKEY_ORIGIN`
- Frontend `BACKEND_URL` (if backend has custom domain)

## Service Configuration

### Backend Service

**Configuration:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**Root Directory:** `/backend`

### Frontend Service (Dockerfile Approach - Recommended)

**Configuration:**
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "/frontend/Dockerfile"
  }
}
```

**Root Directory:** `/frontend`

**Environment Variables:**
- `BACKEND_URL`: Full public URL of backend (e.g., `https://backend.up.railway.app`)
- `NODE_ENV`: `production`
- `PORT`: `80`

**Note:** This uses Nginx to serve the React SPA and proxy `/api` requests to the backend. See [STARTER-PLAN-SETUP.md](STARTER-PLAN-SETUP.md) for details.

### Alternative: Frontend Service (Nixpacks with Vite Preview)

**Configuration:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci && npm run build"
  },
  "deploy": {
    "startCommand": "npx serve -s dist -l $PORT"
  }
}
```

**Note:** This approach serves static files only and doesn't proxy API requests. You'll need to configure CORS on the backend to accept requests from the frontend domain.

## Verification

```bash
# Check deployment status
railway status

# View logs
railway logs

# Test health endpoint (replace with your URL)
curl https://your-backend.up.railway.app/api/health

# Test database
railway run psql $DATABASE_URL -c "SELECT 1;"
```

## Next Steps

- [Starter Plan Setup](STARTER-PLAN-SETUP.md) - Recommended approach for Starter plan
- [Configuration](CONFIGURATION.md) - Customize settings
- [Database](DATABASE.md) - Database management
- [Deployment](DEPLOYMENT.md) - Deploy updates

---

**Last Updated:** January 2026
