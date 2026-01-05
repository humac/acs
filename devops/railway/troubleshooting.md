# Railway Troubleshooting Guide - KARS

Common issues and solutions for KARS deployment on Railway.

**Project:** KARS (KeyData Asset Registration System)  
**Repository:** humac/acs  
**Platform:** Railway

---

## Table of Contents

1. [Deployment Issues](#deployment-issues)
2. [Runtime Issues](#runtime-issues)
3. [Database Issues](#database-issues)
4. [Network Issues](#network-issues)
5. [Performance Issues](#performance-issues)
6. [Security Issues](#security-issues)

---

## Deployment Issues

### Issue 1: Build Fails - "npm install failed"

**Symptoms:**
```
Error: npm install failed
Code: 1
Command: npm ci
```

**Root Causes:**
- package-lock.json out of sync
- Node version mismatch
- Native dependencies require build tools

**Solutions:**

1. **Regenerate package-lock.json:**
   ```bash
   # Locally
   rm package-lock.json
   npm install
   git add package-lock.json
   git commit -m "fix: regenerate package-lock.json"
   git push origin kars-prod
   ```

2. **Verify Node version:**
   ```json
   // backend/package.json
   {
     "engines": {
       "node": ">=22 <23"
     }
   }
   ```

3. **Check for native dependencies:**
   ```bash
   # If using better-sqlite3 or similar
   # Ensure it's compatible with Railway's build environment
   npm audit
   ```

### Issue 2: Build Succeeds but Start Fails

**Symptoms:**
```
Server failed to start
Error: Cannot find module './server.js'
```

**Root Causes:**
- Wrong start command
- Missing files in build
- Incorrect root directory

**Solutions:**

1. **Verify start command:**
   ```yaml
   Start Command: node server.js
   # NOT: npm start (unless defined in package.json)
   ```

2. **Check root directory:**
   - Backend: `/backend`
   - Frontend: `/frontend`

3. **Verify files exist:**
   ```bash
   # In repository
   ls backend/server.js
   ls frontend/package.json
   ```

### Issue 3: Deployment Stuck in "Building" State

**Symptoms:**
- Build has been running for > 10 minutes
- No progress in logs
- Can't cancel deployment

**Solutions:**

1. **Check Railway status:**
   ```bash
   curl https://status.railway.app
   ```

2. **Cancel and retry:**
   - Railway Dashboard → Deployments → Cancel
   - Push a new commit to trigger rebuild

3. **Check build logs for hanging process:**
   ```bash
   railway logs --deployment latest
   ```

---

## Runtime Issues

### Issue 1: Application Crashes on Startup

**Symptoms:**
```
Service status: Crashed
Restart count: 10/10 (max retries reached)
```

**Root Causes:**
- Missing environment variables
- Database connection failure
- Uncaught exceptions
- Port binding issues

**Solutions:**

1. **Check logs immediately:**
   ```bash
   railway link kars-backend-prod
   railway logs --tail=100 | grep -i "error"
   ```

2. **Verify critical environment variables:**
   ```bash
   railway variables | grep -E "(JWT_SECRET|DATABASE_URL|PORT)"
   ```

3. **Test locally with same environment:**
   ```bash
   # Copy env vars from Railway
   railway variables > .env
   
   # Test locally
   npm start
   ```

4. **Check port binding:**
   ```javascript
   // backend/server.js
   const PORT = process.env.PORT || 3001;
   app.listen(PORT, '0.0.0.0', () => {
     console.log(`Server on port ${PORT}`);
   });
   ```

### Issue 2: Service Crashes Intermittently

**Symptoms:**
- Random crashes
- Works fine for hours, then crashes
- Memory usage climbing before crash

**Root Causes:**
- Memory leak
- Unhandled promise rejections
- Database connection pool exhausted
- Timeout issues

**Solutions:**

1. **Monitor memory usage:**
   ```bash
   # In Railway Dashboard
   # Project → Service → Metrics → Memory
   
   # If steadily climbing → memory leak
   ```

2. **Check for unhandled rejections:**
   ```javascript
   // backend/server.js
   process.on('unhandledRejection', (reason, promise) => {
     console.error('Unhandled Rejection:', reason);
   });
   
   process.on('uncaughtException', (error) => {
     console.error('Uncaught Exception:', error);
     process.exit(1);
   });
   ```

3. **Database connection pooling:**
   ```javascript
   // If using pg
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     max: 20, // Maximum connections
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

### Issue 3: 502 Bad Gateway

**Symptoms:**
- Frontend shows: "502 Bad Gateway"
- Backend is running but not responding
- Intermittent availability

**Root Causes:**
- Backend not binding to correct port
- Health check failing
- Backend crashed but Railway hasn't detected it yet
- Slow startup time

**Solutions:**

1. **Verify health check:**
   ```bash
   # Check internal health
   railway run curl localhost:$PORT/api/health
   
   # Check external health
   curl https://kars.keydatalab.ca/api/health
   ```

2. **Increase health check timeout:**
   - Railway Dashboard → Service → Settings
   - Health Check Timeout: 30s → 60s

3. **Check backend logs:**
   ```bash
   railway logs | grep -i "listening\|started\|ready"
   ```

---

## Database Issues

### Issue 1: Cannot Connect to Database

**Symptoms:**
```
Error: connect ECONNREFUSED
Unable to connect to database
```

**Root Causes:**
- DATABASE_URL not set
- Database service not running
- Network issue
- Wrong credentials

**Solutions:**

1. **Verify DATABASE_URL:**
   ```bash
   railway variables | grep DATABASE_URL
   
   # Should show: ${{kars-db-prod.DATABASE_URL}}
   ```

2. **Test database directly:**
   ```bash
   railway run psql $DATABASE_URL -c "SELECT version();"
   ```

3. **Check database service status:**
   - Railway Dashboard → kars-db-prod → Status
   - Should be "Active"

4. **Restart database service:**
   ```bash
   railway restart --service kars-db-prod
   ```

### Issue 2: Database Connection Pool Exhausted

**Symptoms:**
```
Error: Connection pool exhausted
All connections in use
```

**Root Causes:**
- Too many concurrent requests
- Connections not being released
- Connection leak in code
- Pool size too small

**Solutions:**

1. **Check active connections:**
   ```bash
   railway run psql $DATABASE_URL -c "
     SELECT count(*) FROM pg_stat_activity;
   "
   ```

2. **Increase pool size:**
   ```javascript
   // backend/database.js
   const pool = new Pool({
     max: 50, // Increase from 20
   });
   ```

3. **Find connection leaks:**
   ```bash
   # Check for queries not releasing connections
   railway run psql $DATABASE_URL -c "
     SELECT pid, usename, application_name, state, query
     FROM pg_stat_activity
     WHERE state != 'idle'
     ORDER BY query_start DESC;
   "
   ```

### Issue 3: Database Running Out of Space

**Symptoms:**
```
Error: No space left on device
Database writes failing
```

**Root Causes:**
- Database grown beyond allocated storage
- Large audit logs table
- No cleanup policy

**Solutions:**

1. **Check database size:**
   ```bash
   railway run psql $DATABASE_URL -c "
     SELECT pg_size_pretty(pg_database_size(current_database()));
   "
   ```

2. **Check table sizes:**
   ```bash
   railway run psql $DATABASE_URL -c "
     SELECT schemaname, tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
     FROM pg_tables
     WHERE schemaname = 'public'
     ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
     LIMIT 10;
   "
   ```

3. **Clean up old data:**
   ```sql
   -- Delete old audit logs (keep 90 days)
   DELETE FROM audit_logs 
   WHERE timestamp < NOW() - INTERVAL '90 days';
   
   -- Vacuum to reclaim space
   VACUUM FULL;
   ```

4. **Upgrade storage:**
   - Railway Dashboard → Database → Settings
   - Increase storage allocation

---

## Network Issues

### Issue 1: CORS Errors

**Symptoms:**
```
Access to fetch at 'https://kars.keydatalab.ca/api/...'
has been blocked by CORS policy
```

**Root Causes:**
- Backend CORS not configured
- Wrong origin specified
- Credentials not included

**Solutions:**

1. **Configure CORS in backend:**
   ```javascript
   // backend/server.js
   import cors from 'cors';
   
   app.use(cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
     allowedHeaders: ['Content-Type', 'Authorization'],
   }));
   ```

2. **Verify FRONTEND_URL:**
   ```bash
   railway variables | grep FRONTEND_URL
   # Should be: https://kars.keydatalab.ca
   ```

3. **Update frontend to include credentials:**
   ```javascript
   // frontend API calls
   fetch('/api/endpoint', {
     credentials: 'include',
   });
   ```

### Issue 2: Custom Domain Not Working

**Symptoms:**
- Domain resolves but shows "This site can't be reached"
- SSL certificate error
- DNS resolution fails

**Root Causes:**
- Incorrect DNS configuration
- SSL certificate not provisioned
- Railway domain not added
- Proxy interfering (Cloudflare)

**Solutions:**

1. **Verify DNS:**
   ```bash
   nslookup kars.keydatalab.ca
   # Should point to Railway
   
   dig kars.keydatalab.ca
   ```

2. **Check Railway custom domain:**
   - Railway Dashboard → Service → Settings → Networking
   - Ensure domain is added
   - Check CNAME target matches DNS

3. **Disable Cloudflare proxy:**
   - If using Cloudflare, click orange cloud (turn gray)
   - Railway needs direct access for SSL provisioning

4. **Wait for SSL:**
   - Initial provisioning takes 5-10 minutes
   - Check Railway Dashboard for certificate status

5. **Force SSL renewal:**
   ```bash
   # Remove and re-add custom domain
   # Railway Dashboard → Networking → Remove Domain
   # Wait 5 minutes
   # Add domain again
   ```

### Issue 3: Slow Response Times

**Symptoms:**
- API calls take > 5 seconds
- Frontend loading slowly
- Timeout errors

**Root Causes:**
- Database queries not optimized
- N+1 query problem
- Missing indexes
- Cold start (first request after idle)
- Large payload sizes

**Solutions:**

1. **Check query performance:**
   ```bash
   railway run psql $DATABASE_URL -c "
     SELECT query, calls, mean_exec_time, max_exec_time
     FROM pg_stat_statements
     ORDER BY mean_exec_time DESC
     LIMIT 10;
   "
   ```

2. **Add indexes:**
   ```sql
   -- Find missing indexes
   CREATE INDEX idx_assets_owner ON assets(employee_email);
   CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
   ```

3. **Optimize queries:**
   ```javascript
   // Avoid N+1
   // BAD:
   const assets = await getAssets();
   for (const asset of assets) {
     asset.company = await getCompany(asset.company_id);
   }
   
   // GOOD:
   const assets = await db.query(`
     SELECT a.*, c.name as company_name
     FROM assets a
     LEFT JOIN companies c ON a.company_id = c.id
   `);
   ```

4. **Enable compression:**
   ```javascript
   // backend/server.js
   import compression from 'compression';
   app.use(compression());
   ```

---

## Performance Issues

### Issue 1: High CPU Usage

**Symptoms:**
- CPU usage > 80%
- Service slow to respond
- Frequent restarts due to health check failures

**Root Causes:**
- Inefficient algorithm
- Infinite loop
- Heavy computation
- Too many concurrent requests

**Solutions:**

1. **Identify CPU-intensive operations:**
   ```bash
   railway logs | grep -i "timeout\|slow\|processing"
   ```

2. **Profile code:**
   ```javascript
   // Add timing logs
   const start = Date.now();
   // ... operation ...
   console.log(`Operation took ${Date.now() - start}ms`);
   ```

3. **Optimize hot paths:**
   - Cache frequent queries
   - Use indexes
   - Batch operations
   - Offload heavy tasks to background jobs

4. **Scale vertically:**
   - Railway Dashboard → Settings → Resources
   - Upgrade to higher CPU tier

### Issue 2: High Memory Usage

**Symptoms:**
- Memory usage > 90%
- Service killed by OOM
- Gradual memory increase

**Root Causes:**
- Memory leak
- Large in-memory caches
- Not releasing resources
- Holding large objects

**Solutions:**

1. **Monitor memory over time:**
   - Railway Dashboard → Metrics → Memory
   - Look for steady increase

2. **Find memory leaks:**
   ```javascript
   // Add logging
   setInterval(() => {
     const used = process.memoryUsage();
     console.log(`Memory: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
   }, 60000);
   ```

3. **Limit cache sizes:**
   ```javascript
   // Use LRU cache with size limit
   const cache = new LRU({
     max: 500,
     maxAge: 1000 * 60 * 60 // 1 hour
   });
   ```

4. **Upgrade memory:**
   - Railway Dashboard → Settings → Resources
   - Increase memory allocation

---

## Security Issues

### Issue 1: JWT_SECRET Exposed

**Symptoms:**
- Secret appears in logs
- Secret committed to git
- Unauthorized access

**Solutions:**

1. **Immediately rotate secret:**
   ```bash
   # Generate new secret
   NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
   
   # Update in Railway
   railway variables set JWT_SECRET=$NEW_SECRET
   
   # Restart services
   railway restart
   ```

2. **Invalidate all tokens:**
   - All users will need to log in again
   - Post notification in #kars-support

3. **Audit access:**
   - Check audit logs for suspicious activity
   - Review recent logins

### Issue 2: Database Credentials Leaked

**Symptoms:**
- DATABASE_URL exposed
- Unusual database activity
- Unauthorized connections

**Solutions:**

1. **Reset database password:**
   - Railway Dashboard → Database → Settings
   - Reset Credentials
   - DATABASE_URL automatically updated

2. **Restart all services:**
   ```bash
   railway restart --service kars-backend-prod
   railway restart --service kars-frontend-prod
   ```

3. **Audit database activity:**
   ```bash
   railway run psql $DATABASE_URL -c "
     SELECT * FROM pg_stat_activity
     WHERE usename != 'postgres';
   "
   ```

---

## Getting Help

### Before Requesting Help

Gather this information:

1. **Service details:**
   ```bash
   railway status
   railway logs --tail=100
   ```

2. **Environment variables:**
   ```bash
   railway variables
   # Redact secrets!
   ```

3. **Recent changes:**
   ```bash
   git log -n 5 --oneline
   ```

4. **Error messages:**
   - Copy exact error from logs
   - Include stack trace

### Support Channels

**Railway Support:**
- Dashboard: https://railway.app
- Discord: https://discord.gg/railway
- Documentation: https://docs.railway.app

**KARS Support:**
- Teams: #kars-support
- Incidents: #kars-incidents
- Repository: https://github.com/humac/acs/issues

---

**Last Updated:** January 2025  
**Project:** KARS (KeyData Asset Registration System)  
**Repository:** https://github.com/humac/acs
