/** Database setup for BizTime. */
const { Client } = require('pg');
const dotenv = require('dotenv');

// Dynamically load the correct .env file based on NODE_ENV
if (process.env.NODE_ENV === "test") {
  dotenv.config({ path: '../.env.test' }); // Load test environment variables
} else {
  dotenv.config({ path: '../.env' }); // Default to the main .env file
}
let DB_URI;

if (process.env.NODE_ENV === "test") {
  DB_URI = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME_TEST}`;
} else {
  DB_URI = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
}

console.log("DB_URI:", DB_URI);
console.log("NODE_ENV:", process.env.NODE_ENV);

let db = new Client({
  connectionString: DB_URI,
});

db.connect();

module.exports = db;