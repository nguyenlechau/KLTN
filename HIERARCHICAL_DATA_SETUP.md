# Hierarchical Data Structure Implementation Guide

## Overview

This implementation restructures the database schema to support a hierarchical relationship:
- **Addresses** (formerly locations) - individual locations like HGM, VHG, etc.
- **Channels** (6 types) - CN, AF, SME, OOH, HO, Hệ sinh thái  
- **Location-Channels** (many-to-many) - which channels are available at each address
- **Ad Categories** (17 types) - independent product types (LB, DL, HL, DC, BN, ST, SS, PF, OL, MH, MA, HG, DM, MQ, BO, MO, BP)
- **Ad Physical Items** - actual ad placements linking address + category

## Setup Steps

### 1. Apply Database Migration

```bash
cd backend

# Apply the new hierarchical schema
npm run migrate -- 002_hierarchical_structure_up.sql

# Or using psql directly:
psql -U postgres -d kltn_db -f migrations/002_hierarchical_structure_up.sql
```

### 2. Prepare Seed Data

The system includes seed files:
- `seed-locations.json` - Address and channel mappings (sample data provided)
- `seed-items.json` - Physical items linking to locations and categories

**Important:** The provided seed files contain sample/demo data. For production with all 289 locations and 600+ items:
1. Parse your CSV data files into the JSON format
2. Place them in the backend directory
3. Run the seeding script

### 3. Run Data Import

```bash
# Compile TypeScript
npm run build

# Run the seed script
npm run ts-node -- seed-real-data.ts

# Or directly with npx
npx ts-node seed-real-data.ts
```

Expected output:
```
🚀 Starting data import...

✓ Found admin user: [uuid]

📍 Step 1: Ensuring channels exist...
  ✓ Channel CN exists
  ✓ Channel AF exists
  ... (6 total)

📂 Step 2: Importing 17 categories...
  ✓ Imported/verified 17 categories (X new)

📍 Step 3: Importing locations...
  ✓ Imported/verified N locations (X new)

🎁 Step 4: Importing physical items...
  ✓ Imported/verified N items (X new)

✅ Data import completed successfully!
```

### 4. Verify Data Import

```sql
-- Check addresses
SELECT COUNT(*) as total_addresses FROM addresses;

-- Check location-channel mappings
SELECT COUNT(*) as total_mappings FROM location_channels;

-- Check categories
SELECT COUNT(*) as total_categories FROM ad_categories;

-- Check physical items
SELECT COUNT(*) as total_items FROM ad_physical_items;

-- Sample query: Find all channels available at location HGM
SELECT 
  a.code, a.name, c.code as channel_code, c.name as channel_name
FROM addresses a
JOIN location_channels lc ON a.id = lc.location_id
JOIN channels c ON lc.channel_id = c.id
WHERE a.code = 'HGM';
```

## Data Model Relationships

### New Tables

#### addresses
```sql
- id (UUID, PK)
- code (VARCHAR(3), UNIQUE) -- Location code like HGM, VHG, etc.
- classification (VARCHAR(10)) -- CN | PGD | OOH
- name (VARCHAR(255))
- province, sub_district, address_line
- latitude, longitude
- csm_name, csm_email, csm_phone -- Contact details
- status (ENUM: ACTIVE | INACTIVE)
- created_at, updated_at
```

#### location_channels (Many-to-Many)
```sql
- id (UUID, PK)
- location_id (FK -> addresses)
- channel_id (FK -> channels)
- status (ENUM: ACTIVE | INACTIVE)
- UNIQUE(location_id, channel_id)
```

#### ad_categories
```sql
- id (UUID, PK)
- code (VARCHAR(2), UNIQUE) -- LB, DL, HL, etc.
- name (VARCHAR(255))
- unit_price (NUMERIC, nullable)
- unit_name (VARCHAR(50)) -- m2, cái, slot
- display_format (VARCHAR(20)) -- Offline | Online
- status (ENUM: ACTIVE | INACTIVE)
```

#### ad_physical_items
```sql
- id (UUID, PK)
- location_id (FK -> addresses)
- category_id (FK -> ad_categories)
- item_code (VARCHAR(128), UNIQUE) -- PMH.DL.01, TML.PF.01, etc.
- item_name (VARCHAR(255))
- width, length, height (NUMERIC, nullable)
- location_description (TEXT) -- "sau cái cây", "tầng lửng", etc.
- status (ENUM: ACTIVE | INACTIVE | PENDING | ON_HOLD | IN_PROGRESS)
```

