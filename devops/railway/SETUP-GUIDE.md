# Railway Setup Guide for KARS

Complete step-by-step guide for deploying KARS (KeyData Asset Registration System) to Railway.

> **⭐ Recommended:** If you're using Railway's Starter plan (no private networking), see [STARTER-PLAN-SETUP.md](STARTER-PLAN-SETUP.md) for a streamlined guide focused on public URL communication.

**Project:** ACS - Asset Compliance System  
**Code Name:** KARS  
**Repository:** humac/acs  
**Domains:** 
- Production: kars.keydatalab.ca
- Development: kars-dev.keydatalab.ca

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Account Setup](#account-setup)
3. [Project Structure Overview](#project-structure-overview)
4. [Database Setup](#database-setup)
5. [Backend Service Configuration](#backend-service-configuration)
6. [Frontend Service Configuration](#frontend-service-configuration)
7. [Service Linking](#service-linking)
8. [Custom Domain Setup](#custom-domain-setup)
9. [Environment Variables](#environment-variables)
10. [Deployment Verification](#deployment-verification)
11. [Common Issues](#common-issues)

---

## Prerequisites

### Required Accounts
- [ ] Railway account (https://railway.app)
- [ ] GitHub account with access to humac/acs repository
- [ ] Domain registrar access (for kars.keydatalab.ca)
- [ ] DNS management access (Cloudflare/Route53/etc.)

### Required Tools
- [ ] Railway CLI installed
  ```bash
  # macOS/Linux
  curl -fsSL https://railway.app/install.sh | sh
  
  # Windows (PowerShell)
  iwr https://railway.app/install.ps1 | iex
  
  # Verify installation
  railway --version
  ```
- [ ] Git (version control)
- [ ] Node.js 22 LTS (for local testing)
- [ ] curl or Postman (API testing)

### Required Knowledge
- [ ] Basic Railway concepts (services, environments, deployments)
- [ ] Environment variables and secrets management
- [ ] DNS configuration (CNAME records)
- [ ] Basic PostgreSQL administration

---

## Account Setup

### 1. Create Railway Account

1. Visit https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your GitHub account
4. Complete profile setup
5. Choose plan:
   - **Hobby Plan ($5/month):** Good for testing
   - **Pro Plan ($20/month):** Recommended for production

### 2. Install Railway CLI

```bash
# Login to Railway
railway login

# This opens browser for authentication
# Complete GitHub OAuth flow
```

### 3. Link to GitHub Repository

```bash
# Clone repository (if not already)
git clone https://github.com/humac/acs.git
cd acs

# Checkout production branch
git checkout kars-prod
```

---

## Project Structure Overview

KARS requires **two separate Railway projects** (one for production, one for development):

### Production Environment
```
Railway Project: kars-production
├── kars-backend-prod (Backend service)
│   ├── Root directory: /backend
│   ├── Branch: kars-prod
│   ├── Database: kars (PostgreSQL)
│   └── Domain: api.kars.keydatalab.ca (optional)
├── kars-frontend-prod (Frontend service)
│   ├── Root directory: /frontend
│   ├── Branch: kars-prod
│   └── Domain: kars.keydatalab.ca
└── kars-db-prod (PostgreSQL database)
    └── Database name: kars
```

### Development Environment
```
Railway Project: kars-development
├── kars-backend-dev (Backend service)
│   ├── Root directory: /backend
│   ├── Branch: kars-dev
│   ├── Database: kars_dev (PostgreSQL)
│   └── Domain: api-dev.kars.keydatalab.ca (optional)
├── kars-frontend-dev (Frontend service)
│   ├── Root directory: /frontend
│   ├── Branch: kars-dev
│   └── Domain: kars-dev.keydatalab.ca
└── kars-db-dev (PostgreSQL database)
    └── Database name: kars_dev
```

---

## Database Setup

### Step 1: Create Production PostgreSQL Database

1. **In Railway Dashboard:**
   - Click "New Project"
   - Name: `kars-production`
   - Click "Add Service" → "Database" → "PostgreSQL"

2. **Configure Database:**
   - Service name: `kars-db-prod`
   - PostgreSQL version: 15 (default)
   - Click "Add PostgreSQL"

3. **Wait for Provisioning:**
   - Railway provisions database (~30 seconds)
   - Note the connection details
   - `DATABASE_URL` is automatically created

4. **Verify Database:**
   ```bash
   # Link to project
   railway link
   # Select: kars-production
   
   # Connect to database
   railway run psql $DATABASE_URL
   
   # In psql:
   \l              # List databases
   \q              # Quit
   ```

### Step 2: Create Development PostgreSQL Database

Repeat the above steps for development:
- Project name: `kars-development`
- Service name: `kars-db-dev`

---

## Backend Service Configuration

### Production Backend Setup

#### Step 1: Add Backend Service

1. **In Railway Dashboard → kars-production project:**
   - Click "New Service" → "GitHub Repo"
   - Select repository: `humac/acs`
   - Configure service:
     - Name: `kars-backend-prod`
     - Branch: `kars-prod`
     - Root Directory: `/backend`

2. **Configure Build Settings:**
   ```yaml
   # Railway auto-detects these from package.json
   Builder: Nixpacks
   Build Command: npm ci --only=production
   Start Command: node server.js
   ```

3. **Configure Service Settings:**
   - Navigate to service → Settings
   - **Health Check:**
     - Path: `/api/health`
     - Timeout: 30s
     - Interval: 30s
   - **Restart Policy:**
     - Type: ON_FAILURE
     - Max Retries: 10

#### Step 2: Set Environment Variables

In Railway Dashboard → kars-backend-prod → Variables:

**Required Variables:**
```env
# Node Environment
NODE_ENV=production

# JWT Secret (64+ characters)
JWT_SECRET=<generate-64-char-random-string>

# Database (auto-injected by Railway)
DATABASE_URL=${{kars-db-prod.DATABASE_URL}}
DB_CLIENT=postgres

# Application URLs
BASE_URL=https://kars.keydatalab.ca
FRONTEND_URL=https://kars.keydatalab.ca

# Admin Configuration
ADMIN_EMAIL=admin@keydatalab.ca

# Port (Railway provides this)
PORT=${{PORT}}
```

**Generate JWT Secret:**
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Optional Variables:**
```env
# Email Encryption (for SMTP passwords)
ACS_MASTER_KEY=<base64-32-byte-key>

# Passkey/WebAuthn Configuration
PASSKEY_RP_ID=kars.keydatalab.ca
PASSKEY_RP_NAME=KARS - KeyData Asset Registration System
PASSKEY_ORIGIN=https://kars.keydatalab.ca

# OIDC/SSO (if using)
OIDC_ENABLED=false
OIDC_ISSUER_URL=
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=

# Attestation Scheduler
RUN_ATTESTATION_SCHEDULER=true

# Proxy Configuration (if behind Cloudflare)
TRUST_PROXY=true
PROXY_TYPE=cloudflare
```

**Generate Master Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Step 3: Verify Backend Configuration

```bash
# Link to backend service
railway link
# Select: kars-production → kars-backend-prod

# Check environment variables
railway variables

# Test build locally (optional)
cd backend
npm ci
npm start

# Deploy to Railway
railway up
```

#### Step 4: Monitor Backend Deployment

```bash
# Watch logs
railway logs --follow

# Look for:
# ✓ Server listening on port 3001
# ✓ Database connected
# ✓ No errors

# Test health endpoint (after deployment)
# Get Railway URL from dashboard
curl https://kars-backend-prod.up.railway.app/api/health
```

### Development Backend Setup

Repeat the above steps with these changes:
- Project: `kars-development`
- Service name: `kars-backend-dev`
- Branch: `kars-dev`
- DATABASE_URL: `${{kars-db-dev.DATABASE_URL}}`
- BASE_URL: `https://kars-dev.keydatalab.ca`
- PASSKEY_RP_ID: `kars-dev.keydatalab.ca`
- PASSKEY_ORIGIN: `https://kars-dev.keydatalab.ca`

---

## Frontend Service Configuration

### Production Frontend Setup

#### Step 1: Add Frontend Service

1. **In Railway Dashboard → kars-production project:**
   - Click "New Service" → "GitHub Repo"
   - Select repository: `humac/acs`
   - Configure service:
     - Name: `kars-frontend-prod`
     - Branch: `kars-prod`
     - Root Directory: `/frontend`

2. **Configure Build Settings:**
   ```yaml
   Builder: Dockerfile
   Dockerfile Path: /frontend/Dockerfile
   ```
   
   Railway will auto-detect the Dockerfile in `/frontend/Dockerfile`.

#### Step 2: Set Environment Variables

In Railway Dashboard → kars-frontend-prod → Variables:

```env
# Node Environment
NODE_ENV=production

# Backend URL for API proxy (use backend's Railway public URL)
BACKEND_URL=https://kars-backend-prod.up.railway.app

# Port
PORT=80
```

**Important Notes:**
- `BACKEND_URL` must be the **full public URL** of your backend service (including `https://`)
- For Railway Starter plan (no private networking), this must be a public URL
- The Nginx configuration will proxy `/api` requests to this URL
- After setting up custom domains, update `BACKEND_URL` accordingly

#### Step 3: Deploy Frontend

```bash
# Link to frontend service
railway link
# Select: kars-production → kars-frontend-prod

# Deploy
railway up

# Watch logs
railway logs --follow

# Test frontend (after deployment)
curl -I https://kars-frontend-prod.up.railway.app
```

### Development Frontend Setup

Repeat the above steps with these changes:
- Project: `kars-development`
- Service name: `kars-frontend-dev`
- Branch: `kars-dev`

---

## Service Linking

### Configure Frontend to Backend Proxy

The frontend needs to proxy `/api` requests to the backend service.

#### Option 1: Backend as Upstream (Recommended)

1. **In Railway Dashboard → kars-frontend-prod → Settings:**
   - Click "Networking"
   - Under "Public Networking," ensure service is accessible

2. **Update Frontend Environment Variables:**
   ```env
   # Reference backend service
   VITE_API_BACKEND_URL=${{kars-backend-prod.RAILWAY_PUBLIC_DOMAIN}}
   ```

3. **Update vite.config.js proxy (for production):**
   ```javascript
   preview: {
     host: '0.0.0.0',
     port: process.env.PORT || 3000,
     proxy: {
       '/api': {
         target: process.env.VITE_API_BACKEND_URL 
           ? `https://${process.env.VITE_API_BACKEND_URL}` 
           : 'http://localhost:3001',
         changeOrigin: true,
         secure: true,
       },
     },
   },
   ```

#### Option 2: Direct API Calls (Alternative)

If proxy doesn't work, configure frontend to make direct API calls:

1. **Update frontend code** to use full backend URL:
   ```javascript
   // In frontend API calls
   const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
   ```

2. **Set environment variable:**
   ```env
   VITE_API_URL=https://kars-backend-prod.up.railway.app/api
   ```

3. **Enable CORS in backend** (backend/server.js):
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
     credentials: true,
   }));
   ```

---

## Custom Domain Setup

### Production Domain (kars.keydatalab.ca)

#### Step 1: Add Domain to Railway

1. **In Railway Dashboard → kars-frontend-prod:**
   - Click "Settings" → "Networking"
   - Click "Custom Domain"
   - Enter: `kars.keydatalab.ca`
   - Click "Add Domain"

2. **Railway provides CNAME target:**
   - Example: `kars-frontend-prod-abc123.up.railway.app`

#### Step 2: Configure DNS

1. **In your DNS provider (e.g., Cloudflare, Route53):**
   - Go to DNS management for `keydatalab.ca`
   - Add CNAME record:
     ```
     Type: CNAME
     Name: kars
     Target: kars-frontend-prod-abc123.up.railway.app
     TTL: Auto (or 300)
     Proxy: OFF (important for SSL)
     ```

2. **Wait for DNS propagation:**
   ```bash
   # Check DNS resolution
   nslookup kars.keydatalab.ca
   
   # Or
   dig kars.keydatalab.ca
   ```

#### Step 3: SSL Certificate

Railway automatically provisions SSL certificate:
- Uses Let's Encrypt
- Automatic renewal
- No configuration needed
- Wait 5-10 minutes after DNS propagation

#### Step 4: Verify Domain

```bash
# Test HTTPS
curl -I https://kars.keydatalab.ca

# Should return 200 OK
# SSL certificate should be valid
```

### Optional: Backend API Domain

If you want a separate API domain (api.kars.keydatalab.ca):

1. **In Railway Dashboard → kars-backend-prod:**
   - Add custom domain: `api.kars.keydatalab.ca`

2. **Add DNS CNAME:**
   ```
   Type: CNAME
   Name: api
   Target: kars-backend-prod-xyz789.up.railway.app
   ```

3. **Update environment variables:**
   ```env
   # In kars-frontend-prod
   VITE_API_URL=https://api.kars.keydatalab.ca/api
   ```

### Development Domain (kars-dev.keydatalab.ca)

Repeat the above steps for development:
- Domain: `kars-dev.keydatalab.ca`
- CNAME target: from `kars-frontend-dev` service
- Optional API: `api-dev.kars.keydatalab.ca`

---

## Environment Variables

### Complete Variable Reference

#### Production Backend (kars-backend-prod)

```env
# === REQUIRED ===
NODE_ENV=production
JWT_SECRET=<64-char-hex-string>
DATABASE_URL=${{kars-db-prod.DATABASE_URL}}
DB_CLIENT=postgres
BASE_URL=https://kars.keydatalab.ca
FRONTEND_URL=https://kars.keydatalab.ca
ADMIN_EMAIL=admin@keydatalab.ca
PORT=${{PORT}}

# === PASSKEYS/WEBAUTHN ===
PASSKEY_RP_ID=kars.keydatalab.ca
PASSKEY_RP_NAME=KARS - KeyData Asset Registration System
PASSKEY_ORIGIN=https://kars.keydatalab.ca

# === ENCRYPTION ===
ACS_MASTER_KEY=<32-byte-base64-string>

# === ATTESTATION ===
RUN_ATTESTATION_SCHEDULER=true

# === PROXY SETTINGS ===
TRUST_PROXY=true
PROXY_TYPE=cloudflare

# === OPTIONAL: OIDC/SSO ===
OIDC_ENABLED=false
OIDC_ISSUER_URL=
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
OIDC_AUTHORIZATION_URL=
OIDC_TOKEN_URL=
OIDC_USERINFO_URL=
OIDC_JWKS_URI=

# === OPTIONAL: HUBSPOT ===
HUBSPOT_ACCESS_TOKEN=
HUBSPOT_REFRESH_TOKEN=
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=

# === OPTIONAL: SMTP ===
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=noreply@keydatalab.ca
SMTP_FROM_NAME=KARS System
```

#### Production Frontend (kars-frontend-prod)

```env
NODE_ENV=production
VITE_API_URL=/api
PORT=${{PORT}}
```

#### Development Backend (kars-backend-dev)

Same as production backend, but with:
```env
BASE_URL=https://kars-dev.keydatalab.ca
FRONTEND_URL=https://kars-dev.keydatalab.ca
PASSKEY_RP_ID=kars-dev.keydatalab.ca
PASSKEY_ORIGIN=https://kars-dev.keydatalab.ca
DATABASE_URL=${{kars-db-dev.DATABASE_URL}}
```

#### Development Frontend (kars-frontend-dev)

Same as production frontend.

---

## Deployment Verification

### Step-by-Step Verification

#### 1. Backend Health Check

```bash
# Production
curl https://kars.keydatalab.ca/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-01-05T10:00:00.000Z"
}

# Development
curl https://kars-dev.keydatalab.ca/api/health
```

#### 2. Frontend Accessibility

```bash
# Production
curl -I https://kars.keydatalab.ca

# Should return:
# HTTP/2 200
# Content-Type: text/html

# Development
curl -I https://kars-dev.keydatalab.ca
```

#### 3. Database Connectivity

```bash
# Link to backend service
railway link
# Select: kars-production → kars-backend-prod

# Check database connection
railway logs | grep -i "database"

# Should see: "Database connected" or similar
```

#### 4. API Endpoints

```bash
# Test public endpoint (should require auth)
curl https://kars.keydatalab.ca/api/companies

# Expected: 401 Unauthorized (this is correct)

# Test auth endpoint
curl -X POST https://kars.keydatalab.ca/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Expected: Error message (no user exists yet)
```

#### 5. Browser Testing

1. **Open Production:**
   - Navigate to: https://kars.keydatalab.ca
   - Should see: KARS login page
   - No console errors
   - Check SSL certificate (🔒 in address bar)

2. **Register First User:**
   - Click "Register"
   - Create account with ADMIN_EMAIL
   - Should automatically be admin

3. **Test Login:**
   - Login with new account
   - Should redirect to dashboard
   - Check JWT token in localStorage

4. **Test Asset Management:**
   - Create test asset
   - View asset list
   - Edit asset
   - Delete asset

5. **Test Admin Functions:**
   - Access Admin Settings
   - View Users list
   - View Companies list
   - Check Audit Logs

#### 6. Railway Dashboard Verification

1. **Check Service Status:**
   - All services should be "Active"
   - No build failures
   - No crashes

2. **Check Logs:**
   ```bash
   # Backend logs
   railway link kars-backend-prod
   railway logs --tail=100 | grep -i error

   # Should have no critical errors
   ```

3. **Check Metrics:**
   - CPU usage < 50%
   - Memory usage < 70%
   - No frequent restarts

---

## Common Issues

### Issue 1: Backend Won't Start

**Symptoms:**
- Service status: "Crashed"
- Logs show: "Error: JWT_SECRET is required"

**Solution:**
```bash
# Verify JWT_SECRET is set
railway link kars-backend-prod
railway variables | grep JWT_SECRET

# If missing, add it:
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Restart service
railway restart
```

### Issue 2: Database Connection Failed

**Symptoms:**
- Logs show: "Error: connect ECONNREFUSED"
- Backend crashes on startup

**Solution:**
```bash
# Check DATABASE_URL is set
railway variables | grep DATABASE_URL

# Should show: ${{kars-db-prod.DATABASE_URL}}

# Verify database service is running
railway status

# Test database connection
railway run psql $DATABASE_URL -c "SELECT 1;"
```

### Issue 3: Frontend Shows Blank Page

**Symptoms:**
- White screen
- Console errors: "Failed to fetch"

**Solution:**
1. **Check build output:**
   ```bash
   railway link kars-frontend-prod
   railway logs | grep -i "build"
   ```

2. **Verify preview command:**
   - Check `package.json` has `"preview": "vite preview"`
   - Check start command: `npm run preview -- --host 0.0.0.0 --port $PORT`

3. **Check API proxy:**
   - Verify backend is accessible
   - Check CORS configuration

### Issue 4: API Calls Fail (CORS Error)

**Symptoms:**
- Console: "Access to fetch...blocked by CORS"
- API requests return 403

**Solution:**
1. **Update backend CORS** (backend/server.js):
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
     credentials: true,
   }));
   ```

2. **Redeploy backend:**
   ```bash
   railway up
   ```

### Issue 5: Custom Domain Not Working

**Symptoms:**
- DNS resolves but SSL error
- "Your connection is not private"

**Solution:**
1. **Check DNS configuration:**
   ```bash
   nslookup kars.keydatalab.ca
   # Should return Railway IP
   ```

2. **Verify CNAME:**
   - Must point to Railway provided domain
   - Proxy must be OFF (if using Cloudflare)

3. **Wait for SSL:**
   - Railway takes 5-10 minutes to provision SSL
   - Check Railway dashboard for certificate status

4. **Force SSL renewal** (if stuck):
   - Remove custom domain
   - Wait 5 minutes
   - Re-add custom domain

### Issue 6: Port Binding Error

**Symptoms:**
- Logs: "Error: listen EADDRINUSE: address already in use"

**Solution:**
1. **Update backend/server.js:**
   ```javascript
   const PORT = process.env.PORT || 3001;
   app.listen(PORT, '0.0.0.0', () => {
     console.log(`Server listening on port ${PORT}`);
   });
   ```

2. **Ensure binding to 0.0.0.0:**
   - Railway requires binding to `0.0.0.0`, not `localhost`

### Issue 7: Environment Variables Not Loading

**Symptoms:**
- `process.env.VARIABLE` is undefined
- Application uses default values

**Solution:**
1. **Check variable name:**
   - Must match exactly (case-sensitive)
   - No typos

2. **Restart service after adding variables:**
   ```bash
   railway restart
   ```

3. **Verify in logs:**
   ```bash
   railway logs | grep "Environment"
   ```

---

## Next Steps

After successful setup:

1. **Configure Branch Protection:**
   - Protect `kars-prod` branch
   - Require PR reviews
   - Enable status checks

2. **Set Up Monitoring:**
   - Configure Railway alerts
   - Set up Teams webhook for deploy notifications
   - Monitor error rates

3. **Test Deployment Pipeline:**
   - Push to `kars-dev` → verify auto-deploy
   - Push to `kars-prod` → verify auto-deploy
   - Test rollback procedure

4. **Document Custom Configuration:**
   - Environment-specific settings
   - Integration credentials
   - Access control policies

5. **Train Team:**
   - Railway dashboard access
   - Deployment procedures
   - Incident response

---

## Additional Resources

- **Railway Documentation:** https://docs.railway.app
- **Railway Status:** https://status.railway.app
- **Railway Discord:** https://discord.gg/railway
- **KARS Repository:** https://github.com/humac/acs
- **DevOps Documentation:** [/devops](../)

---

**Last Updated:** January 2025  
**Maintained By:** DevOps Team  
**Project:** KARS (KeyData Asset Registration System)  
**Repository:** https://github.com/humac/acs
