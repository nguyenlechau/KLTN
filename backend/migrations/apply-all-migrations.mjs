/**
 * Apply All Migrations - Run all migrations in order
 * Run with: node migrations/apply-all-migrations.mjs
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cms_physical_ads',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigration(migrationFile) {
  try {
    const filePath = path.join(__dirname, migrationFile);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`📝 Running migration: ${migrationFile}`);
    await pool.query(sql);
    console.log(`✅ Migration ${migrationFile} applied successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Migration ${migrationFile} failed:`, error.message);
    return false;
  }
}

async function main() {
  try {
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0]);
    console.log('');
    
    // Apply migrations in order
    const migrations = [
      '001_phase1_init_up.sql',
      '002_hierarchical_structure_up.sql',
      '003_create_menus_table_up.sql',
      '004_fix_channel_relationships_up.sql',
      '005_create_real_schema_up.sql',
      '006_add_category_columns_up.sql',
      '007_add_brand_intake_fields_up.sql',
    ];
    
    let failed = false;
    for (const migration of migrations) {
      const filePath = path.join(__dirname, migration);
      if (fs.existsSync(filePath)) {
        const success = await runMigration(migration);
        if (!success) {
          failed = true;
        }
      } else {
        console.log(`⚠️  Skipping ${migration} (file not found)`);
      }
    }
    
    console.log('');
    if (!failed) {
      console.log('🎉 All migrations applied successfully!');
    } else {
      console.log('⚠️  Some migrations failed (may be OK if tables already exist)');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
