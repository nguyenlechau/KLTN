-- Migration: 001_initial_schema_up.sql
-- Description: Create all core tables for the system
-- Date: 2026-05-24

-- ============================================================
-- USERS & DEPARTMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_department_id UUID REFERENCES departments(id),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  deleted_at TIMESTAMP
);

-- ============================================================
-- MASTER DATA
-- ============================================================

CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(2) UNIQUE NOT NULL,
  name VARCHAR(225) UNIQUE NOT NULL,
  format VARCHAR(20) NOT NULL,
  description TEXT,
  unit_price DECIMAL(12, 2),
  unit_of_measure VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_code VARCHAR(3) NOT NULL,
  channel_id UUID NOT NULL REFERENCES channels(id),
  position_name VARCHAR(255) NOT NULL,
  province_city VARCHAR(100) NOT NULL,
  zone VARCHAR(50) NOT NULL,
  address VARCHAR(255) NOT NULL,
  classification VARCHAR(50),
  longitude DECIMAL(10, 8),
  latitude DECIMAL(11, 8),
  representative_1_name VARCHAR(100),
  representative_1_email VARCHAR(255),
  representative_1_phone VARCHAR(10),
  representative_2_name VARCHAR(100),
  representative_2_email VARCHAR(255),
  representative_2_phone VARCHAR(10),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  note TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(position_code, channel_id)
);

CREATE TABLE IF NOT EXISTS physical_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code VARCHAR(50) UNIQUE NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  channel_id UUID NOT NULL REFERENCES channels(id),
  width_m DECIMAL(5, 2),
  length_m DECIMAL(5, 2),
  description TEXT,
  image_url VARCHAR(500),
  image_key VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- ============================================================
-- ADVERTISING CONTENT
-- ============================================================

CREATE TABLE IF NOT EXISTS advertising_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_code VARCHAR(50) UNIQUE NOT NULL,
  content_name VARCHAR(225) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES advertising_content(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_key VARCHAR(255) NOT NULL,
  sequence INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(content_id, sequence)
);

-- ============================================================
-- REGISTRATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_code VARCHAR(50) UNIQUE NOT NULL,
  program_name VARCHAR(225) NOT NULL,
  budget_estimate DECIMAL(15, 2) NOT NULL,
  total_amount DECIMAL(15, 2),
  io_code VARCHAR(50),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  submission_document_url VARCHAR(500),
  submission_document_key VARCHAR(255),
  unit_id UUID REFERENCES departments(id),
  creator_id UUID NOT NULL REFERENCES users(id),
  current_approver_id UUID REFERENCES users(id),
  workflow_state VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  prices_locked_at TIMESTAMP,
  approved_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registration_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  advertising_content_id UUID NOT NULL REFERENCES advertising_content(id),
  is_new_content BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(registration_id, advertising_content_id)
);

CREATE TABLE IF NOT EXISTS registration_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  physical_item_id UUID NOT NULL REFERENCES physical_items(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2),
  total_amount DECIMAL(15, 2),
  deployment_status VARCHAR(20),
  deployment_image_url VARCHAR(500),
  deployment_image_key VARCHAR(255),
  deployment_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(registration_id, physical_item_id)
);

CREATE TABLE IF NOT EXISTS registration_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  approval_step INT NOT NULL,
  from_state VARCHAR(50) NOT NULL,
  to_state VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_role VARCHAR(50) NOT NULL,
  decision VARCHAR(20),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deployment_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  registration_item_id UUID NOT NULL REFERENCES registration_items(id),
  old_item_status VARCHAR(20),
  new_item_status VARCHAR(20),
  deployment_image_url VARCHAR(500),
  deployment_image_key VARCHAR(255),
  acceptance_note TEXT,
  submitted_by UUID NOT NULL REFERENCES users(id),
  submitted_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_status VARCHAR(20),
  review_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- AUDIT TRAIL
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  entity_code VARCHAR(50),
  action_type VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  ip_address VARCHAR(45)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_registrations_creator_id ON registrations(creator_id);
CREATE INDEX idx_registrations_workflow_state ON registrations(workflow_state);
CREATE INDEX idx_registrations_created_at ON registrations(created_at DESC);
CREATE INDEX idx_physical_items_location_id ON physical_items(location_id);
CREATE INDEX idx_physical_items_category_id ON physical_items(category_id);
CREATE INDEX idx_physical_items_status ON physical_items(status);
CREATE INDEX idx_locations_channel_id ON locations(channel_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_changed_at ON audit_log(changed_at DESC);
CREATE INDEX idx_users_department_id ON users(department_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Departments
INSERT INTO departments (code, name, description, status) VALUES
  ('BRAND', 'Brand Department', 'Marketing and brand management', 'ACTIVE'),
  ('OPS', 'Operations', 'Operations and logistics', 'ACTIVE'),
  ('ADMIN', 'Administration', 'System administration', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- Users (with sample hashed password: 'password')
INSERT INTO users (username, email, full_name, role, department_id, password_hash, status) 
SELECT 
  'admin',
  'admin@example.com',
  'System Admin',
  'ADMIN',
  d.id,
  '$2b$10$YQvzr.fN3f8Y0X6Z9a5e5eY5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z',
  'ACTIVE'
FROM departments d WHERE d.code = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO users (username, email, full_name, role, department_id, password_hash, status) 
SELECT 
  'john',
  'john@example.com',
  'John Doe',
  'INPUTTER',
  d.id,
  '$2b$10$YQvzr.fN3f8Y0X6Z9a5e5eY5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z',
  'ACTIVE'
FROM departments d WHERE d.code = 'BRAND'
ON CONFLICT DO NOTHING;

INSERT INTO users (username, email, full_name, role, department_id, password_hash, status) 
SELECT 
  'jane',
  'jane@example.com',
  'Jane Smith',
  'BRAND',
  d.id,
  '$2b$10$YQvzr.fN3f8Y0X6Z9a5e5eY5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z',
  'ACTIVE'
FROM departments d WHERE d.code = 'BRAND'
ON CONFLICT DO NOTHING;

INSERT INTO users (username, email, full_name, role, department_id, password_hash, status) 
SELECT 
  'manager',
  'manager@example.com',
  'Manager User',
  'BRAND_MANAGER',
  d.id,
  '$2b$10$YQvzr.fN3f8Y0X6Z9a5e5eY5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z',
  'ACTIVE'
FROM departments d WHERE d.code = 'BRAND'
ON CONFLICT DO NOTHING;

-- Channels
INSERT INTO channels (code, name, description, created_by) 
SELECT 
  'IN',
  'Indoor',
  'Indoor advertising channels',
  u.id
FROM users u WHERE u.username = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO channels (code, name, description, created_by) 
SELECT 
  'OUT',
  'Outdoor',
  'Outdoor advertising channels',
  u.id
FROM users u WHERE u.username = 'admin'
ON CONFLICT DO NOTHING;

-- Categories
INSERT INTO categories (code, name, format, unit_of_measure, unit_price, created_by) 
SELECT 
  'LD',
  'LED Screen',
  'OFFLINE',
  'cái',
  5000,
  u.id
FROM users u WHERE u.username = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO categories (code, name, format, unit_of_measure, unit_price, created_by) 
SELECT 
  'LB',
  'Light Box',
  'OFFLINE',
  'm2',
  2000,
  u.id
FROM users u WHERE u.username = 'admin'
ON CONFLICT DO NOTHING;
