-- Migration 007: Add Brand Intake fields and approval chain
-- Description: Add fields needed for Brand Intake phase and manager-based approval routing
-- Date: 2026-05-26

BEGIN;

-- ============================================================
-- ADD MANAGER_ID TO USERS (for approval chain routing)
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id UUID;

-- ============================================================
-- ADD BRAND INTAKE FIELDS TO AD_REGISTRATIONS
-- ============================================================
ALTER TABLE ad_registrations ADD COLUMN IF NOT EXISTS assigned_to_brand_user_id UUID REFERENCES users(id);
ALTER TABLE ad_registrations ADD COLUMN IF NOT EXISTS procurement_category_proposal TEXT;
ALTER TABLE ad_registrations ADD COLUMN IF NOT EXISTS other_category_proposal TEXT;
ALTER TABLE ad_registrations ADD COLUMN IF NOT EXISTS other_proposal TEXT;
ALTER TABLE ad_registrations ADD COLUMN IF NOT EXISTS prices_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE ad_registrations ADD COLUMN IF NOT EXISTS prices_locked_at TIMESTAMP;

COMMIT;

-- ============================================================
-- ADD INDEXES FOR PERFORMANCE (separate transaction)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ad_registrations_status ON ad_registrations(status);
CREATE INDEX IF NOT EXISTS idx_ad_registrations_created_by ON ad_registrations(created_by);
CREATE INDEX IF NOT EXISTS idx_ad_registrations_assigned_brand ON ad_registrations(assigned_to_brand_user_id);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
