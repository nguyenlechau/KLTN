import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'cms_physical_ads',
  user: 'postgres',
  password: 'postgres',
});

async function checkDatabase() {
  try {
    // List all tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📊 Tables in database:');
    if (tables.rows.length === 0) {
      console.log('❌ No tables found!');
    } else {
      tables.rows.forEach(row => {
        console.log(`  ✓ ${row.table_name}`);
      });
    }
    
    // Check roles table specifically
    const rolesCheck = await pool.query(`
      SELECT * FROM roles LIMIT 5
    `).catch(() => null);
    
    if (rolesCheck) {
      console.log(`\n✓ Roles table exists with ${rolesCheck.rows.length} rows`);
    } else {
      console.log('\n❌ Roles table does not exist');
    }
    
    // Check users table specifically
    const usersCheck = await pool.query(`
      SELECT * FROM users LIMIT 5
    `).catch(() => null);
    
    if (usersCheck) {
      console.log(`✓ Users table exists with ${usersCheck.rows.length} rows`);
    } else {
      console.log('❌ Users table does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
