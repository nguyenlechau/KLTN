-- Migration: Rollback hierarchical address-channel-category structure
BEGIN;

-- Drop new tables in reverse order
DROP TABLE IF EXISTS ad_registration_items CASCADE;
DROP TABLE IF EXISTS ad_registrations CASCADE;
DROP TABLE IF EXISTS ad_physical_items CASCADE;
DROP TABLE IF EXISTS ad_categories CASCADE;
DROP TABLE IF EXISTS location_channels CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;

COMMIT;
