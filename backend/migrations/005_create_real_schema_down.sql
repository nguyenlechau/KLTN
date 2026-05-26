-- Migration: 005_create_real_schema_down.sql
-- Description: Rollback all tables
-- Date: 2026-05-24

DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS deployment_acceptance CASCADE;
DROP TABLE IF EXISTS registration_approvals CASCADE;
DROP TABLE IF EXISTS registration_items CASCADE;
DROP TABLE IF EXISTS registration_content CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS content_images CASCADE;
DROP TABLE IF EXISTS advertising_content CASCADE;
DROP TABLE IF EXISTS physical_items CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
