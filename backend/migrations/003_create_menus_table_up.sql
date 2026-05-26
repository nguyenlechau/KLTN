-- Create menus table for hierarchical menu management
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  label VARCHAR(100),
  icon VARCHAR(100),
  order_position INTEGER NOT NULL DEFAULT 999,
  parent_id UUID REFERENCES menus(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_menus_code ON menus(code);
CREATE INDEX idx_menus_parent_id ON menus(parent_id);
CREATE INDEX idx_menus_status ON menus(status);
CREATE INDEX idx_menus_order_position ON menus(order_position);

-- Insert default menus
INSERT INTO menus (code, name, label, icon, order_position, status) VALUES
  ('master_data', 'Master Data', 'Master Data', '🔧', 1, 'ACTIVE'),
  ('channels', 'Channels', 'Channels', '📢', 10, 'ACTIVE'),
  ('categories', 'Categories', 'Categories', '🏷️', 20, 'ACTIVE'),
  ('locations', 'Locations', 'Locations', '📍', 30, 'ACTIVE'),
  ('contents', 'Ad Contents', 'Ad Contents', '🖼️', 40, 'ACTIVE'),
  ('operations', 'Operations', 'Operations', '⚙️', 2, 'ACTIVE'),
  ('physical_items', 'Create Items', 'Create Items', '🔨', 50, 'ACTIVE'),
  ('campaigns', 'Campaigns', 'Campaigns', '📊', 60, 'ACTIVE'),
  ('admin', 'Admin', 'Admin', '👑', 3, 'ACTIVE'),
  ('users', 'Users', 'Users', '👥', 70, 'ACTIVE');

-- Create audit log for menu changes (optional)
CREATE TABLE menu_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_audit_log_menu_id ON menu_audit_log(menu_id);
CREATE INDEX idx_menu_audit_log_changed_at ON menu_audit_log(changed_at);
