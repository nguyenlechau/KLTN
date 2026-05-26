import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const migrationFile = resolve('./backend/migrations/004_fix_channel_relationships_mysql_up.sql');

async function applyMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'cms_physical_ads',
    multipleStatements: true,
  });

  try {
    console.log('Reading migration file:', migrationFile);
    const sql = readFileSync(migrationFile, 'utf-8');

    console.log('Applying migration...');
    const results = await connection.query(sql);

    console.log('✅ Migration applied successfully!');
    console.log('Results:', results.length, 'statements executed');

    // Verify
    console.log('\nVerifying migration results:');
    
    const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories');
    console.log('✓ Categories:', categories[0].count);

    const [locations] = await connection.query('SELECT COUNT(*) as count FROM locations');
    console.log('✓ Locations:', locations[0].count);

    const [channels] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='channels' AND COLUMN_NAME IN ('category_id', 'location_id')"
    );
    console.log('✓ Channels columns:', channels.map(c => c.COLUMN_NAME).join(', '));

    console.log('\n✅ All checks passed!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

applyMigration();
