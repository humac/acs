# Railway Development Configuration - KARS

Development environment configuration for KARS on Railway.

**Environment:** Development  
**Branch:** kars-dev  
**Domain:** kars-dev.keydatalab.ca  
**Project Name:** kars-development

---

## Service Overview

### kars-backend-dev

**Service Type:** Backend API (Node.js/Express)

**Configuration:**
- **Branch:** `kars-dev`
- **Root Directory:** `/backend`
- **Builder:** Nixpacks (auto-detected)
- **Build Command:** `npm ci`
- **Start Command:** `node server.js`
- **Health Check:** `/api/health`
- **Port:** Dynamic (`${{PORT}}`)

**Resource Allocation:**
- **CPU:** 0.5 vCPU
- **Memory:** 512 MB
- **Replicas:** 1

**Environment Variables:**
```env
NODE_ENV=production
JWT_SECRET=<64-char-random-hex-dev>
DATABASE_URL=${{kars-db-dev.DATABASE_URL}}
DB_CLIENT=postgres
BASE_URL=https://kars-dev.keydatalab.ca
FRONTEND_URL=https://kars-dev.keydatalab.ca
ADMIN_EMAIL=admin@keydatalab.ca
PASSKEY_RP_ID=kars-dev.keydatalab.ca
PASSKEY_RP_NAME=KARS - Dev Environment
PASSKEY_ORIGIN=https://kars-dev.keydatalab.ca
ACS_MASTER_KEY=<32-byte-base64-dev>
RUN_ATTESTATION_SCHEDULER=false
TRUST_PROXY=true
PROXY_TYPE=cloudflare
PORT=${{PORT}}
```

### kars-frontend-dev

**Service Type:** Frontend (React/Vite)

**Configuration:**
- **Branch:** `kars-dev`
- **Root Directory:** `/frontend`
- **Builder:** Nixpacks
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm run preview -- --host 0.0.0.0 --port $PORT`
- **Port:** Dynamic (`${{PORT}}`)
- **Custom Domain:** `kars-dev.keydatalab.ca`

**Resource Allocation:**
- **CPU:** 0.25 vCPU
- **Memory:** 256 MB
- **Replicas:** 1

**Environment Variables:**
```env
NODE_ENV=production
VITE_API_URL=/api
PORT=${{PORT}}
```

### kars-db-dev

**Service Type:** PostgreSQL Database

**Configuration:**
- **Version:** PostgreSQL 15
- **Storage:** 1 GB
- **Backups:** Daily automated
- **Connection:** Internal Railway network

**Database Name:** `kars_dev`

---

## Key Differences from Production

### Environment Configuration

| Setting | Production | Development |
|---------|-----------|-------------|
| **Branch** | kars-prod | kars-dev |
| **Domain** | kars.keydatalab.ca | kars-dev.keydatalab.ca |
| **Database** | kars | kars_dev |
| **JWT Secret** | Prod secret | Dev secret (different) |
| **Attestation Scheduler** | Enabled | Disabled |
| **Debug Mode** | Disabled | Can be enabled |
| **Resource Limits** | Higher | Lower (cost optimization) |

### Data Isolation

**Important:** Development and production databases are completely separate:
- No shared data
- Different credentials
- Independent backups
- Can be reset without affecting production

### Testing Features

**Development-Only Features:**
- Debug endpoints (if enabled)
- Verbose logging
- Test data seeding
- Mock integrations

---

## Deployment Configuration

### Automatic Deployment

**Trigger:** Push to `kars-dev` branch

**Purpose:**
- Continuous integration testing
- Feature validation before production
- QA environment for Friday testing

**Deployment Time:** ~3-5 minutes

### Branch Protection

**kars-dev branch:**
- No required reviews (faster iteration)
- CI must pass
- Can be force-pushed (use with caution)
- Used for feature integration

---

## Testing Workflow

### Friday QA Process

1. **All features merged to kars-dev by Thursday 5:00 PM EST**
2. **Friday morning: Full QA on kars-dev.keydatalab.ca**
   - Functional testing
   - Performance testing
   - Security testing
   - Browser compatibility
3. **Friday afternoon: Create production release**
4. **Monday morning: Deploy to production**

### Test Data Management

**Seeding Test Data:**
```bash
# Link to dev backend
railway link kars-backend-dev

# Run seed script (if available)
railway run npm run seed

# Or manually insert via psql
railway run psql $DATABASE_URL < test-data.sql
```

**Resetting Development Database:**
```bash
# Backup first (optional)
railway run pg_dump > backup-before-reset.sql

