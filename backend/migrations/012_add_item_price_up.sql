-- Migration: 012_add_item_price_up.sql
-- Purpose: Add unit_price column to physical_items table
BEGIN;

ALTER TABLE physical_items
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2) DEFAULT 0 NOT NULL;

COMMIT;
