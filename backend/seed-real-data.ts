import { Pool } from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface LocationRow {
  code: string;
  classification: string;
  name: string;
  province: string;
  subDistrict: string;
  address: string;
  kênhCN: number;
  kênhAF: number;
  kênhSME: number;
  kênhOOH: number;
  kênhHO: number;
  kênhHeSinhThai: number;
  latitude?: number;
  longitude?: number;
  csmName?: string;
  csmEmail?: string;
  csmPhone?: string;
}

interface ItemRow {
  code: string;
  name: string;
  width?: number;
  length?: number;
  locationDescription?: string;
  categoryCode: string;
  locationCode: string;
}

interface CategoryRow {
  code: string;
  name: string;
  unitPrice?: number;
  unitName: string;
  displayFormat: string;
}

function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

const CHANNEL_CODES = ['CN', 'AF', 'SME', 'OOH', 'HO', 'Hệ sinh thái'];

class DataImporter {
  private pool: Pool;
  private adminId: string = '';
  private channelMap: Map<string, string> = new Map(); // code -> uuid
  private locationMap: Map<string, string> = new Map(); // code -> uuid
  private categoryMap: Map<string, string> = new Map(); // code -> uuid

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async run() {
    try {
      console.log('🚀 Starting data import...\n');
      
      // Get admin user
      const adminRes = await this.pool.query(`
        SELECT id FROM users 
        WHERE role = 'ADMIN' 
        ORDER BY created_at ASC 
        LIMIT 1
      `);
      
      if (adminRes.rows.length === 0) {
        console.error('❌ No ADMIN user found. Create one first.');
        return;
      }
      
      this.adminId = adminRes.rows[0].id;
      console.log(`✓ Found admin user: ${this.adminId}\n`);

      // Step 1: Ensure channels exist
      await this.ensureChannels();
      
      // Step 2: Import categories
      await this.importCategories();
      
      // Step 3: Import locations with channel mappings
      await this.importLocations();
      
      // Step 4: Import physical items
      await this.importPhysicalItems();

      console.log('\n✅ Data import completed successfully!');
    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    }
  }

