import { Pool } from "pg";
import fs from "fs";
const pool = new Pool({ host: "localhost", port: 5432, database: "cms_physical_ads", user: "postgres", password: "postgres" });
try {
  const sql = fs.readFileSync("./migrations/007_add_brand_intake_fields_up.sql", "utf8");
  console.log("Executing migration 007...");
  console.log("SQL Preview:");
  console.log(sql.substring(0, 300) + "...");
  console.log("");
  
  await pool.query(sql);
  console.log("? Migration 007 applied successfully!");
} catch (e) {
  console.log("? Error:", e.message);
  console.log("Error code:", e.code);
  console.log("Full error:", e);
} finally {
  await pool.end();
}
