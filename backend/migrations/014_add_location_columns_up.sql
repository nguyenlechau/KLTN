-- Migration: 014_add_location_columns_up.sql
-- Purpose: Add missing columns to locations table required by locationService.ts
BEGIN;

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) ON UPDATE CASCADE,
  ADD COLUMN IF NOT EXISTS position_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS position_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS province_city VARCHAR(255),
  ADD COLUMN IF NOT EXISTS zone VARCHAR(100),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS classification VARCHAR(100),
  ADD COLUMN IF NOT EXISTS representative_1_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS representative_1_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS representative_1_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS representative_2_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS representative_2_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS representative_2_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS note TEXT;

-- Backfill position_code from existing code column
UPDATE locations SET position_code = code WHERE position_code IS NULL;

-- Add physical_items.unit_price if missing (migration 012 may not have run)
ALTER TABLE physical_items
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) DEFAULT 0 NOT NULL;

COMMIT;
