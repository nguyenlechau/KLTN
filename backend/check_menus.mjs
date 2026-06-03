import pg from 'pg';
const {Pool} = pg;
const p = new Pool({host:'127.0.0.1',port:5432,database:'cms_physical_ads',user:'postgres',password:'postgres'});
p.query("SELECT table_name FROM information_schema.tables WHERE table_name='menus'")
  .then(r=>{console.log('menus table exists:',r.rows.length>0);p.end();})
  .catch(e=>{console.error(e.message);p.end();});
