# Railway Production Configuration - KARS

Production environment configuration for KARS on Railway.

**Environment:** Production  
**Branch:** kars-prod  
**Domain:** kars.keydatalab.ca  
**Project Name:** kars-production

---

## Service Overview

### kars-backend-prod

**Service Type:** Backend API (Node.js/Express)

**Configuration:**
- **Branch:** `kars-prod`
- **Root Directory:** `/backend`
- **Builder:** Nixpacks (auto-detected)
- **Build Command:** `npm ci --only=production`
- **Start Command:** `node server.js`
- **Health Check:** `/api/health`
- **Port:** Dynamic (`${{PORT}}`)

**Resource Allocation:**
- **CPU:** 0.5-1 vCPU
- **Memory:** 512 MB - 1 GB
- **Replicas:** 1 (scale as needed)

**Environment Variables:**
```env
NODE_ENV=production
JWT_SECRET=<64-char-random-hex>
DATABASE_URL=${{kars-db-prod.DATABASE_URL}}
DB_CLIENT=postgres
BASE_URL=https://kars.keydatalab.ca
FRONTEND_URL=https://kars.keydatalab.ca
ADMIN_EMAIL=admin@keydatalab.ca
PASSKEY_RP_ID=kars.keydatalab.ca
PASSKEY_RP_NAME=KARS - KeyData Asset Registration System
PASSKEY_ORIGIN=https://kars.keydatalab.ca
ACS_MASTER_KEY=<32-byte-base64>
RUN_ATTESTATION_SCHEDULER=true
TRUST_PROXY=true
PROXY_TYPE=cloudflare
PORT=${{PORT}}
```

### kars-frontend-prod

**Service Type:** Frontend (React/Vite + Nginx)

**Configuration:**
- **Branch:** `kars-prod`
- **Root Directory:** `/frontend`
- **Builder:** Dockerfile
- **Dockerfile Path:** `/frontend/Dockerfile`
- **Port:** 80
- **Custom Domain:** `kars.keydatalab.ca`

**Resource Allocation:**
- **CPU:** 0.25 vCPU
- **Memory:** 256 MB
- **Replicas:** 1

**Environment Variables:**
```env
NODE_ENV=production
BACKEND_URL=https://kars-backend-prod.up.railway.app
PORT=80
```

**Note:** For Railway Starter plan (no private networking), `BACKEND_URL` must be the backend's public URL. Nginx proxies `/api` requests to this URL. See [STARTER-PLAN-SETUP.md](STARTER-PLAN-SETUP.md) for details.

### kars-db-prod

**Service Type:** PostgreSQL Database

**Configuration:**
- **Version:** PostgreSQL 15
- **Storage:** 1 GB (scalable)
- **Backups:** Daily automated (7-day retention)
- **Connection:** Internal Railway network

**Database Name:** `kars`

**Connection Details:**
```env
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/railway
POSTGRES_HOST=[host].railway.internal
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=[auto-generated]
POSTGRES_DB=railway
```

---

## Network Configuration

### Networking Model

**Railway Starter Plan:** Services communicate via public URLs (no private networking):
```
kars-frontend-prod (Nginx) → kars-backend-prod (public URL) → kars-db-prod (Railway internal)
```

**Railway Pro Plan (Optional):** Services can use internal network:
```
kars-frontend-prod → kars-backend-prod.railway.internal:3001 → kars-db-prod
```

**Current Setup:** Using public URLs for Starter plan compatibility.

### External Networking

**Public Endpoints:**
- Production: `https://kars.keydatalab.ca`
- Backend (optional): `https://api.kars.keydatalab.ca`
- Railway Default: `https://kars-frontend-prod.up.railway.app`

**SSL/TLS:**
- Automatic Let's Encrypt certificates
- Auto-renewal enabled
- HTTPS enforced

---

## Deployment Configuration

### Automatic Deployment

**Trigger:** Push to `kars-prod` branch

**Process:**
1. GitHub webhook triggers Railway
2. Railway clones repository
3. Builds backend and frontend in parallel
4. Runs health checks
5. Switches traffic (zero-downtime)
6. Previous deployment kept for rollback

**Deployment Time:** ~3-5 minutes

### Health Checks

**Backend:**
```yaml
path: /api/health
interval: 30s
timeout: 5s
retries: 3
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-05T10:00:00.000Z"
}
```

### Restart Policy

```yaml
type: ON_FAILURE
max_retries: 10
restart_delay: 5s
```

---

## Security Configuration

### Secrets Management

**Critical Secrets:**
- `JWT_SECRET` - Token signing (64+ chars)
- `DATABASE_URL` - Auto-injected by Railway
- `ACS_MASTER_KEY` - Email encryption (32 bytes)

**Best Practices:**
- Never commit secrets to git
- Rotate secrets quarterly
- Use Railway variables for all secrets
- Audit secret access regularly

### Network Security

**Firewall Rules:**
- Internal services: Private Railway network only
- Frontend: Public HTTPS only (443)
- Backend: Optional public access via custom domain
- Database: Internal network only (no public access)

