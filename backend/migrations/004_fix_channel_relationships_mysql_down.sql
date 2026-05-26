-- MySQL Migration Rollback: Fix Channel Relationships
-- Restore original nested structure (reverse of up migration)

-- Step 1: Drop foreign key constraints added in up migration
ALTER TABLE channels 
DROP FOREIGN KEY IF EXISTS fk_channels_category_id,
DROP FOREIGN KEY IF EXISTS fk_channels_location_id;

ALTER TABLE advertising_contents 
DROP FOREIGN KEY IF EXISTS fk_advertising_contents_category_id;

ALTER TABLE physical_items 
DROP FOREIGN KEY IF EXISTS fk_physical_items_category_id,
DROP FOREIGN KEY IF EXISTS fk_physical_items_location_id;

-- Step 2: Drop unique constraint
ALTER TABLE channels 
DROP KEY IF EXISTS uq_channels_category_location;

-- Step 3: Remove new columns from channels
ALTER TABLE channels 
DROP COLUMN IF EXISTS category_id,
DROP COLUMN IF EXISTS location_id;

-- Step 4: Prepare old tables (in case we need to restore data)
-- Create temporary old tables if they don't exist
CREATE TABLE IF NOT EXISTS categories_old (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(2) UNIQUE,
  name VARCHAR(225),
  description TEXT,
  unit_price DECIMAL(14,2),
  status ENUM('ACTIVE', 'INACTIVE'),
  created_by CHAR(36),
  updated_by CHAR(36),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  channel_id CHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS locations_old (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(3) UNIQUE,
  name VARCHAR(225),
  address_line TEXT,
  latitude DECIMAL(8,6),
  longitude DECIMAL(9,6),
  status ENUM('ACTIVE', 'INACTIVE'),
  created_by CHAR(36),
  updated_by CHAR(36),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  channel_id CHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Drop the new independent tables
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS locations;

-- Step 6: Rename old tables back
RENAME TABLE categories_old TO categories,
             locations_old TO locations;

-- Step 7: Remove new columns from dependent tables
ALTER TABLE advertising_contents 
DROP COLUMN IF EXISTS category_id_new;

ALTER TABLE physical_items 
DROP COLUMN IF EXISTS category_id_new,
DROP COLUMN IF EXISTS location_id_new;

-- Step 8: Restore original data relationships
-- Note: This is a simplified rollback. Full restoration may require additional manual steps.
