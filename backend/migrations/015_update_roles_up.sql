-- Migration 015: Replace old role codes with Jira-aligned role names
-- Old: REQUESTER, CENTRAL_REQUESTER, SUPERVISOR, CENTRAL_SUPERVISOR, OPERATIONS_SPECIALIST, OPERATIONS_MANAGER
-- New: INPUTTER, INPUTTER_HO, APPROVER, APPROVER_HO, BRAND, BRAND_MANAGER

BEGIN;

-- Insert new roles (idempotent)
INSERT INTO roles (code, name, description, is_active)
VALUES
  ('INPUTTER',      'Branch Inputter',  'Branch-level staff who creates and submits campaign registrations', TRUE),
  ('INPUTTER_HO',   'HO Inputter',      'Head-office staff who creates and submits campaign registrations', TRUE),
  ('APPROVER',      'Branch Approver',  'Branch management who approves drafts from branch inputters', TRUE),
  ('APPROVER_HO',   'HO Approver',      'HO management who approves drafts from HO inputters', TRUE),
  ('BRAND',         'Brand Team',       'Brand team: manages master data and handles brand intake step', TRUE),
  ('BRAND_MANAGER', 'Brand Manager',    'Brand manager: view-only for master data, final registration approval', TRUE)
ON CONFLICT (code) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active   = TRUE,
  updated_at  = NOW();

COMMIT;
