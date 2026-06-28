const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const client = new Client({ connectionString });

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT email, senha FROM usuarios LIMIT 1');
    console.log(res.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
