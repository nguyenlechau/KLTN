-- Migration: 010_reconcile_schema_up.sql
-- Purpose: Make schema changes idempotent and add commonly-missing columns safely
BEGIN;

-- Add creator_id and updated_by to registrations if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='advertising_registrations' AND column_name='creator_id') THEN
    ALTER TABLE advertising_registrations ADD COLUMN creator_id UUID REFERENCES users(id) ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='advertising_registrations' AND column_name='updated_by') THEN
    ALTER TABLE advertising_registrations ADD COLUMN updated_by UUID REFERENCES users(id) ON UPDATE CASCADE;
  END IF;
END$$;

-- Ensure audit_logs table exists
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(64) NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON UPDATE CASCADE,
  action VARCHAR(128) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add any missing columns used by the app to physical_items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='physical_items' AND column_name='category_id') THEN
    ALTER TABLE physical_items ADD COLUMN category_id UUID REFERENCES categories(id) ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='physical_items' AND column_name='location_id') THEN
    ALTER TABLE physical_items ADD COLUMN location_id UUID REFERENCES locations(id) ON UPDATE CASCADE;
  END IF;
END$$;

COMMIT;
