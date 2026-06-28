const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const client = new Client({ connectionString });

async function run() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT "data", COUNT(*), array_agg(DISTINCT descricao) as descriptions
      FROM fluxo
      WHERE "data" >= '2026-06-01' AND "data" <= '2026-06-30'
      GROUP BY "data"
      ORDER BY "data" DESC
    `);
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
