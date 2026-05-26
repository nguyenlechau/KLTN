BEGIN;

-- Rollback: Restore original schema

-- Step 1: Drop the new unique constraint
ALTER TABLE channels 
DROP CONSTRAINT IF EXISTS uq_channels_category_location;

-- Step 2: Drop category_id and location_id from channels
ALTER TABLE channels 
DROP COLUMN IF EXISTS category_id,
DROP COLUMN IF EXISTS location_id;

-- Step 3: Recreate old categories table with channel_id
CREATE TABLE IF NOT EXISTS categories_old (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON UPDATE CASCADE,
  code VARCHAR(2) NOT NULL,
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

-- Step 4: Recreate old locations table with channel_id
CREATE TABLE IF NOT EXISTS locations_old (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON UPDATE CASCADE,
  code VARCHAR(3) NOT NULL,
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

-- Step 5: Recreate old advertising_contents structure
ALTER TABLE advertising_contents 
ADD COLUMN category_id_old UUID REFERENCES categories_old(id) ON UPDATE CASCADE;

-- Step 6: Recreate old physical_items structure
ALTER TABLE physical_items 
ADD COLUMN category_id_old UUID REFERENCES categories_old(id) ON UPDATE CASCADE,
ADD COLUMN location_id_old UUID REFERENCES locations_old(id) ON UPDATE CASCADE;

-- Step 7: Drop new independent tables
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS locations CASCADE;

-- Step 8: Rename old tables back
ALTER TABLE categories_old RENAME TO categories;
ALTER TABLE locations_old RENAME TO locations;

-- Step 9: Rename columns back
ALTER TABLE advertising_contents 
DROP COLUMN IF EXISTS category_id,
RENAME COLUMN category_id_old TO category_id;

ALTER TABLE physical_items 
DROP COLUMN IF EXISTS category_id,
DROP COLUMN IF EXISTS location_id,
RENAME COLUMN category_id_old TO category_id,
RENAME COLUMN location_id_old TO location_id;

-- Step 10: Recreate old indexes
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_code_upper ON categories (upper(code));
CREATE INDEX IF NOT EXISTS idx_categories_channel_id ON categories(channel_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_locations_channel_code_upper ON locations (channel_id, upper(code));
CREATE INDEX IF NOT EXISTS idx_locations_channel_id ON locations(channel_id);

COMMIT;
