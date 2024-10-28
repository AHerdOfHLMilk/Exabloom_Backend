// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'hlmilk',          // Your PostgreSQL username
  host: 'localhost',         // Your PostgreSQL server host
  database: 'postgres', // Your database name
  password: 'sde6528g', // Your PostgreSQL password
  port: 5432,                // Default PostgreSQL port
});

module.exports = pool;