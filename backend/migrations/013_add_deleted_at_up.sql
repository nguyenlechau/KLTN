-- Migration: 013_add_deleted_at_up.sql
-- Purpose: Add deleted_at column to physical_items and other tables that use soft deletes
BEGIN;

ALTER TABLE physical_items
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

COMMIT;
