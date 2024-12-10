/** Database setup for BizTime. */
const { Client } = require('pg');
require('dotenv').config({ path: '../.env' }); // Load environment variables from .env file

let DB_URI;

if (process.env.NODE_ENV === "test") {
  DB_URI = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME_TEST}`;
} else {
  DB_URI = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
}

let db = new Client({
  connectionString: DB_URI,
});

db.connect();

module.exports = db;