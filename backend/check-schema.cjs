const p = require('pg');
const pool = new p.Pool({ host: '127.0.0.1', port: 5432, database: 'cms_physical_ads', user: 'postgres', password: 'postgres' });
pool.query(
  "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('locations','physical_items','categories') ORDER BY table_name, ordinal_position"
).then(r => { console.log(JSON.stringify(r.rows, null, 2)); pool.end(); }).catch(e => { console.error(e.message); pool.end(); });
