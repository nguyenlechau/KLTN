-- MySQL Migration: Fix Channel Relationships
-- Convert categories and locations to independent master data

-- Step 1: Create new independent categories table (without channel_id)
CREATE TABLE IF NOT EXISTS categories_new (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(2) NOT NULL UNIQUE,
  name VARCHAR(225) NOT NULL,
  description TEXT,
  unit_price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_by CHAR(36),
  updated_by CHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_categories_new_status (status),
  KEY idx_categories_new_code (code),
  CONSTRAINT chk_category_code_length CHECK (LENGTH(TRIM(code)) = 2),
  CONSTRAINT chk_category_name_length CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT chk_category_unit_price CHECK (unit_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Create new independent locations table (without channel_id)
CREATE TABLE IF NOT EXISTS locations_new (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(3) NOT NULL UNIQUE,
  name VARCHAR(225) NOT NULL,
  address_line TEXT,
  latitude DECIMAL(8,6),
  longitude DECIMAL(9,6),
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_by CHAR(36),
  updated_by CHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_locations_new_status (status),
  KEY idx_locations_new_code (code),
  CONSTRAINT chk_location_code_length CHECK (LENGTH(TRIM(code)) = 3),
  CONSTRAINT chk_location_name_length CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT chk_location_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT chk_location_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Migrate data from old tables to new tables (only if they exist)
INSERT IGNORE INTO categories_new (id, code, name, description, unit_price, status, created_by, updated_by, created_at, updated_at)
SELECT c.id, c.code, c.name, c.description, c.unit_price, c.status, c.created_by, c.updated_by, c.created_at, c.updated_at
FROM categories c
WHERE c.code IS NOT NULL
GROUP BY c.code;

INSERT IGNORE INTO locations_new (id, code, name, address_line, latitude, longitude, status, created_by, updated_by, created_at, updated_at)
SELECT l.id, l.code, l.name, l.address_line, l.latitude, l.longitude, l.status, l.created_by, l.updated_by, l.created_at, l.updated_at
FROM locations l
WHERE l.code IS NOT NULL
GROUP BY l.code;

-- Step 4: Add category_id and location_id to channels table
SET @charset_check = @@character_set_client;
SET character_set_client = 'utf8mb4';

ALTER TABLE channels 
ADD COLUMN IF NOT EXISTS category_id CHAR(36),
ADD COLUMN IF NOT EXISTS location_id CHAR(36),
ADD KEY IF NOT EXISTS idx_channels_category_id (category_id),
ADD KEY IF NOT EXISTS idx_channels_location_id (location_id);

-- Step 5: Update advertising_contents to use new categories table
ALTER TABLE advertising_contents 
ADD COLUMN IF NOT EXISTS category_id_new CHAR(36);

-- Migrate data
UPDATE advertising_contents ac
INNER JOIN categories_new cn ON ac.category_id = cn.id
SET ac.category_id_new = cn.id;

-- Step 6: Update physical_items to use new tables
ALTER TABLE physical_items 
ADD COLUMN IF NOT EXISTS category_id_new CHAR(36),
ADD COLUMN IF NOT EXISTS location_id_new CHAR(36);

-- Migrate data
UPDATE physical_items pi
INNER JOIN categories_new cn ON pi.category_id = cn.id
SET pi.category_id_new = cn.id;

UPDATE physical_items pi
INNER JOIN locations_new ln ON pi.location_id = ln.id
SET pi.location_id_new = ln.id;

-- Step 7: Drop old foreign key constraints
ALTER TABLE advertising_contents 
DROP FOREIGN KEY IF EXISTS advertising_contents_category_id_fkey;

ALTER TABLE physical_items 
DROP FOREIGN KEY IF EXISTS physical_items_category_id_fkey,
DROP FOREIGN KEY IF EXISTS physical_items_location_id_fkey;

-- Step 8: Drop old tables and rename new ones
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS locations;

RENAME TABLE categories_new TO categories;
RENAME TABLE locations_new TO locations;

-- Step 9: Drop old columns and rename new columns
ALTER TABLE advertising_contents 
DROP COLUMN IF EXISTS category_id,
CHANGE COLUMN category_id_new category_id CHAR(36);

ALTER TABLE physical_items 
DROP COLUMN IF EXISTS category_id,
DROP COLUMN IF EXISTS location_id,
CHANGE COLUMN category_id_new category_id CHAR(36),
CHANGE COLUMN location_id_new location_id CHAR(36);

-- Step 10: Add foreign key constraints
ALTER TABLE channels 
ADD CONSTRAINT fk_channels_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT fk_channels_location_id FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT uq_channels_category_location UNIQUE (category_id, location_id);

ALTER TABLE advertising_contents 
ADD CONSTRAINT fk_advertising_contents_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE physical_items 
ADD CONSTRAINT fk_physical_items_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT fk_physical_items_location_id FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 11: Populate some default categories if they don't exist
INSERT INTO categories (code, name, description, unit_price, status, created_at, updated_at)
VALUES 
  ('EL', 'Electronics', 'Electronics and digital products', 0.00, 'ACTIVE', NOW(), NOW()),
  ('AP', 'Appliances', 'Home appliances and equipment', 0.00, 'ACTIVE', NOW(), NOW()),
  ('CL', 'Clothing', 'Clothing and apparel', 0.00, 'ACTIVE', NOW(), NOW()),
  ('FD', 'Food & Beverage', 'Food and beverage products', 0.00, 'ACTIVE', NOW(), NOW()),
  ('BK', 'Books', 'Books and educational materials', 0.00, 'ACTIVE', NOW(), NOW())
ON DUPLICATE KEY UPDATE code = VALUES(code);

-- Step 12: Populate some default locations if they don't exist
INSERT INTO locations (code, name, address_line, status, created_at, updated_at)
VALUES 
  ('DHK', 'Dhaka', 'Dhaka metropolitan area', 'ACTIVE', NOW(), NOW()),
  ('CHT', 'Chittagong', 'Chittagong region', 'ACTIVE', NOW(), NOW()),
  ('KHU', 'Khulna', 'Khulna region', 'ACTIVE', NOW(), NOW()),
  ('RJH', 'Rajshahi', 'Rajshahi region', 'ACTIVE', NOW(), NOW()),
  ('SYL', 'Sylhet', 'Sylhet region', 'ACTIVE', NOW(), NOW())
ON DUPLICATE KEY UPDATE code = VALUES(code);

-- Restore character set
SET character_set_client = @charset_check;
