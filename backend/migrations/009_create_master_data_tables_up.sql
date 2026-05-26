-- Create master data tables for the CMS system

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT fk_channels_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_channels_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  channel_id UUID,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  format VARCHAR(100),
  unit_of_measure VARCHAR(50),
  unit_price NUMERIC(12, 2),
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT fk_categories_channel FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
  CONSTRAINT fk_categories_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_categories_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  coordinates JSONB,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT fk_locations_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  CONSTRAINT fk_locations_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_locations_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Physical Items table
CREATE TABLE IF NOT EXISTS physical_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location_id UUID,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  dimensions VARCHAR(100),
  specifications JSONB,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT fk_physical_items_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  CONSTRAINT fk_physical_items_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_physical_items_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Advertising Content table
CREATE TABLE IF NOT EXISTS advertising_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content_type VARCHAR(100),
  url VARCHAR(512),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  metadata JSONB,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT fk_ad_content_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_ad_content_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_channels_status ON channels(status);
CREATE INDEX IF NOT EXISTS idx_categories_channel_id ON categories(channel_id);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_locations_category_id ON locations(category_id);
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);
CREATE INDEX IF NOT EXISTS idx_physical_items_location_id ON physical_items(location_id);
CREATE INDEX IF NOT EXISTS idx_physical_items_status ON physical_items(status);
CREATE INDEX IF NOT EXISTS idx_advertising_content_status ON advertising_content(status);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON channels TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON locations TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON physical_items TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON advertising_content TO postgres;
