# 🚀 Editable GridView - Deployment & Operations Guide

## Production Deployment Checklist

### Pre-Deployment Verification

#### ✅ Code Quality
```bash
# Frontend type checking
cd frontend
npm run check
# Expected: 0 errors, 0 warnings

# Frontend build
npm run build
# Expected: 65 modules, 213 KB, built in 630ms, 0 errors

# Backend build
cd ../backend
npm run build
# Expected: 0 errors, 0 warnings
```

#### ✅ Database Setup
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Create database if needed
psql -U postgres -c "CREATE DATABASE kltn_db;"

# Apply migrations
cd migrations
psql -U postgres -d kltn_db -f 001_phase1_init_up.sql
psql -U postgres -d kltn_db -f 003_create_menus_table_up.sql

# Verify tables created
psql -U postgres -d kltn_db -c "
  SELECT tablename FROM pg_tables 
  WHERE schemaname = 'public';"
# Expected: user_accounts, user_roles, registrations, menus, menu_audit_log, etc.
```

#### ✅ API Connectivity
```bash
# Test backend is running
curl http://localhost:4000/health

# Test menu endpoint exists
curl http://localhost:4000/api/master/menus \
  -H "Authorization: Bearer <test-token>"
# Expected: 200 OK with JSON array
```

#### ✅ Frontend Build Output
```bash
cd frontend
ls -lh dist/
# Expected:
# - dist/index.html (0.43 KB)
# - dist/assets/style-*.css (3.86 KB gzip)
# - dist/assets/index-*.js (64.97 KB gzip)
```

---

## Deployment Steps

### Step 1: Database Migration

```bash
# Connect to production database
psql -U postgres -d kltn_db

# Verify current schema version
SELECT version FROM migrations ORDER BY version DESC LIMIT 1;

# If not at 003, apply migration
\q
psql -U postgres -d kltn_db -f backend/migrations/003_create_menus_table_up.sql

# Verify tables created
psql -U postgres -d kltn_db -c "SELECT COUNT(*) FROM menus;"
# Expected: 10 (default menu items)
```

### Step 2: Backend Deployment

```bash
# Stop running instance (if any)
pkill -f "node.*backend"

# Build backend
cd backend
npm run build

# Start backend with environment variables
NODE_ENV=production \
DB_HOST=localhost \
DB_PORT=5432 \
DB_USER=postgres \
DB_PASSWORD=your_password \
DB_NAME=kltn_db \
PORT=4000 \
npm start

# Verify it's running
curl http://localhost:4000/health
```

### Step 3: Frontend Deployment

```bash
# Build frontend
cd frontend
npm run build

