# Quick Start Guide - Data Import

## 🎯 What's Ready Now

✅ **Database Migration** - New hierarchical schema ready  
✅ **Import Script** - Automated data loading system  
✅ **Sample Data** - Demo locations and items for testing  
✅ **Documentation** - Complete setup and API guides  

## ⚡ 5-Minute Quick Start

### 1. Apply Database Migration
```bash
cd d:\JN\KLTN\backend

# Run migration
psql -U postgres -d kltn_db -f migrations/002_hierarchical_structure_up.sql

# Verify success (should show 6 channels)
psql -U postgres -d kltn_db -c "SELECT COUNT(*) FROM channels;"
```

### 2. Run Seed Script (with sample data)
```bash
# Install dependencies if needed
npm install

# Compile and run
npx ts-node seed-real-data.ts
```

Expected output:
```
🚀 Starting data import...
✓ Found admin user
📍 Step 1: Ensuring channels exist...
  ✓ Channel CN exists
  ✓ Channel AF exists
  ...
📂 Step 2: Importing 17 categories...
  ✓ Imported/verified 17 categories
📍 Step 3: Importing locations...
  ✓ Imported/verified 20 locations
🎁 Step 4: Importing physical items...
  ✓ Imported/verified ~30 items
✅ Data import completed successfully!
```

### 3. Verify the Data
```bash
# Check what was imported
psql -U postgres -d kltn_db << 'EOF'
SELECT 
  'Addresses' as table_name, COUNT(*) as count FROM addresses
UNION ALL
SELECT 'Channels', COUNT(*) FROM channels
UNION ALL  
SELECT 'Location-Channels', COUNT(*) FROM location_channels
UNION ALL
SELECT 'Ad Categories', COUNT(*) FROM ad_categories
UNION ALL
SELECT 'Ad Items', COUNT(*) FROM ad_physical_items;
EOF
```

## 📊 With Your Real Data (289 Locations + 600 Items)

### Step 1: Prepare Your Data
Convert your CSV data to JSON format:

**seed-locations.json format:**
```json
{
  "locations": [
    {
      "code": "HGM",
      "classification": "CN",
      "name": "CN Sở Giao Dịch",
      "province": "Hà Nội",
      "subDistrict": "Nội thành",
      "address": "Tầng 1 và tầng 3...",
      "channels": ["CN", "AF", "SME", "HO"]
    },
    // ... 288 more locations
  ]
}
```

**seed-items.json format:**
```json
{
  "items": [
    {
      "code": "PMH.DL.01",
      "name": "Decal lưới PGD Phú Mỹ Hưng 01",
      "width": 3.9,
      "length": 3.07,
      "description": "sau cái cây",
      "category": "DL",
      "location": "PMH"
    },
    // ... 600+ more items
  ]
}
```

### Step 2: Update Seed Files
```bash
# Replace the sample data files with your complete data
cd d:\JN\KLTN\backend

# Copy your prepared JSON files
# seed-locations.json (289 locations)
# seed-items.json (600+ items)
```

### Step 3: Run Import
```bash
npx ts-node seed-real-data.ts
```

## 🔍 Verify Import Success

```bash
# Check counts match expectations
psql -U postgres -d kltn_db << 'EOF'
-- Should show ~289
SELECT COUNT(*) as total_addresses FROM addresses;

-- Should show 6
SELECT COUNT(DISTINCT channel_id) as unique_channels FROM location_channels;

-- Should show 17  
SELECT COUNT(*) as total_categories FROM ad_categories;

-- Should show ~600
SELECT COUNT(*) as total_items FROM ad_physical_items;

-- Check a specific location's channels
SELECT c.code, c.name 
FROM channels c
JOIN location_channels lc ON c.id = lc.channel_id
JOIN addresses a ON lc.location_id = a.id
WHERE a.code = 'HGM'
ORDER BY c.code;
EOF
```

## 📁 Files Overview

| File | Purpose | Status |
|------|---------|--------|
| `migrations/002_hierarchical_structure_up.sql` | Create new tables | ✅ Ready |
| `migrations/002_hierarchical_structure_down.sql` | Rollback migration | ✅ Ready |
| `seed-real-data.ts` | Import script | ✅ Ready |
| `seed-locations.json` | Location data | ⚠️ Sample data (update with real 289) |
| `seed-items.json` | Item data | ⚠️ Sample data (update with real 600+) |

## ⚠️ Important

1. **Admin User Required**
   ```bash
   # Make sure admin user exists:
   psql -U postgres -d kltn_db -c "SELECT * FROM users WHERE role = 'ADMIN';"
   
   # If missing, create one:
   psql -U postgres -d kltn_db << 'EOF'
   INSERT INTO users (id, email, full_name, password_hash, role, status, created_at)
   VALUES (gen_random_uuid(), 'admin@example.com', 'Admin User', 
           '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
           'ADMIN', 'ACTIVE', NOW());
   EOF
   ```

2. **Idempotent Script** - Safe to run multiple times (won't duplicate)

3. **Rollback Available**
   ```bash
   psql -U postgres -d kltn_db -f migrations/002_hierarchical_structure_down.sql
   ```

## 🎓 Understanding the Structure

```
1 Address (e.g., HGM) 
    ↓
    Can have Multiple Channels (CN, AF, SME, HO - via location_channels)
    ↓
    Many Physical Items (PMH.DL.01, PMH.HL.01, etc.)
    ↓
    Each Item has 1 Category (DL, HL, etc. - one of 17 types)
```

## 🚀 Next Steps After Import

1. **Frontend Updates** (see `HIERARCHICAL_DATA_SETUP.md`)
   - Create `/api/addresses` endpoints
   - Create `/api/ad-categories` endpoints  
   - Create `/api/ad-items` endpoints

2. **UI Components**
   - Build AddressesScreen
   - Build AdCategoriesScreen
   - Update existing screens to use new tables

3. **Testing**
   - Verify data displays correctly
   - Test CRUD operations
   - Check channel/location relationships

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Migration fails | Check: `psql -U postgres -d kltn_db -c "SELECT COUNT(*) FROM addresses;"` Should error. |
| Seed script hangs | Verify PostgreSQL is running: `pg_isready` |
| "Admin user not found" | Create admin user (see above) |
| Data not importing | Check JSON format in seed files |
| Want to restart | Run rollback migration, then up migration again |

## 📚 Full Documentation

For detailed information, see:
- `HIERARCHICAL_DATA_SETUP.md` - Complete setup guide
- `DATA_RESTRUCTURING_SUMMARY.md` - Technical overview

---

**Status:** ✅ Infrastructure ready. Awaiting real data integration and frontend implementation.
