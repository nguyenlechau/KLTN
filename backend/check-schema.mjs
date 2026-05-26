import { Pool } from "pg";
const pool = new Pool({ host: "localhost", port: 5432, database: "cms_physical_ads", user: "postgres", password: "postgres" });
try {
  const result = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log("?? Tables in database:");
  result.rows.forEach(r => console.log("  - " + r.table_name));
  
  if (result.rows.some(r => r.table_name === "ad_registrations")) {
    const colsResult = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'ad_registrations' ORDER BY column_name");
    console.log("");
    console.log("?? Columns in ad_registrations:");
    colsResult.rows.forEach(r => console.log("  - " + r.column_name));
  }
} catch (e) {
  console.log("? Error:", e.message);
} finally {
  await pool.end();
}