# Drop all tables
railway run psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restart backend (re-initializes database)
railway restart
```

---

## Monitoring Configuration

### Log Verbosity

Development environment uses **verbose logging** for debugging:

```javascript
// backend/server.js
const DEBUG = process.env.DEBUG || 'false';
if (DEBUG === 'true') {
  console.log('Debug mode enabled');
}
```

**Enable debug logging:**
```env
DEBUG=true
LOG_LEVEL=debug
```

### Performance Monitoring

**Metrics Tracked:**
- Build times
- Test execution time
- API response times
- Database query performance

**No Production Alerts:**
- Development incidents don't trigger Teams alerts
- Crashes are expected during testing
- No on-call escalation

---

## Cost Optimization

### Resource Limits

**Lower limits for cost savings:**
- Backend: 512 MB RAM (vs 1 GB prod)
- Frontend: 256 MB RAM (same as prod)
- Database: 1 GB storage (same as prod)

**Sleep Mode:**
- Can enable sleep mode for non-business hours
- Railway automatically sleeps after 5 minutes of inactivity
- First request after sleep takes ~30 seconds

### Backup Strategy

**Reduced Backup Frequency:**
- Daily backups (same as prod)
- Only 7-day retention (vs 30-day for prod)
- No point-in-time recovery needed

---

## Development Best Practices

### Using Development Environment

**DO:**
- ✅ Test all features before production
- ✅ Break things and experiment
- ✅ Reset database as needed
- ✅ Use test credit cards
- ✅ Test email with test SMTP

**DON'T:**
- ❌ Use real customer data
- ❌ Test with production integrations
- ❌ Use production API keys
- ❌ Share credentials publicly
- ❌ Deploy to dev without CI passing

### Feature Flag Testing

**Enable experimental features in dev:**
```env
FEATURE_FLAG_NEW_UI=true
FEATURE_FLAG_BETA_API=true
```

### Integration Testing

**Mock External Services:**
- Use test HubSpot sandbox
- Use test SMTP (Mailtrap, Ethereal)
- Use test OIDC provider
- Mock payment processors

---

## Security Considerations

### Relaxed Security (Development Only)

**Acceptable in Development:**
- Weaker JWT secrets (still secure)
- Longer token expiration
- CORS allows localhost
- Debug endpoints enabled

**Still Required:**
- Password hashing
- HTTPS enforced
- SQL injection prevention
- XSS protection

### Access Control

**Development Access:**
- All team members have access
- No MFA required (optional)
- Can create admin accounts freely

---

## Troubleshooting

### Common Development Issues

#### Issue: "Cannot connect to database"

**Solution:**
```bash
# Check DATABASE_URL
railway variables | grep DATABASE_URL

# Test connection
railway run psql $DATABASE_URL -c "SELECT 1;"

# Restart database service
railway restart --service kars-db-dev
```

#### Issue: "Feature not working in dev but works locally"

**Solution:**
1. Check environment variables match
2. Verify NODE_ENV is set
3. Check build output
4. Compare logs between local and Railway

#### Issue: "Deploy failed with npm error"

**Solution:**
```bash
# Check package-lock.json is committed
git status

# Test build locally
cd backend
npm ci
npm run build

# Check Node version matches (22 LTS)
node --version
```

---

## Data Management

### Database Migrations

**Test migrations in dev first:**
```bash
# Apply migration
railway run npm run migrate

# Verify schema
railway run psql $DATABASE_URL -c "\dt"

# If migration fails, rollback
railway run psql $DATABASE_URL < backup-before-migration.sql
```

### Data Sync from Production (Optional)

**If you need production data in dev:**

⚠️ **WARNING:** Never sync production to dev with real user data. Always anonymize.

```bash
# Backup production
railway link kars-backend-prod
railway run pg_dump > prod-backup.sql

# Anonymize data (use a script)
# Replace emails, names, sensitive data

# Restore to dev
railway link kars-backend-dev
railway run psql $DATABASE_URL < anonymized-data.sql
```

---

## Maintenance

### Database Cleanup

**Weekly cleanup (optional):**
```bash
# Remove old test data
railway run psql $DATABASE_URL -c "
  DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '7 days';
  DELETE FROM assets WHERE status = 'test';
  VACUUM FULL;
"
```

### Log Cleanup

**Railway automatically purges logs after 7 days.**

Manual export if needed:
```bash
# Export logs
railway logs --since 7d > dev-logs-$(date +%Y%m%d).txt
```

---

## Support

### For Development Issues

- **Teams:** #kars-support
- **Repository Issues:** https://github.com/humac/acs/issues
- **Railway Docs:** https://docs.railway.app

---

**Last Updated:** January 2025  
**Configuration Version:** 1.0  
**Environment:** Development  
**Project:** KARS (KeyData Asset Registration System)