# Deploy dist folder to web server
# Option 1: Copy to web server root
scp -r dist/* username@production-server:/var/www/html/

# Option 2: Use Vite preview mode for testing
npm run preview
# Access at http://localhost:5173

# Option 3: Deploy to cloud (Vercel, Netlify, etc.)
# Follow platform-specific instructions
```

### Step 4: Verify Deployment

```bash
# Test backend API
curl http://localhost:4000/api/master/menus

# Test frontend loads
curl http://localhost/index.html

# Test database connection
psql -U postgres -d kltn_db -c "SELECT COUNT(*) FROM menus;"

# Check logs for errors
tail -f backend.log
tail -f frontend.log
```

---

## Environment Configuration

### Backend `.env` File
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=secure_password_here
DB_NAME=kltn_db

# Server
NODE_ENV=production
PORT=4000
LOG_LEVEL=info

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=24h

# CORS
CORS_ORIGIN=http://your-domain.com

# Session
SESSION_SECRET=session_secret_here
```

### Frontend `environment.ts`
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'http://api.your-domain.com',
  apiTimeout: 5000,
  retryAttempts: 3,
};
```

---

## Monitoring & Health Checks

### Backend Health Check
```bash
# Endpoint: GET /health
curl http://localhost:4000/health
# Response:
# {
#   "status": "ok",
#   "timestamp": "2026-05-04T10:00:00Z",
#   "database": "connected",
#   "uptime": 3600
# }
```

### Database Health Check
```bash
# Check connection pool
psql -U postgres -d kltn_db -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# Check table sizes
psql -U postgres -d kltn_db -c "
  SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
  FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Frontend Performance Check
```bash
# Check build size
ls -lh frontend/dist/assets/
# Target: CSS < 20 KB gzipped, JS < 100 KB gzipped

# Check for missing assets
curl -I http://localhost:5173/assets/index-*.js
```

---

## Troubleshooting

### Issue: Database Connection Failed
```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U postgres -d kltn_db -c "SELECT 1;"

# Check credentials in .env
cat backend/.env | grep DB_

# Verify firewall allows port 5432
netstat -tuln | grep 5432
```

### Issue: API Endpoint Returns 404
```bash
# Verify backend is running
curl http://localhost:4000/health

# Check route exists
curl -v http://localhost:4000/api/master/menus

# Check logs for routing errors
tail -f backend.log | grep -i "route\|menu"

# Verify middleware loading order
# Check backend/src/app.ts for route mounting
```

### Issue: Frontend Shows Blank Page
```bash
# Check browser console for errors (F12)
# Look for CORS, module, or API errors

# Verify frontend build succeeded
ls -la frontend/dist/index.html

# Check web server logs
tail -f /var/log/nginx/error.log  # If using nginx
tail -f /var/log/apache2/error.log  # If using Apache

# Test frontend directly
curl http://localhost/index.html | head -20
```

### Issue: Slow API Responses
```bash
# Check database query performance
psql -U postgres -d kltn_db -c "
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC LIMIT 10;"

# Check for missing indexes
psql -U postgres -d kltn_db -c "
  SELECT * FROM pg_stat_user_indexes
  WHERE schemaname = 'public';"

# Monitor query execution
EXPLAIN ANALYZE SELECT * FROM menus WHERE status = 'ACTIVE';"
```

### Issue: Out of Memory
```bash
# Check backend memory usage
ps aux | grep node
# Look at RSS (resident set size)

# Increase Node.js heap size
NODE_OPTIONS=--max-old-space-size=2048 npm start

# Check for memory leaks in logs
grep -i "leak\|memory" backend.log
```

---

## Scaling Considerations

### Horizontal Scaling
```bash
# Load balancer configuration (nginx)
upstream backend {
    server backend1:4000;
    server backend2:4000;
    server backend3:4000;
}

server {
    listen 80;
    location /api {
        proxy_pass http://backend;
    }
}
```

### Database Optimization
```sql
-- Create indexes for common queries
CREATE INDEX idx_menus_status ON menus(status);
CREATE INDEX idx_menus_order_position ON menus(order_position);
CREATE INDEX idx_menus_parent_id ON menus(parent_id);

-- Enable query performance insights
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Analyze query plans
ANALYZE;
```

### Caching Strategy
```typescript
// Redis cache for menus (backend)
const redis = require('redis').createClient();

app.get('/api/master/menus', async (req, res) => {
  const cached = await redis.get('menus:all');
  if (cached) return res.json(JSON.parse(cached));
  
  const data = await db.query('SELECT * FROM menus');
  await redis.setex('menus:all', 3600, JSON.stringify(data));
  res.json(data);
});
```

---

## Backup & Recovery

### Database Backup
```bash
# Full database backup
pg_dump -U postgres kltn_db > kltn_db_backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump -U postgres kltn_db | gzip > kltn_db_backup_$(date +%Y%m%d).sql.gz

# Automated daily backup
0 2 * * * pg_dump -U postgres kltn_db | gzip > /backups/kltn_db_$(date +\%Y\%m\%d).sql.gz
```

### Database Recovery
```bash
# Restore from backup
psql -U postgres kltn_db < kltn_db_backup_20260504.sql

# From compressed backup
gunzip < kltn_db_backup_20260504.sql.gz | psql -U postgres kltn_db
```

### Code Backup
```bash
# Backup application files
tar -czf app_backup_$(date +%Y%m%d).tar.gz \
  backend/ frontend/ migrations/

# Upload to storage
aws s3 cp app_backup_*.tar.gz s3://backups/
```

---

## Performance Tuning

### Backend Optimization
```typescript
// Add caching headers
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600');
  next();
});

// Enable compression
app.use(compression());

// Limit request size
app.use(express.json({ limit: '10mb' }));
```

### Database Tuning
```sql
-- PostgreSQL configuration (postgresql.conf)
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### Frontend Optimization
```bash
# Build with production optimizations
npm run build -- --mode production

# Enable service workers
npm install @vite-pwa/vite

# Code splitting
npm install @vitejs/plugin-react
```

---

## Log Management

### Application Logs
```bash
# Backend logs
tail -f backend.log
grep -i "error\|warn" backend.log

# Frontend logs (browser console)
# Open DevTools → Console tab

# Combined logs
tail -f *.log | grep -i "error"
```

### Log Rotation
```bash
# logrotate configuration
cat > /etc/logrotate.d/kltn-app <<EOF
/var/log/kltn-app/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 app app
    sharedscripts
    postrotate
        systemctl reload kltn-app > /dev/null 2>&1 || true
    endscript
}
EOF
```

---

## Security Checklist

- ✅ Database password in environment variables
- ✅ JWT secret configured and strong
- ✅ HTTPS enabled (SSL/TLS)
- ✅ CORS origins restricted
- ✅ Rate limiting enabled
- ✅ Input validation on backend
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (Content-Security-Policy headers)
- ✅ CSRF tokens on forms
- ✅ Secrets not in version control
- ✅ Regular security updates applied
- ✅ Firewall rules configured
- ✅ Backup encryption enabled

---

## Rollback Procedure

### If Frontend Deployment Fails
```bash
# Restore previous build
aws s3 cp s3://backups/frontend_previous.tar.gz .
tar -xzf frontend_previous.tar.gz
npm run build
# Redeploy
```

### If Backend Deployment Fails
```bash
# Stop current instance
systemctl stop kltn-backend

# Restore previous code
git checkout previous-tag

# Rebuild and restart
npm install
npm run build
systemctl start kltn-backend
```

### If Database Migration Fails
```bash
# Rollback migration
psql -U postgres -d kltn_db -f backend/migrations/003_create_menus_table_down.sql

# Restore from backup
pg_restore -U postgres -d kltn_db kltn_db_backup_20260504.sql

# Fix issue and reapply
# Then re-run migration
```

---

## Monitoring Dashboard

### Key Metrics to Monitor
```
Backend:
- API response time (target: < 500ms)
- Error rate (target: < 0.1%)
- Request count per minute
- Database connection pool usage
- Memory usage (target: < 50% of allocated)
- CPU usage (target: < 70%)

Frontend:
- Page load time (target: < 2s)
- Time to interactive (target: < 3s)
- Core Web Vitals (LCP, FID, CLS)
- JavaScript bundle size (target: < 100 KB gzip)
- CSS bundle size (target: < 20 KB gzip)

Database:
- Query latency (target: < 100ms p99)
- Connection pool exhaustion alerts
- Disk space usage
- Replication lag (if replicated)
- Lock contention
```

---

## Maintenance Windows

### Scheduled Maintenance
```bash
# Announce maintenance window
# Schedule: 2:00 AM - 3:00 AM EST

# During maintenance window:
1. Stop frontend serving
2. Show maintenance page
3. Stop backend
4. Backup database
5. Run migrations/updates
6. Test all endpoints
7. Start backend
8. Deploy frontend
9. Monitor for errors
10. Resume normal operations
```

### Zero-Downtime Deployment
```bash
# Using blue-green deployment
1. Deploy to "green" environment
2. Run smoke tests on green
3. Switch load balancer to green
4. Keep blue as rollback
5. Monitor green for 5 minutes
6. Decommission blue after 24 hours
```

---

## SLA & Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Availability | 99.9% | < 99.5% |
| API Response Time | < 500ms | > 1000ms |
| Database Availability | 99.99% | < 99.9% |
| Frontend Load Time | < 2s | > 5s |
| Error Rate | < 0.1% | > 0.5% |
| Database Disk Space | < 80% used | > 85% |

---

## Post-Deployment Checklist

- ✅ All services running
- ✅ Health checks passing
- ✅ Frontend loads without errors
- ✅ API endpoints responding
- ✅ Database queries performing well
- ✅ No error logs
- ✅ Monitoring alerts configured
- ✅ Backup completed
- ✅ Team notified
- ✅ Rollback plan ready

---

## Contact & Support

**On-Call Support:**
- Primary: engineering@example.com
- Secondary: ops@example.com
- Escalation: management@example.com

**Slack Channels:**
- #production-alerts
- #deployments
- #database-team

---

## Appendix: Quick Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend

# Restart a service
docker-compose restart backend

# SSH to production server
ssh -i key.pem ubuntu@production-server

# Check disk space
df -h

# Check memory
free -h

# Check running processes
ps aux | grep node

# Kill a process
kill -9 <pid>

# Restart service
systemctl restart kltn-backend

# View service status
systemctl status kltn-backend

# Enable service on boot
systemctl enable kltn-backend
```

---

**Last Updated:** May 4, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅

---

For questions or issues during deployment, refer to the main README files or contact the development team.
