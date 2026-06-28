const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const client = new Client({ connectionString });

async function run() {
  try {
    await client.connect();

    const usuarioId = 1; // standard user
    const mesAno = '2026-06';

    const [year, month] = mesAno.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    console.log('Query parameters:', { usuarioId, startDate, endDate });

    const query = `
      SELECT fluxo_id, entrada_saida, "data", valor, descricao
      FROM fluxo
      WHERE usuario_id = $1
        AND "data" >= $2
        AND "data" <= $3
      ORDER BY "data" DESC, fluxo_id DESC
    `;

    const result = await client.query(query, [usuarioId, startDate, endDate]);
    console.log('Row count:', result.rowCount);
    console.log('Sample rows (top 3):');
    console.table(result.rows.slice(0, 3));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
