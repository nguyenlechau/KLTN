import { Pool } from "pg";
const pool = new Pool({ host: "localhost", port: 5432, database: "cms_physical_ads", user: "postgres", password: "postgres" });
try {
  const colsResult = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'ad_registrations' ORDER BY column_name");
  const existingCols = colsResult.rows.map(r => r.column_name);
  
  const newColsInMigration007 = [
    "assigned_to_brand_user_id",
    "procurement_category_proposal", 
    "other_category_proposal",
    "other_proposal",
    "prices_locked",
    "prices_locked_at"
  ];
  
  const missingCols = newColsInMigration007.filter(c => !existingCols.includes(c));
  
  console.log("? Existing columns in ad_registrations: " + existingCols.join(", "));
  console.log("");
  console.log("?? Columns migration 007 wants to add:");
  newColsInMigration007.forEach(c => {
    const exists = existingCols.includes(c);
    console.log((exists ? "  ? " : "  ? ") + c);
  });
  
  if (missingCols.length === 0) {
    console.log("");
    console.log("? All columns from migration 007 already exist!");
  }
} catch (e) {
  console.log("? Error:", e.message);
} finally {
  await pool.end();
}
