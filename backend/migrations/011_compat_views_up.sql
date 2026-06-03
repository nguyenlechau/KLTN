-- Migration: 011_compat_views_up.sql
-- Purpose: Create compatibility views for legacy table names used by older code
BEGIN;

-- advertising_content -> advertising_contents
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'advertising_content') THEN
    EXECUTE 'CREATE VIEW advertising_content AS SELECT * FROM advertising_contents';
  END IF;
END$$;

COMMIT;
