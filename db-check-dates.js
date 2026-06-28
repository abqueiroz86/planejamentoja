const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const client = new Client({ connectionString });

async function run() {
  try {
    await client.connect();
    
    // Check distinct months in database
    const monthsRes = await client.query(`
      SELECT DISTINCT TO_CHAR("data", 'YYYY-MM') as month, COUNT(*) 
      FROM fluxo 
      GROUP BY month
      ORDER BY month DESC
    `);
    console.log('Months in database:');
    console.table(monthsRes.rows);

    // Let's also print 5 sample rows with dates
    const samples = await client.query(`
      SELECT fluxo_id, "data", valor, descricao, entrada_saida
      FROM fluxo
      LIMIT 5
    `);
    console.log('\nSample rows:');
    console.table(samples.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
