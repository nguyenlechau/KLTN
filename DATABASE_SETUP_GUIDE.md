# Database Setup Guide

This guide will help you set up the local PostgreSQL database for the KLTN system.

## Prerequisites

1. **PostgreSQL installed** (version 12+)
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql@15`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Verify PostgreSQL is running**
   ```bash
   psql --version
   ```

## Quick Setup (Automated)

### Step 1: Navigate to backend directory
```bash
cd backend
```

### Step 2: Run the setup script
```bash
# On Mac/Linux
bash setup-db.sh

# On Windows (PowerShell)
# First, ensure you can run scripts:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
bash setup-db.sh
```

This script will:
- Create the PostgreSQL database `kltn_db`
- Apply all migrations (11 tables)
- Seed test data (users, channels, categories, locations)
- Verify the connection

### Step 3: Verify setup
```bash
# Connect to database and check tables
psql -h localhost -U postgres -d kltn_db -c "\dt"
```

You should see:
- advertising_content
- categories
- channels
- locations
- physical_items
- registration_items
- registrations
- users
- departments
- And 3 others

### Step 4: Start the backend
```bash
npm run dev
```

Should see:
```
✅ Backend running on port 4000
```

## Manual Setup (if script fails)

### Step 1: Connect to PostgreSQL
```bash
psql -h localhost -U postgres
```

### Step 2: Create database
```sql
CREATE DATABASE kltn_db;
\c kltn_db
```

### Step 3: Run migrations
```bash
psql -h localhost -U postgres -d kltn_db -f migrations/005_create_real_schema_up.sql
```

### Step 4: Verify
```bash
psql -h localhost -U postgres -d kltn_db -c "SELECT COUNT(*) FROM users;"
```

Should return count of 4 (admin, john, jane, manager)

## Troubleshooting

### Error: "could not connect to server"
- Make sure PostgreSQL service is running
- Windows: `pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start`
- Mac: `brew services start postgresql@15`
- Linux: `sudo systemctl start postgresql`

### Error: "role 'postgres' does not exist"
- You may have a different PostgreSQL user, check with: `psql -U <your-username> -h localhost`
- Update `.env` file with correct credentials

### Error: "database 'kltn_db' does not exist"
- Run migration step again
- Or manually create: `createdb -h localhost -U postgres kltn_db`

### Need to reset database
```bash
# Drop and recreate
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS kltn_db;"
psql -h localhost -U postgres -f migrations/005_create_real_schema_up.sql
```

## Database Schema

The migration creates the following tables:

### Master Data
- `departments` - Organization departments
- `channels` - Channel (Indoor/Outdoor)
- `categories` - Advertising formats (LED, Light Box)
- `locations` - Physical positions
- `physical_items` - Individual advertising items at locations

### Content Management
- `advertising_content` - Ad designs and content
- `content_images` - Images for advertising content

### Registration (Workflow)
- `registrations` - Registration requests
- `registration_content` - Content selected in registration
- `registration_items` - Physical items selected in registration
- `registration_approvals` - Approval chain tracking
- `deployment_acceptance` - Deployment photos and acceptance

### Users & Audit
- `users` - User accounts with roles
- `audit_log` - Change tracking

## Test Data

Seed data includes:
- 3 Departments (HO, NB1, NB2)
- 4 Users (admin, john, jane, manager) - all with password: `password123`
- 2 Channels (Indoor, Outdoor)
- 2 Categories (LED Screen, Light Box)

## API Testing

After setup, test the API:

```bash
# Get auth token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kltn.com","password":"password123"}'

# List categories (use token from above)
curl -X GET http://localhost:4000/api/v1/categories \
  -H "Authorization: Bearer <token>"
```

## Next Steps

After database setup:
1. Start backend: `npm run dev`
2. Start frontend: `cd ../frontend && npm run dev`
3. Open browser: http://localhost:5173
4. Login with admin@kltn.com / password123
