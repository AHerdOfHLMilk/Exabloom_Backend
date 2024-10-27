// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: '',          // Your PostgreSQL username
  host: '',         // Your PostgreSQL server host
  database: '', // Your database name
  password: '', // Your PostgreSQL password
  port: 5432,                // Default PostgreSQL port
});

module.exports = pool;