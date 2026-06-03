const p = require('pg').Pool;
const pool = new p({ host: '127.0.0.1', port: 5432, database: 'cms_physical_ads', user: 'postgres', password: 'postgres' });

async function run() {
  try {
    // Check columns per table/schema
    const r1 = await pool.query(
      "SELECT table_schema, table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('locations','physical_items','categories') ORDER BY table_schema, table_name, ordinal_position"
    );
    console.log('=== SCHEMA COLUMNS ===');
    r1.rows.forEach(x => console.log(`${x.table_schema}.${x.table_name}.${x.column_name} (${x.data_type})`));
    
    // Try direct query to see what locations returns
    const r2 = await pool.query("SELECT * FROM locations LIMIT 1");
    console.log('\n=== LOCATIONS SAMPLE ===');
    console.log(JSON.stringify(r2.rows[0], null, 2));
    
    // Try physical_items
    const r3 = await pool.query("SELECT * FROM physical_items LIMIT 1");
    console.log('\n=== PHYSICAL_ITEMS SAMPLE ===');
    console.log(JSON.stringify(r3.rows[0], null, 2));
    
    // Try categories
    const r4 = await pool.query("SELECT * FROM categories LIMIT 1");
    console.log('\n=== CATEGORIES SAMPLE ===');
    console.log(JSON.stringify(r4.rows[0], null, 2));
    
  } catch (e) {
    console.error(e.message);
  }
  pool.end();
}
run();
