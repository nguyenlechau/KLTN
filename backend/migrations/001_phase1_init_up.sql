BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'master_status') THEN
    CREATE TYPE master_status AS ENUM ('ACTIVE', 'INACTIVE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'physical_item_status') THEN
    CREATE TYPE physical_item_status AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'ON_HOLD', 'IN_PROGRESS');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status') THEN
    CREATE TYPE registration_status AS ENUM (
      'DRAFT',
      'SUPERVISOR_REVIEW',
      'CENTRAL_OPS_REVIEW',
      'MANAGER_APPROVAL',
      'APPROVED',
      'DEPLOYMENT_PREP',
      'FINAL_ACCEPTANCE',
      'COMPLETED',
      'REVISION_REQUIRED'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(trim(code)) > 0),
  CHECK (length(trim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(128) NOT NULL UNIQUE,
  resource VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(trim(code)) > 0),
  CHECK (length(trim(resource)) > 0),
  CHECK (length(trim(action)) > 0)
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON UPDATE CASCADE,
  status user_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (length(trim(full_name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (lower(email));

CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(16) NOT NULL UNIQUE,
  name VARCHAR(225) NOT NULL,
  description TEXT,
  status master_status NOT NULL DEFAULT 'ACTIVE',
  created_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  updated_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(trim(code)) > 0),
  CHECK (length(trim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS categories (
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_code_upper ON categories (upper(code));
CREATE INDEX IF NOT EXISTS idx_categories_channel_id ON categories(channel_id);

CREATE TABLE IF NOT EXISTS locations (
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_locations_channel_code_upper ON locations (channel_id, upper(code));
CREATE INDEX IF NOT EXISTS idx_locations_channel_id ON locations(channel_id);

CREATE TABLE IF NOT EXISTS advertising_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON UPDATE CASCADE,
  category_id UUID REFERENCES categories(id) ON UPDATE CASCADE,
  name VARCHAR(225) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  image_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
  updated_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (char_length(name) BETWEEN 1 AND 225),
  CHECK (char_length(trim(name)) BETWEEN 1 AND 225),
  CHECK (end_date > start_date),
  CHECK (jsonb_typeof(image_keys) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_advertising_contents_channel_id ON advertising_contents(channel_id);
CREATE INDEX IF NOT EXISTS idx_advertising_contents_category_id ON advertising_contents(category_id);
CREATE INDEX IF NOT EXISTS idx_advertising_contents_date_range ON advertising_contents(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_advertising_contents_active ON advertising_contents(is_active);

CREATE TABLE IF NOT EXISTS physical_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON UPDATE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON UPDATE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON UPDATE CASCADE,
  seq_no INTEGER NOT NULL CHECK (seq_no > 0),
  item_code VARCHAR(128) NOT NULL UNIQUE,
  item_name VARCHAR(255) NOT NULL,
  width NUMERIC(4,2) NOT NULL CHECK (width >= 0 AND width <= 99.99),
  length NUMERIC(4,2) NOT NULL CHECK (length >= 0 AND length <= 99.99),
  image_key TEXT,
  description TEXT,
  status physical_item_status NOT NULL DEFAULT 'ACTIVE',
  created_by UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
  updated_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(trim(item_code)) > 0),
  CHECK (length(trim(item_name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_physical_items_loc_cat_seq ON physical_items(location_id, category_id, seq_no);
CREATE INDEX IF NOT EXISTS idx_physical_items_channel_id ON physical_items(channel_id);
CREATE INDEX IF NOT EXISTS idx_physical_items_category_id ON physical_items(category_id);
CREATE INDEX IF NOT EXISTS idx_physical_items_location_id ON physical_items(location_id);
CREATE INDEX IF NOT EXISTS idx_physical_items_status ON physical_items(status);

CREATE TABLE IF NOT EXISTS advertising_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_no VARCHAR(64) NOT NULL UNIQUE,
  campaign_name VARCHAR(225) NOT NULL,
  campaign_description TEXT,
  budget_estimate NUMERIC(13,2) NOT NULL CHECK (budget_estimate >= 0 AND budget_estimate <= 10000000000.00),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  document_key TEXT,
  representative_name VARCHAR(225),
  representative_phone VARCHAR(10),
  content_id UUID REFERENCES advertising_contents(id) ON UPDATE CASCADE,
  status registration_status NOT NULL DEFAULT 'DRAFT',
  created_by UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
  updated_by UUID REFERENCES users(id) ON UPDATE CASCADE,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (char_length(campaign_name) BETWEEN 1 AND 225),
  CHECK (char_length(trim(campaign_name)) BETWEEN 1 AND 225),
  CHECK (end_date > start_date),
  CHECK (representative_phone IS NULL OR representative_phone ~ '^[0-9]{10}$')
);

CREATE INDEX IF NOT EXISTS idx_advertising_registrations_status ON advertising_registrations(status);
CREATE INDEX IF NOT EXISTS idx_advertising_registrations_dates ON advertising_registrations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_advertising_registrations_content_id ON advertising_registrations(content_id);
CREATE INDEX IF NOT EXISTS idx_advertising_registrations_created_by ON advertising_registrations(created_by);

CREATE TABLE IF NOT EXISTS registration_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES advertising_registrations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  physical_item_id UUID NOT NULL REFERENCES physical_items(id) ON UPDATE CASCADE,
  unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_amount NUMERIC(16,2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (registration_id, physical_item_id)
);

CREATE INDEX IF NOT EXISTS idx_registration_items_registration_id ON registration_items(registration_id);
CREATE INDEX IF NOT EXISTS idx_registration_items_physical_item_id ON registration_items(physical_item_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(64) NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON UPDATE CASCADE,
  action VARCHAR(128) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(trim(entity_type)) > 0),
  CHECK (length(trim(action)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMIT;
