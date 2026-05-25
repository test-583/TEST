// db.js — This file creates and exports the MySQL connection pool.
// A "pool" means multiple requests can share connections instead of opening a new one every time.

const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,   // max 10 simultaneous connections
  queueLimit: 0
});

// .promise() lets us use async/await instead of old-school callbacks
module.exports = pool.promise();
