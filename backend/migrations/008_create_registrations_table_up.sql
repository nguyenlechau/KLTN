-- Create registrations table (mapped from ad_registrations structure)
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  key_visual_url VARCHAR(512),
  budget NUMERIC(15, 2),
  start_date DATE,
  end_date DATE,
  department VARCHAR(100),
  status VARCHAR(50) DEFAULT 'DRAFT',
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT fk_registrations_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_by ON registrations(created_by);
CREATE INDEX IF NOT EXISTS idx_registrations_dates ON registrations(start_date, end_date);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON registrations TO postgres;