  private async ensureChannels() {
    console.log('📍 Step 1: Ensuring channels exist...');
    
    const channelNames = {
      'CN': 'Kênh CN',
      'AF': 'Kênh AF',
      'SME': 'Kênh SME',
      'OOH': 'Kênh OOH',
      'HO': 'Kênh HO',
      'Hệ sinh thái': 'Kênh Hệ sinh thái'
    };

    for (const [code, name] of Object.entries(channelNames)) {
      const res = await this.pool.query(
        'SELECT id FROM channels WHERE code = $1',
        [code]
      );

      if (res.rows.length > 0) {
        this.channelMap.set(code, res.rows[0].id);
        console.log(`  ✓ Channel ${code} exists`);
      } else {
        const channelId = generateId();
        await this.pool.query(
          `INSERT INTO channels (id, code, name, description, status, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [channelId, code, name, `${name} channel`, 'ACTIVE', this.adminId, this.adminId]
        );
        this.channelMap.set(code, channelId);
        console.log(`  ✓ Created channel ${code}`);
      }
    }
    console.log('');
  }

  private async importCategories() {
    console.log('📂 Step 2: Importing 17 categories...');
    
    const categories: CategoryRow[] = [
      { code: 'LB', name: 'Light box', unitPrice: 350000, unitName: 'm2', displayFormat: 'Offline' },
      { code: 'DL', name: 'Decal lưới', unitPrice: 350000, unitName: 'm2', displayFormat: 'Offline' },
      { code: 'HL', name: 'Hilex', unitPrice: 250000, unitName: 'm2', displayFormat: 'Offline' },
      { code: 'DC', name: 'Decal', unitPrice: 200000, unitName: 'm2', displayFormat: 'Offline' },
      { code: 'BN', name: 'Banner khung sắt', unitPrice: 160000, unitName: 'm2', displayFormat: 'Offline' },
      { code: 'ST', name: 'Standee thường', unitPrice: 220000, unitName: 'cái', displayFormat: 'Offline' },
      { code: 'SS', name: 'Standee khung sắt', unitPrice: 300000, unitName: 'cái', displayFormat: 'Offline' },
      { code: 'PF', name: 'Poster frame', unitPrice: 500000, unitName: 'cái', displayFormat: 'Offline' },
      { code: 'OL', name: 'Ốp lưng', unitPrice: 50000, unitName: 'cái', displayFormat: 'Offline' },
      { code: 'MH', name: 'Màn hình LCD', unitPrice: null, unitName: 'cái', displayFormat: 'Online' },
      { code: 'MA', name: 'Màn hình ATM', unitPrice: null, unitName: 'cái', displayFormat: 'Online' },
      { code: 'HG', name: 'Hanger', unitPrice: null, unitName: 'cái', displayFormat: 'Offline' },
      { code: 'DM', name: 'Decal thang máy', unitPrice: null, unitName: 'cái', displayFormat: 'Offline' },
      { code: 'MQ', name: 'Màn hình QC', unitPrice: null, unitName: 'slot', displayFormat: 'Online' },
      { code: 'BO', name: 'Billboard OOH', unitPrice: 30000000, unitName: 'slot', displayFormat: 'Offline' },
      { code: 'MO', name: 'Màn hình OOH', unitPrice: null, unitName: 'slot', displayFormat: 'Online' },
      { code: 'BP', name: 'Backdrop Prime', unitPrice: 350000, unitName: 'm2', displayFormat: 'Offline' }
    ];

    let created = 0;
    for (const cat of categories) {
      const res = await this.pool.query(
        'SELECT id FROM ad_categories WHERE code = $1',
        [cat.code]
      );

      if (res.rows.length === 0) {
        const categoryId = generateId();
        await this.pool.query(
          `INSERT INTO ad_categories 
           (id, code, name, unit_price, unit_name, display_format, status, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [categoryId, cat.code, cat.name, cat.unitPrice, cat.unitName, cat.displayFormat, 
           'ACTIVE', this.adminId, this.adminId]
        );
        this.categoryMap.set(cat.code, categoryId);
        created++;
      } else {
        this.categoryMap.set(cat.code, res.rows[0].id);
      }
    }
    console.log(`  ✓ Imported/verified ${categories.length} categories (${created} new)\n`);
  }

  private async importLocations() {
    console.log('📍 Step 3: Importing locations with channel mappings...');
    
    // Load locations from seed file
    let locations: any[] = [];
    try {
      const seedPath = path.join(__dirname, 'seed-locations.json');
      if (fs.existsSync(seedPath)) {
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
        locations = seedData.locations || [];
      }
    } catch (err) {
      console.warn('  ⚠ Could not load seed-locations.json, using empty list');
    }

    if (locations.length === 0) {
      console.log('  ℹ No locations to import. Add seed-locations.json or update this function.');
      return;
    }

    let created = 0;
    for (const loc of locations) {
      const res = await this.pool.query(
        'SELECT id FROM addresses WHERE code = $1',
        [loc.code]
      );

      if (res.rows.length === 0) {
        const locationId = generateId();
        
        // Insert address
        await this.pool.query(
          `INSERT INTO addresses 
           (id, code, classification, name, province, sub_district, address_line, 
            status, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [locationId, loc.code, loc.classification, loc.name, loc.province, loc.subDistrict,
           loc.address, 'ACTIVE', this.adminId, this.adminId]
        );

        // Insert location_channels mappings based on channels array
        if (Array.isArray(loc.channels)) {
          for (const channelCode of loc.channels) {
            const channelId = this.channelMap.get(channelCode);
            if (channelId) {
              await this.pool.query(
                `INSERT INTO location_channels 
                 (id, location_id, channel_id, status, created_by, updated_by)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [generateId(), locationId, channelId, 'ACTIVE', this.adminId, this.adminId]
              );
            }
          }
        }

        this.locationMap.set(loc.code, locationId);
        created++;
      } else {
        this.locationMap.set(loc.code, res.rows[0].id);
      }
    }
    console.log(`  ✓ Imported/verified ${locations.length} locations (${created} new)\n`);
  }

  private async importPhysicalItems() {
    console.log('🎁 Step 4: Importing physical items...');
    
    // Load items from seed file
    let items: ItemRow[] = [];
    try {
      const seedPath = path.join(__dirname, 'seed-items.json');
      if (fs.existsSync(seedPath)) {
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
        items = seedData.items || [];
      }
    } catch (err) {
      console.warn('  ⚠ Could not load seed-items.json, using empty list');
    }

    if (items.length === 0) {
      console.log('  ℹ No items to import. Add seed-items.json or update this function.');
      return;
    }

    let created = 0;
    for (const item of items) {
      const res = await this.pool.query(
        'SELECT id FROM ad_physical_items WHERE item_code = $1',
        [item.code]
      );

      if (res.rows.length === 0) {
        const locationId = this.locationMap.get(item.locationCode);
        const categoryId = this.categoryMap.get(item.categoryCode);

        if (!locationId || !categoryId) {
          console.warn(`  ⚠ Skipping ${item.code}: location or category not found`);
          continue;
        }

        await this.pool.query(
          `INSERT INTO ad_physical_items 
           (id, location_id, category_id, item_code, item_name, width, length, 
            location_description, status, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [generateId(), locationId, categoryId, item.code, item.name,
           item.width || null, item.length || null, item.locationDescription || null,
           'ACTIVE', this.adminId, this.adminId]
        );
        created++;
      }
    }
    console.log(`  ✓ Imported/verified ${items.length} items (${created} new)\n`);
  }
}

// Main execution
async function main() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'kltn_db',
  });

  try {
    const importer = new DataImporter(pool);
    await importer.run();
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
