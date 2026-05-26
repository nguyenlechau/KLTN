-- Add missing columns to categories table
BEGIN;

-- Add format column if it doesn't exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS format VARCHAR(20) DEFAULT 'Display' NOT NULL;

-- Add unit_of_measure column if it doesn't exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(50) DEFAULT 'Unit' NOT NULL;

-- Add deleted_at column if it doesn't exist (for soft deletes)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

COMMIT;
