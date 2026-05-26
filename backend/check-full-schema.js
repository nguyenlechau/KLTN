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
    const tables = ["ad_registrations", "ad_registration_items", "ad_physical_items", "users"];
    
    for (const tableName of tables) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`TABLE: ${tableName}`);
      console.log("=".repeat(60));
      
      // Get columns and types
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);
      
      console.log("\nColumns:");
      if (columnsResult.rows.length === 0) {
        console.log("  (Table does not exist)");
      } else {
        columnsResult.rows.forEach(row => {
          const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = row.column_default ? ` DEFAULT ${row.column_default}` : '';
          console.log(`  - ${row.column_name}: ${row.data_type} ${nullable}${defaultVal}`);
        });
      }
      
      // Get foreign key constraints
      const fkResult = await pool.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = $1;
      `, [tableName]);
      
      if (fkResult.rows.length > 0) {
        console.log("\nForeign Keys:");
        fkResult.rows.forEach(row => {
          console.log(`  - ${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
        });
      }
      
      // Get primary key constraints
      const pkResult = await pool.query(`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid
          AND a.attnum = ANY(i.indkey)
        JOIN pg_class t ON t.oid = i.indrelid
        WHERE t.relname = $1 AND i.indisprimary;
      `, [tableName]);
      
      if (pkResult.rows.length > 0) {
        console.log("\nPrimary Key:");
        pkResult.rows.forEach(row => {
          console.log(`  - ${row.attname}`);
        });
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