### Access Control

**Railway Project Access:**
- Owner: Full access
- Member: Deploy, view logs, restart services
- Viewer: Read-only access

---

## Monitoring Configuration

### Metrics Tracked

**Application Metrics:**
- Request count
- Response time (p50, p95, p99)
- Error rate
- Active connections

**Infrastructure Metrics:**
- CPU usage (%)
- Memory usage (MB)
- Network I/O (MB/s)
- Disk usage (GB)

### Alerts

**Configure via Railway Dashboard:**
1. Project → Settings → Notifications
2. Add webhook URL (Teams, Slack, Discord)
3. Configure alert conditions:
   - Deployment failed
   - Service crashed
   - High error rate (>5%)
   - High CPU usage (>80%)
   - High memory usage (>90%)

**Teams Webhook:**
```
Channel: #kars-incidents
URL: https://outlook.office.com/webhook/...
Events: Deploy failed, Service crashed
```

### Log Retention

- **Duration:** 7 days
- **Export:** Available via Railway CLI
- **Search:** Full-text search in dashboard

---

## Backup Configuration

### Database Backups

**Automatic Backups:**
- **Frequency:** Daily at 2:00 AM UTC
- **Retention:** 7 days
- **Type:** Full database dump
- **Access:** Railway Dashboard → Database → Backups

**Manual Backups:**
```bash
# Before major changes
railway link kars-backend-prod
railway run pg_dump > backup-$(date +%Y%m%d-%H%M).sql

# Verify backup
ls -lh backup-*.sql
```

### Application State

**Stateless Design:**
- No file uploads stored locally
- All state in PostgreSQL
- No session storage on disk

---

## Scaling Configuration

### Vertical Scaling

**Current:**
- Backend: 512 MB RAM, 0.5 vCPU
- Frontend: 256 MB RAM, 0.25 vCPU
- Database: 1 GB storage

**Upgrade Path:**
1. Railway Dashboard → Service → Settings
2. Resources → Select higher tier
3. Apply changes (may require restart)

### Horizontal Scaling

**Backend Scaling:**
```bash
# Increase replicas
railway scale web=3

# Railway automatically:
# - Load balances traffic
# - Shares DATABASE_URL
# - Maintains sticky sessions (if needed)
```

**Considerations:**
- Stateless application (no session affinity needed)
- Database connection pooling required
- Monitor database connection limits

---

## Cost Estimates

### Monthly Costs (Typical Usage)

**Services:**
- Backend: ~$10/month (512 MB, 0.5 vCPU)
- Frontend: ~$5/month (256 MB, 0.25 vCPU)
- Database: ~$5/month (1 GB storage)
- **Total:** ~$20/month

**Included in Pro Plan ($20/month):**
- $20 usage credit
- Priority support
- Longer log retention
- Branch deployments

---

## Maintenance Windows

### Scheduled Maintenance

**Deployments:**
- **Day:** Monday
- **Time:** 10:00-11:00 AM EST
- **Duration:** ~30 minutes
- **Downtime:** None (zero-downtime deployment)

**Database Maintenance:**
- **Frequency:** Monthly (first Sunday)
- **Time:** 2:00-4:00 AM EST
- **Duration:** ~30 minutes
- **Downtime:** < 5 minutes (during failover)

---

## Disaster Recovery

### Recovery Time Objective (RTO)

**Target:** 1 hour

**Procedures:**
1. Detect incident (automatic alerts)
2. Assess impact (< 15 minutes)
3. Execute rollback (< 5 minutes)
4. Verify recovery (< 15 minutes)
5. Monitor stability (30 minutes)

### Recovery Point Objective (RPO)

**Target:** 24 hours

**Strategy:**
- Daily automated database backups
- Point-in-time recovery (Pro plan)
- Transaction logs (available for 7 days)

### Rollback Procedures

**Railway One-Click:**
```bash
railway link kars-backend-prod
railway rollback
```

**Manual Rollback:**
```bash
git checkout kars-prod
git revert HEAD
git push origin kars-prod
```

---

## Compliance

### SOC2 Compliance

**Data Protection:**
- Encrypted at rest (AES-256)
- Encrypted in transit (TLS 1.3)
- Database backups encrypted
- Access logs maintained

**Audit Trail:**
- All API mutations logged
- User actions tracked
- Admin changes recorded
- Logs retained for 90 days

**Access Control:**
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- JWT token expiration (24 hours)
- Password complexity requirements

---

## Support

### Railway Support

- **Dashboard:** https://railway.app
- **Documentation:** https://docs.railway.app
- **Status:** https://status.railway.app
- **Discord:** https://discord.gg/railway

### KARS Support

- **Teams:** #kars-support
- **Incidents:** #kars-incidents
- **Releases:** #kars-releases
- **Repository:** https://github.com/humac/acs

---

**Last Updated:** January 2025  
**Configuration Version:** 1.0  
**Environment:** Production  
**Project:** KARS (KeyData Asset Registration System)