## Query Examples

### Find all items at a specific location
```sql
SELECT 
  pi.item_code, pi.item_name, ac.name as category, ac.unit_name
FROM ad_physical_items pi
JOIN ad_categories ac ON pi.category_id = ac.id
JOIN addresses a ON pi.location_id = a.id
WHERE a.code = 'HGM'
ORDER BY pi.item_code;
```

### Find all locations supporting a specific channel
```sql
SELECT DISTINCT
  a.code, a.name, a.province, c.code as channel_code
FROM addresses a
JOIN location_channels lc ON a.id = lc.location_id
JOIN channels c ON lc.channel_id = c.id
WHERE c.code = 'CN'
ORDER BY a.province, a.name;
```

### Count items by category
```sql
SELECT 
  ac.code, ac.name, COUNT(*) as item_count
FROM ad_physical_items pi
JOIN ad_categories ac ON pi.category_id = ac.id
GROUP BY ac.id, ac.code, ac.name
ORDER BY item_count DESC;
```

## API Endpoints (To Be Implemented)

### Addresses
- `GET /api/addresses` - List all addresses
- `GET /api/addresses/:id` - Get single address with channels
- `POST /api/addresses` - Create new address
- `PATCH /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address

### Location-Channels
- `GET /api/addresses/:id/channels` - Get channels for address
- `POST /api/addresses/:id/channels` - Add channel to address
- `DELETE /api/addresses/:id/channels/:channelId` - Remove channel

### Ad Categories
- `GET /api/ad-categories` - List all categories
- `POST /api/ad-categories` - Create category
- `PATCH /api/ad-categories/:id` - Update category

### Ad Physical Items
- `GET /api/ad-items` - List items (with filtering)
- `GET /api/ad-items/:id` - Get single item
- `POST /api/ad-items` - Create item
- `PATCH /api/ad-items/:id` - Update item

## Frontend Updates Needed

### New Pages/Components
1. **AddressesScreen** - Manage addresses and channel assignments
2. **AdCategoriesScreen** - Manage the 17 ad categories
3. **AdItemsScreen** - Manage physical items with location/category linking

### Updates to Existing Components
- LocationsScreen → Migrate to use addresses + location_channels
- CategoriesScreen → Migrate to use ad_categories
- PhysicalItemsScreen → Update to use ad_physical_items

## Rollback Procedure

If needed to revert to the old schema:

```bash
# Rollback migration
psql -U postgres -d kltn_db -f migrations/002_hierarchical_structure_down.sql

# The old tables (locations, categories, physical_items) remain unchanged
# New tables (addresses, location_channels, ad_categories, ad_physical_items) are dropped
```

## Troubleshooting

### Migration Failed: "relation already exists"
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%address%' OR table_name LIKE '%location_channel%';

-- If they exist, you can safely drop them first:
DROP TABLE IF EXISTS ad_registration_items, ad_registrations, ad_physical_items, 
                     ad_categories, location_channels, addresses CASCADE;
```

### Seed Script Fails: "admin user not found"
```sql
-- Ensure admin user exists
SELECT * FROM users WHERE role = 'ADMIN' LIMIT 1;

-- Create one if needed (with proper password hashing)
INSERT INTO users (email, full_name, password_hash, role, status)
VALUES ('admin@example.com', 'Admin User', 'hashed_password', 'ADMIN', 'ACTIVE');
```

### Seed Script Hangs
- Check database connection timeout settings
- Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Check logs: `journalctl -u postgresql -n 50`

## Performance Considerations

For 289 locations × 600+ items:
- Create indexes on frequently queried columns ✓ (already included)
- Consider pagination for large result sets
- Use database connection pooling
- Monitor query performance with `EXPLAIN ANALYZE`

## Next Steps

1. ✅ Apply migration (002_hierarchical_structure_up.sql)
2. ✅ Prepare seed data files (seed-locations.json, seed-items.json)
3. ✅ Run seed-real-data.ts script
4. ⏳ Update frontend endpoints to use new tables
5. ⏳ Create new address/category/item management UI screens
6. ⏳ Test end-to-end workflows
7. ⏳ Update API documentation

