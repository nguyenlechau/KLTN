-- Migration: Add hierarchical address-channel-category structure for real-world data
BEGIN;

-- Create addresses table for the new hierarchical structure
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(3) NOT NULL UNIQUE,
  classification VARCHAR(10) NOT NULL CHECK (classification IN ('CN', 'PGD', 'OOH')), -- CN=Central, PGD=Branch, OOH=Billboard
  name VARCHAR(255) NOT NULL,
  province VARCHAR(100),
  sub_district VARCHAR(100),
  address_line TEXT,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  csm_name VARCHAR(255),
  csm_email VARCHAR(255),
  csm_phone VARCHAR(20),
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_addresses_code ON addresses(upper(code));
CREATE INDEX IF NOT EXISTS idx_addresses_province ON addresses(province);
CREATE INDEX IF NOT EXISTS idx_addresses_classification ON addresses(classification);

-- Create location_channels table for many-to-many relationship
CREATE TABLE IF NOT EXISTS location_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES addresses(id) ON DELETE CASCADE ON UPDATE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE ON UPDATE CASCADE,
  status master_status NOT NULL DEFAULT 'ACTIVE',
  created_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  updated_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (location_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_location_channels_location_id ON location_channels(location_id);
CREATE INDEX IF NOT EXISTS idx_location_channels_channel_id ON location_channels(channel_id);

-- Create new global categories table (independent of channels)
CREATE TABLE IF NOT EXISTS ad_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(2) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit_price NUMERIC(15,2) CHECK (unit_price IS NULL OR unit_price >= 0),
  unit_name VARCHAR(50), -- e.g., 'm2', 'cái', 'slot'
  display_format VARCHAR(20) DEFAULT 'Offline', -- 'Offline' or 'Online'
  status master_status NOT NULL DEFAULT 'ACTIVE',
  created_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  updated_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(trim(code)) = 2),
  CHECK (length(trim(name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ad_categories_code ON ad_categories(upper(code));

-- Create physical items for new hierarchical structure
CREATE TABLE IF NOT EXISTS ad_physical_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES addresses(id) ON UPDATE CASCADE,
  category_id UUID NOT NULL REFERENCES ad_categories(id) ON UPDATE CASCADE,
  item_code VARCHAR(128) NOT NULL UNIQUE,
  item_name VARCHAR(255) NOT NULL,
  width NUMERIC(6,2),
  length NUMERIC(6,2),
  height NUMERIC(6,2),
  description TEXT,
  location_description TEXT, -- e.g., "sau cái cây", "tầng lửng"
  image_key TEXT,
  status physical_item_status NOT NULL DEFAULT 'ACTIVE',
  created_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  updated_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(trim(item_code)) > 0),
  CHECK (length(trim(item_name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ad_physical_items_code ON ad_physical_items(upper(item_code));
CREATE INDEX IF NOT EXISTS idx_ad_physical_items_location_id ON ad_physical_items(location_id);
CREATE INDEX IF NOT EXISTS idx_ad_physical_items_category_id ON ad_physical_items(category_id);
CREATE INDEX IF NOT EXISTS idx_ad_physical_items_status ON ad_physical_items(status);

-- Create ad_registrations for new structure (similar to advertising_registrations but linked to new tables)
CREATE TABLE IF NOT EXISTS ad_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_no VARCHAR(64) NOT NULL UNIQUE,
  campaign_name VARCHAR(255) NOT NULL,
  campaign_description TEXT,
  budget_estimate NUMERIC(15,2) NOT NULL CHECK (budget_estimate >= 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  document_key TEXT,
  representative_name VARCHAR(255),
  representative_phone VARCHAR(20),
  status registration_status NOT NULL DEFAULT 'DRAFT',
  created_by UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
  updated_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(trim(campaign_name)) > 0),
  CHECK (end_date > start_date),
  CHECK (representative_phone IS NULL OR representative_phone ~ '^[0-9]{10,20}$')
);

CREATE INDEX IF NOT EXISTS idx_ad_registrations_status ON ad_registrations(status);
CREATE INDEX IF NOT EXISTS idx_ad_registrations_created_by ON ad_registrations(created_by);
CREATE INDEX IF NOT EXISTS idx_ad_registrations_dates ON ad_registrations(start_date, end_date);

-- Create ad_registration_items for new structure
CREATE TABLE IF NOT EXISTS ad_registration_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES ad_registrations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  physical_item_id UUID NOT NULL REFERENCES ad_physical_items(id) ON UPDATE CASCADE,
  unit_price NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_amount NUMERIC(17,2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (registration_id, physical_item_id)
);

CREATE INDEX IF NOT EXISTS idx_ad_registration_items_registration_id ON ad_registration_items(registration_id);
CREATE INDEX IF NOT EXISTS idx_ad_registration_items_physical_item_id ON ad_registration_items(physical_item_id);

COMMIT;
