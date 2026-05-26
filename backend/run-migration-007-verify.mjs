import { Pool } from "pg";
import fs from "fs";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "cms_physical_ads",
  user: "postgres",
  password: "postgres"
});

async function runMigration() {
  try {
    const sql = fs.readFileSync("./migrations/007_add_brand_intake_fields_up.sql", "utf8");
    await pool.query(sql);
    console.log("? Migration 007 applied successfully!");
    
    // Verify new columns exist
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'ad_registrations'
      AND column_name IN ('assigned_to_brand_user_id', 'procurement_category_proposal', 'other_category_proposal', 'other_proposal', 'prices_locked', 'prices_locked_at')
      ORDER BY column_name;
    `);
    
    console.log("New columns verified:");
    result.rows.forEach(row => console.log(`  ? ${row.column_name}: ${row.data_type}`));
    
    process.exit(0);
  } catch (error) {
    console.error("? Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
