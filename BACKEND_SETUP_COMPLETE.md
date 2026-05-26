# 🚀 KLTN Backend Implementation - Phase 4: Production Setup

## What's Been Built

### ✅ Complete Backend Service Layer
1. **Database Layer** (`src/db/postgres.ts`)
   - PostgreSQL connection pool
   - Query execution utilities
   - Transaction support
   - Type-safe query results

2. **Master Data Services** (3 complete)
   - **Content Service** (`src/services/contentService.ts`)
     - Create/read/update/delete advertising content
     - Image gallery management (up to 10 images)
     - Content cloning
     - Status auto-calculation from end dates
     - Auto-generated content codes
   
   - **Location Service** (`src/services/locationService.ts`)
     - Position management (3-char codes, unique per channel)
     - GPS coordinate support
     - Phone and email validation
     - Status propagation to items
     - Deactivation with item cascade
   
   - **Category Service** (`src/services/categoryService.ts`)
     - Advertising format management (LED, Light Box, etc.)
     - Unit pricing configuration
     - Price update with impact analysis
     - Automatic recalculation of registrations in approval phase
     - Deactivation with item cascade
   
   - **Item Service** (`src/services/itemService.ts`)
     - Physical item management
     - Auto-generated codes (PositionCode.CategoryCode.SeqNo)
     - Batch creation support
     - Status validation based on parents
     - Cannot edit items with status TREO

3. **API Routes** (`src/routes/masterDataRoutes.ts`)
   - RESTful endpoints for all master data
   - Full pagination and search support
   - Proper error handling and validation
   - All 30+ endpoints documented inline

4. **Database Migration**
   - 11 complete tables with relationships
   - Foreign key constraints with CASCADE deletes
   - Proper indexes for performance
   - Soft-delete pattern (deleted_at timestamps)
   - Seed data: 3 departments, 4 test users, 2 channels, 2 categories

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Ensure PostgreSQL is Running
```bash
# Check if PostgreSQL is running
psql --version

# If not running:
# Mac: brew services start postgresql@15
# Windows: Start PostgreSQL service from control panel
# Linux: sudo systemctl start postgresql
```

### 3. Create Local Database and Apply Migrations
```bash
# Run setup script (creates database and applies migrations)
bash setup-db.sh

# Or manually:
psql -h localhost -U postgres -f backend/migrations/005_create_real_schema_up.sql
```

### 4. Start Backend Server
```bash
npm run dev
```

Expected output:
```
🔌 Testing database connection...
✅ Backend running on port 4000
```

### 5. Verify API is Working
```bash
# Get auth token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kltn.com","password":"password123"}'

# Then use the token to list categories
curl -X GET http://localhost:4000/api/v1/categories \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Database Configuration

The system uses PostgreSQL with these credentials (configured in `.env`):
- **Host:** localhost
- **Port:** 5432
- **Database:** kltn_db
- **Username:** postgres
- **Password:** postgres

Modify `.env` if your PostgreSQL setup is different.

## Test Data

After running migrations, you have:
- **Users:** admin@kltn.com, john@kltn.com, jane@kltn.com, manager@kltn.com (all use: password123)
- **Channels:** Indoor, Outdoor
- **Categories:** LED Screen (code: LS), Light Box (code: LB)
- **Departments:** HO, NB1, NB2

## API Endpoints Reference

### Content Management
- `GET /api/v1/content` - List content
- `GET /api/v1/content/:id` - Get content details
- `POST /api/v1/content` - Create content
- `PUT /api/v1/content/:id` - Update content
- `DELETE /api/v1/content/:id` - Delete content
- `POST /api/v1/content/:id/clone` - Clone content
- `POST /api/v1/content/:id/images` - Add image to content

### Location Management
- `GET /api/v1/locations` - List locations
- `GET /api/v1/locations/:id` - Get location
- `POST /api/v1/locations` - Create location
- `PUT /api/v1/locations/:id` - Update location
- `DELETE /api/v1/locations/:id` - Delete location

### Category Management
- `GET /api/v1/categories` - List categories
- `GET /api/v1/categories/:id` - Get category
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/:id` - Update category
- `PUT /api/v1/categories/:id/price` - Update price (with impact analysis)
- `DELETE /api/v1/categories/:id` - Delete category

### Item Management
- `GET /api/v1/items` - List items
- `GET /api/v1/items/:id` - Get item
- `POST /api/v1/items/batch-create` - Batch create items
- `PUT /api/v1/items/:id` - Update item
- `DELETE /api/v1/items/:id` - Delete item

## Next Phase: Frontend Integration

### Priority 1 (This Week)
1. Create Advertising Content screens (List + Create/Edit)
2. Create Registration List screen with hierarchical selection
3. Create Location Management screens

### Priority 2 (Following Week)
1. Create Category Management screens
2. Create Physical Item Management screens
3. Implement workflow approval screens

### Priority 3 (Week After)
1. Deployment acceptance screen with photo upload
2. Audit log/history screens
3. User and role management screens

## Troubleshooting

### Database Connection Failed
```
Error: "could not connect to server: Connection refused"
```
- Ensure PostgreSQL is running
- Check .env file credentials
- Try: `psql -h localhost -U postgres`

### Migration Already Applied
```
Error: "relation 'users' already exists"
```
- Database already set up (skip migration step)
- Or reset: `bash backend/setup-db.sh --reset`

### TypeScript Compilation Error
```
Error: "Cannot find module 'uuid'"
```
- Run: `npm install uuid @types/uuid`

### API Returns 401 Unauthorized
- Get new token: POST /api/auth/login
- Include token in header: `Authorization: Bearer TOKEN`

## Architecture Notes

### Service Pattern Used
All services follow consistent structure:
```typescript
// CRUD operations
createEntity() → Insert + return
getById(id) → Select by ID  
list(limit, offset, filters) → Paginated list with search
updateEntity(id, data) → Selective update
deleteEntity(id) → Soft delete

// Business logic
domainSpecificFunction() → Complex rules
```

### Status Propagation
- Category/Location status changes cascade to their items
- Items cannot be ACTIVE if parent is INACTIVE
- Soft-delete pattern used everywhere (deleted_at timestamp)

### Price Calculation
- Category price updates only affect registrations in approval phase
- Automatically recalculates: registration_items totals and registration grand total
- Prices lock when workflow reaches BRAND_MANAGER_APPROVAL

### Error Handling
- All endpoints return: `{ ok: boolean, data?: object, error?: string }`
- Meaningful Vietnamese error messages for business logic violations
- Proper HTTP status codes (400, 404, 500)

## Next Immediate Steps

1. **Start Backend:** `npm run dev`
2. **Start Frontend:** `cd ../frontend && npm run dev`
3. **Create screens** matching design mockups
4. **Connect frontend** to these API endpoints
5. **Test end-to-end workflows** with real data

## Questions?

Refer to:
- `PRODUCT_SPECIFICATION.md` - Complete requirements
- `IMPLEMENTATION_GAP_ANALYSIS.md` - Roadmap
- `DATABASE_SETUP_GUIDE.md` - Database-specific issues
