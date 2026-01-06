# Railway Starter Plan Setup Guide

Complete deployment guide for KARS on Railway's **Starter Plan** (no private networking).

## Overview

The Railway Starter plan doesn't include private networking, so services communicate via public URLs. This guide shows the correct configuration for frontend-to-backend communication using public domains with proper SSL.

## Architecture

```
User → Frontend (Nginx) → Backend (Node.js) → PostgreSQL
       (Public URL)        (Public URL)        (Railway Internal)
```

- **Frontend**: Nginx proxies `/api` requests to backend's public URL
- **Backend**: Accepts requests from frontend via CORS
- **Database**: Connected via Railway's internal `DATABASE_URL` reference

## Prerequisites

- Railway account (Starter plan or higher)
- GitHub repository access to humac/acs
- Basic understanding of environment variables

## Step-by-Step Setup

### 1. Create Railway Project

1. Go to [Railway Dashboard](https://railway.app)
2. Click "New Project"
3. Name it: `kars-dev` (or `kars-production`)

### 2. Add PostgreSQL Database

1. In your project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway automatically provisions the database
4. Note: The `DATABASE_URL` variable is automatically created

### 3. Deploy Backend Service

#### Add Service

1. Click "+ New" → "GitHub Repo"
2. Select repository: `humac/acs`
3. Configure:
   - **Service Name**: `kars-backend-dev`
   - **Branch**: `kars-dev`
   - **Root Directory**: `/backend`

#### Set Environment Variables

Go to the backend service → Variables tab and add:

```env
NODE_ENV=production
PORT=3001
DATA_DIR=/app/data
JWT_SECRET=<generate-64-char-hex-string>
DATABASE_URL=${{Postgres.DATABASE_URL}}
DB_CLIENT=postgres
ADMIN_EMAIL=admin@yourdomain.com
BASE_URL=https://kars-backend-dev.up.railway.app
FRONTEND_URL=https://kars-dev.up.railway.app
PASSKEY_RP_ID=kars-dev.up.railway.app
PASSKEY_RP_NAME=KARS Development
PASSKEY_ORIGIN=https://kars-dev.up.railway.app
TRUST_PROXY=true
RUN_ATTESTATION_SCHEDULER=false
```

**Important Notes:**
- `DATABASE_URL`: Use Railway's variable reference `${{Postgres.DATABASE_URL}}`
- `BASE_URL`: Use the backend's Railway-provided domain
- `FRONTEND_URL`: Use the frontend's Railway-provided domain (set this after frontend is deployed)
- Generate `JWT_SECRET` with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

#### Configure Service Settings

1. Go to Settings tab
2. Under "Deploy":
   - **Start Command**: `node server.js`
   - **Health Check Path**: `/api/health`
3. Under "Networking":
   - Note the public URL (e.g., `https://kars-backend-dev.up.railway.app`)

### 4. Deploy Frontend Service

#### Add Service

1. Click "+ New" → "GitHub Repo"
2. Select repository: `humac/acs`
3. Configure:
   - **Service Name**: `kars-frontend-dev`
   - **Branch**: `kars-dev`
   - **Root Directory**: `/frontend`

#### Set Environment Variables

Go to the frontend service → Variables tab and add:

```env
NODE_ENV=production
BACKEND_URL=https://kars-backend-dev.up.railway.app
PORT=80
```

**Critical:**
- `BACKEND_URL`: Must be the **full public URL** of your backend service (including `https://`)
- This URL is used by Nginx to proxy `/api` requests

#### Configure Service Settings

1. Go to Settings tab
2. Under "Deploy":
   - Railway will auto-detect the Dockerfile
   - Dockerfile location: `/frontend/Dockerfile`
3. Under "Networking":
   - Note the public URL (e.g., `https://kars-frontend-dev.up.railway.app`)

### 5. Update Backend FRONTEND_URL

**Important:** After frontend is deployed, update the backend's `FRONTEND_URL`:

1. Go to backend service → Variables tab
2. Update `FRONTEND_URL` to match frontend's public URL
3. Example: `FRONTEND_URL=https://kars-frontend-dev.up.railway.app`
4. Backend will automatically redeploy

### 6. Custom Domain Setup (Optional)

#### Frontend Domain

1. Go to frontend service → Settings → Networking
2. Click "Custom Domain"
3. Add domain: `kars-dev.yourdomain.com`
4. Add DNS CNAME record:
   - **Name**: `kars-dev`
   - **Target**: `kars-frontend-dev.up.railway.app`
5. Wait for SSL certificate provisioning (automatic)

#### Backend Domain

1. Go to backend service → Settings → Networking
2. Click "Custom Domain"
3. Add domain: `kars-backend-dev.yourdomain.com`
4. Add DNS CNAME record:
   - **Name**: `kars-backend-dev`
   - **Target**: `kars-backend-dev.up.railway.app`
5. Wait for SSL certificate provisioning

#### Update Environment Variables for Custom Domains

After custom domains are set up, update these variables:

**Backend:**
```env
BASE_URL=https://kars-backend-dev.yourdomain.com
FRONTEND_URL=https://kars-dev.yourdomain.com
PASSKEY_RP_ID=kars-dev.yourdomain.com
PASSKEY_ORIGIN=https://kars-dev.yourdomain.com
```

**Frontend:**
```env
BACKEND_URL=https://kars-backend-dev.yourdomain.com
```

## Verification Steps

### 1. Check Backend Health

```bash
curl https://kars-backend-dev.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-01-05T12:00:00.000Z"
}
```

### 2. Check Frontend

1. Open frontend URL in browser: `https://kars-frontend-dev.up.railway.app`
2. You should see the login page
3. Open browser DevTools → Network tab
4. Attempt to login
5. Verify `/api/auth/login` requests go to backend successfully

### 3. Check Nginx Proxy

View frontend logs to verify Nginx started correctly:

```bash
railway logs -s kars-frontend-dev
```

Look for:
```
BACKEND_URL: https://kars-backend-dev.up.railway.app
nginx: [emerg] configuration file /etc/nginx/nginx.conf test successful
```

## Common Issues & Solutions

### Issue: "502 Bad Gateway" on /api requests

**Cause:** Frontend can't reach backend

**Solutions:**
1. Verify `BACKEND_URL` in frontend includes `https://`
2. Check backend is running: `railway logs -s kars-backend-dev`
3. Test backend health endpoint directly
4. Verify backend service is deployed and healthy

### Issue: "CORS errors" in browser console

**Cause:** Backend not configured to accept frontend's origin

**Solutions:**
1. Verify `FRONTEND_URL` in backend matches frontend's public URL exactly
2. Check backend CORS configuration accepts the frontend domain
3. Ensure both services are using HTTPS

### Issue: "SSL certificate verify failed"

**Cause:** Nginx can't verify backend's SSL certificate

**Solution:**
- Should not occur with Railway-provided domains (automatic SSL)
- If using custom domains, ensure SSL certificates are provisioned
- The `proxy_ssl_server_name on;` in nginx.conf handles this

### Issue: Frontend shows blank page

**Causes:**
1. Frontend build failed
2. Environment variables not set correctly

**Solutions:**
1. Check frontend build logs: `railway logs -s kars-frontend-dev`
2. Verify `NODE_ENV=production` is set
3. Verify `BACKEND_URL` is set correctly
4. Redeploy frontend service

### Issue: Database connection errors

**Cause:** Backend can't connect to PostgreSQL

**Solutions:**
1. Verify `DATABASE_URL` variable reference: `${{Postgres.DATABASE_URL}}`
2. Check PostgreSQL service is running
3. View backend logs for detailed error: `railway logs -s kars-backend-dev`

## Environment Variable Reference

### Backend Required Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3001` | Backend port (Railway auto-assigns) |
| `JWT_SECRET` | `<64-char-hex>` | JWT signing secret |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | PostgreSQL connection string |
| `DB_CLIENT` | `postgres` | Database client type |
| `ADMIN_EMAIL` | `admin@yourdomain.com` | Auto-admin email |
| `BASE_URL` | `https://kars-backend-dev.up.railway.app` | Backend public URL |
| `FRONTEND_URL` | `https://kars-dev.up.railway.app` | Frontend public URL (for CORS) |
| `PASSKEY_RP_ID` | `kars-dev.up.railway.app` | WebAuthn relying party ID |
| `PASSKEY_RP_NAME` | `KARS Development` | WebAuthn display name |
| `PASSKEY_ORIGIN` | `https://kars-dev.up.railway.app` | WebAuthn origin |
| `TRUST_PROXY` | `true` | Trust Railway's proxy headers |

### Backend Optional Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `RUN_ATTESTATION_SCHEDULER` | `false` | Enable attestation scheduler |
| `DATA_DIR` | `/app/data` | Data directory for file storage |
| `ACS_MASTER_KEY` | `<32-byte-base64>` | Encryption master key |
| `PROXY_TYPE` | `railway` | Proxy type for IP detection |

### Frontend Required Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `BACKEND_URL` | `https://kars-backend-dev.up.railway.app` | Full backend URL (with https://) |
| `PORT` | `80` | Nginx port |

## Architecture Notes

### Why Public URLs on Starter Plan?

Railway's Starter plan doesn't include private networking, which means:
- Services cannot communicate via internal DNS (e.g., `backend.railway.internal`)
- All inter-service communication must use public URLs
- SSL/TLS is required for all communication

### How Nginx Proxying Works

1. User visits `https://kars-dev.up.railway.app`
2. Browser loads React SPA from Nginx
3. React makes API call to `/api/auth/login`
4. Nginx intercepts the `/api` path
5. Nginx proxies request to `${BACKEND_URL}/api/auth/login`
6. Backend processes request and returns response
7. Nginx forwards response to browser

### Security Considerations

- All traffic is encrypted (HTTPS)
- Backend validates CORS origins
- JWT tokens secure API access
- Environment variables are encrypted by Railway

## Production Deployment

For production, follow the same steps but:

1. Use production branch: `kars-prod`
2. Use production domains: `kars.yourdomain.com`
3. Generate new secrets (different from dev)
4. Enable attestation scheduler: `RUN_ATTESTATION_SCHEDULER=true`
5. Consider upgrading to Railway Pro plan for:
   - Private networking
   - Better resource allocation
   - Higher uptime SLA

## Monitoring & Logs

### View Logs

```bash
# Frontend logs
railway logs -s kars-frontend-dev

# Backend logs
railway logs -s kars-backend-dev

# Database logs
railway logs -s Postgres
```

### Health Monitoring

Set up external monitoring:
- **Uptime:** Use UptimeRobot or similar
- **Health Check URL**: `https://kars-backend-dev.up.railway.app/api/health`
- **Check Interval**: 5 minutes

## Support & Resources

- **Railway Documentation**: https://docs.railway.app
- **Repository Issues**: https://github.com/humac/acs/issues
- **Railway Discord**: https://discord.gg/railway

---

**Last Updated:** January 2026
