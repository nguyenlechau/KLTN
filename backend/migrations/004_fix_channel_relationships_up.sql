BEGIN;

-- Step 1: Create new independent categories table (without channel_id)
CREATE TABLE IF NOT EXISTS categories_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(2) NOT NULL UNIQUE,
  name VARCHAR(225) NOT NULL,
  description TEXT,
  unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
  status master_status NOT NULL DEFAULT 'ACTIVE',
  created_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  updated_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(trim(code)) = 2),
  CHECK (length(trim(name)) > 0)
);

-- Step 2: Create new independent locations table (without channel_id)
CREATE TABLE IF NOT EXISTS locations_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(3) NOT NULL UNIQUE,
  name VARCHAR(225) NOT NULL,
  address_line TEXT,
  latitude NUMERIC(8,6),
  longitude NUMERIC(9,6),
  status master_status NOT NULL DEFAULT 'ACTIVE',
  created_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  updated_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(trim(code)) = 3),
  CHECK (length(trim(name)) > 0),
  CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_categories_new_status ON categories_new(status);
CREATE INDEX IF NOT EXISTS idx_categories_new_code ON categories_new(code);
CREATE INDEX IF NOT EXISTS idx_locations_new_status ON locations_new(status);
CREATE INDEX IF NOT EXISTS idx_locations_new_code ON locations_new(code);

-- Step 3: Migrate data from old tables to new tables (only if data exists)
INSERT INTO categories_new (id, code, name, description, unit_price, status, created_by, updated_by, created_at, updated_at)
SELECT DISTINCT ON (code) id, code, name, description, unit_price, status, created_by, updated_by, created_at, updated_at
FROM categories
WHERE code IS NOT NULL
ORDER BY code, created_at DESC;

INSERT INTO locations_new (id, code, name, address_line, latitude, longitude, status, created_by, updated_by, created_at, updated_at)
SELECT DISTINCT ON (code) id, code, name, address_line, latitude, longitude, status, created_by, updated_by, created_at, updated_at
FROM locations
WHERE code IS NOT NULL
ORDER BY code, created_at DESC;

-- Step 4: Add category_id and location_id to channels table
ALTER TABLE channels 
ADD COLUMN category_id UUID REFERENCES categories_new(id) ON UPDATE CASCADE ON DELETE RESTRICT,
ADD COLUMN location_id UUID REFERENCES locations_new(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- Step 5: Drop old advertising_contents constraints that reference old categories
ALTER TABLE advertising_contents 
DROP CONSTRAINT IF EXISTS advertising_contents_category_id_fkey;

-- Step 6: Update advertising_contents to use new categories table
ALTER TABLE advertising_contents 
ADD COLUMN category_id_new UUID REFERENCES categories_new(id) ON UPDATE CASCADE;

-- Migrate data
UPDATE advertising_contents ac
SET category_id_new = cn.id
FROM categories_new cn
WHERE ac.category_id = cn.id;

-- Step 7: Update physical_items to use new tables
ALTER TABLE physical_items 
ADD COLUMN category_id_new UUID REFERENCES categories_new(id) ON UPDATE CASCADE,
ADD COLUMN location_id_new UUID REFERENCES locations_new(id) ON UPDATE CASCADE;

-- Migrate data
UPDATE physical_items pi
SET category_id_new = cn.id
FROM categories_new cn
WHERE pi.category_id = cn.id;

UPDATE physical_items pi
SET location_id_new = ln.id
FROM locations_new ln
WHERE pi.location_id = ln.id;

-- Step 8: Now handle the actual replacements by recreating the tables
-- Drop old tables and rename new ones
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS locations CASCADE;

ALTER TABLE categories_new RENAME TO categories;
ALTER TABLE locations_new RENAME TO locations;

-- Drop old columns from tables and keep only the _new versions
ALTER TABLE advertising_contents
DROP COLUMN IF EXISTS category_id;

ALTER TABLE advertising_contents
RENAME COLUMN category_id_new TO category_id;

ALTER TABLE physical_items
DROP COLUMN IF EXISTS category_id;

ALTER TABLE physical_items
DROP COLUMN IF EXISTS location_id;

ALTER TABLE physical_items
RENAME COLUMN category_id_new TO category_id;

ALTER TABLE physical_items
RENAME COLUMN location_id_new TO location_id;

-- Update channel's channel_id references in dependent tables
-- Note: advertising_contents no longer has channel_id need - it now has both category_id AND location context via those FKs
-- But keep channel_id for backward compatibility if needed

-- Step 9: Add unique constraint to ensure each channel has unique category-location combo
ALTER TABLE channels 
ADD CONSTRAINT uq_channels_category_location UNIQUE (category_id, location_id);

-- Step 10: Populate some default categories if they don't exist
INSERT INTO categories (code, name, description, unit_price, status, created_at, updated_at)
VALUES 
  ('EL', 'Electronics', 'Electronics and digital products', 0.00, 'ACTIVE', NOW(), NOW()),
  ('AP', 'Appliances', 'Home appliances and equipment', 0.00, 'ACTIVE', NOW(), NOW()),
  ('CL', 'Clothing', 'Clothing and apparel', 0.00, 'ACTIVE', NOW(), NOW()),
  ('FD', 'Food & Beverage', 'Food and beverage products', 0.00, 'ACTIVE', NOW(), NOW()),
  ('BK', 'Books', 'Books and educational materials', 0.00, 'ACTIVE', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Step 11: Populate some default locations if they don't exist
INSERT INTO locations (code, name, status, created_at, updated_at)
VALUES 
  ('DHK', 'Dhaka', 'ACTIVE', NOW(), NOW()),
  ('CHT', 'Chittagong', 'ACTIVE', NOW(), NOW()),
  ('KHU', 'Khulna', 'ACTIVE', NOW(), NOW()),
  ('RJH', 'Rajshahi', 'ACTIVE', NOW(), NOW()),
  ('SYL', 'Sylhet', 'ACTIVE', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

COMMIT;

