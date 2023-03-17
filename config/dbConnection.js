const { Pool } = require('pg');
let pool = '';
try {
  pool = new Pool({
    user: 'prathmesh',
    host: 'dpg-cga9qt02qv25khlhciv0-a.oregon-postgres.render.com',
    database: 'social_media_ieiu',
    password: 'ibF06agXAAUodeipawuK4B88XKocaYGX',
    port: 5432, // Port should be a number, not a string,
  });
} catch (err) {
  console.log(err);
  process.exit(1);
}


module.exports = pool;
// postgres://prathmesh:ibF06agXAAUodeipawuK4B88XKocaYGX@dpg-cga9qt02qv25khlhciv0-a/social_media_ieiu
// PGPASSWORD=ibF06agXAAUodeipawuK4B88XKocaYGX psql -h dpg-cga9qt02qv25khlhciv0-a.oregon-postgres.render.com -U prathmesh social_media_ieiu