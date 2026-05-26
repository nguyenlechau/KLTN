import { Pool } from 'pg';
import fs from 'fs';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'cms_physical_ads',
  user: 'postgres',
  password: 'postgres'
});

async function migrate() {
  try {
    const sql = fs.readFileSync('./migrations/007_add_brand_intake_fields_up.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ Migration 007 successful!');
    process.exit(0);
  } catch (e) {
    console.log('❌ Error:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
