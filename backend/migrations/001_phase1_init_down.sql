BEGIN;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS registration_items;
DROP TABLE IF EXISTS advertising_registrations;
DROP TABLE IF EXISTS physical_items;
DROP TABLE IF EXISTS advertising_contents;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS channels;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;

DROP TYPE IF EXISTS registration_status;
DROP TYPE IF EXISTS physical_item_status;
DROP TYPE IF EXISTS master_status;
DROP TYPE IF EXISTS user_status;

COMMIT;
