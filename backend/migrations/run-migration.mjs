/**
 * Migration Runner - Apply pending migrations to the database
 * Run with: node migrations/run-migration.mjs
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
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
    
    // Apply migration 006
    await runMigration('006_add_category_columns_up.sql');
    
    // Verify columns were added
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Categories table columns:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n✅ All migrations applied successfully');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
