import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "cms_physical_ads",
  user: "postgres",
  password: "postgres",
});

async function checkSchema() {
  try {
    // Check if registrations table exists
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log("Tables in database:");
    tablesResult.rows.forEach(row => console.log("  -", row.table_name));
    
    // Check registrations columns
    const registrationsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'registrations'
      ORDER BY ordinal_position;
    `);
    
    console.log("\nRegistrations table columns:");
    if (registrationsResult.rows.length === 0) {
      console.log("  (Table does not exist)");
    } else {
      registrationsResult.rows.forEach(row => 
        console.log(`  - ${row.column_name}: ${row.data_type}`)
      );
    }
    
    // Check users columns
    const usersResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log("\nUsers table columns:");
    usersResult.rows.forEach(row => 
      console.log(`  - ${row.column_name}: ${row.data_type}`)
    );
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
