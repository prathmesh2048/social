const { Pool } = require('pg');
let pool = '';
try {
  pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'social_media',
    password: 'post123',
    port: '5432',
  });
} catch (err) {
  console.log(err);
  process.exit(1);
}


module.exports = pool;
