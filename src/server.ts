import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { Client } from 'pg';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const databaseUrl =
  process.env['DATABASE_URL'] ||
  process.env['PG_CONNECTION_STRING'] ||
  'postgres://USUARIO:PASSWORD@localhost:5432/planejamentoja';

app.use(express.json());
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * API endpoint para login no banco Postgres.
 * Preencha a string de conexão manualmente via DATABASE_URL ou PG_CONNECTION_STRING.
 */
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body as { email?: string; senha?: string };

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    const query = `
      SELECT email
      FROM usuarios
      WHERE email = $1
        AND senha = $2
      LIMIT 1
    `;

    const result = await client.query(query, [email, senha]);

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    return res.json({ ok: true, email: result.rows[0].email });
  } catch (error) {
    console.error('Erro ao consultar Postgres:', error);
    return res.status(500).json({ error: 'Erro interno ao validar as credenciais.' });
  } finally {
    await client.end();
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
