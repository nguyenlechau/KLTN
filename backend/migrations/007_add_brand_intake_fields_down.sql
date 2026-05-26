-- Migration 007 DOWN: Rollback Brand Intake fields
-- Reverse the changes from 007_add_brand_intake_fields_up.sql

BEGIN;

-- Drop indexes
DROP INDEX IF EXISTS idx_ad_registrations_status;
DROP INDEX IF EXISTS idx_users_manager_id;
DROP INDEX IF EXISTS idx_ad_physical_items_status;
DROP INDEX IF EXISTS idx_advertising_contents_status;

-- Remove columns from ad_registrations
ALTER TABLE ad_registrations 
  DROP COLUMN IF EXISTS assigned_to_brand_user_id,
  DROP COLUMN IF EXISTS procurement_category_proposal,
  DROP COLUMN IF EXISTS other_category_proposal,
  DROP COLUMN IF EXISTS other_proposal,
  DROP COLUMN IF EXISTS prices_locked,
  DROP COLUMN IF EXISTS prices_locked_at;

-- Remove columns from users
ALTER TABLE users 
  DROP COLUMN IF EXISTS manager_id,
  DROP COLUMN IF EXISTS department_id;

COMMIT;
