import 'dotenv/config';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { Request } from 'express';
import session from 'express-session';
import { Client } from 'pg';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

type SessionRequest = Request & {
  session?: {
    usuarioId?: number;
  };
};

const app = express();
const databaseUrl =
  process.env['DATABASE_URL'] || process.env['PG_CONNECTION_STRING'];

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL ou PG_CONNECTION_STRING não está definida. Defina no .env ou no ambiente.',
  );
}

app.use(express.json());
app.use(
  session({
    secret: process.env['SESSION_SECRET'] || 'planejamentoja-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: 'lax',
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);
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
app.post('/api/login', async (req: SessionRequest, res) => {
  const { email, senha } = req.body as { email?: string; senha?: string };

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    const query = `
      SELECT usuario_id, email
      FROM usuarios
      WHERE email = $1
        AND senha = $2
      LIMIT 1
    `;

    const result = await client.query(query, [email, senha]);

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const user = result.rows[0];
    if (!req.session) {
      return res.status(500).json({ error: 'Falha ao criar sessão.' });
    }

    req.session.usuarioId = user.usuario_id;
    return res.json({ ok: true, email: user.email, usuarioId: user.usuario_id });
  } catch (error) {
    console.error('Erro ao consultar Postgres:', error);
    return res.status(500).json({ error: 'Erro interno ao validar as credenciais.' });
  } finally {
    await client.end();
  }
});

app.get('/api/fluxo', async (req: SessionRequest, res) => {
  const usuarioId = req.session?.usuarioId;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Sessão não autenticada.' });
  }

  const entradaSaida = req.query['entrada_saida'] as string | undefined;
  const data = req.query['data'] as string | undefined;
  const descricao = req.query['descricao'] as string | undefined;

  const values: Array<string | number> = [usuarioId];
  let filters = ' WHERE usuario_id = $1';
  let counter = 2;

  if (entradaSaida === '0' || entradaSaida === '1') {
    filters += ` AND entrada_saida = $${counter}`;
    values.push(Number(entradaSaida));
    counter += 1;
  }

  if (data) {
    filters += ` AND "data" = $${counter}`;
    values.push(data);
    counter += 1;
  }

  if (descricao) {
    filters += ` AND descricao ILIKE $${counter}`;
    values.push(`%${descricao}%`);
    counter += 1;
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    const query = `
      SELECT fluxo_id, entrada_saida, "data", valor, descricao
      FROM fluxo
      ${filters}
      ORDER BY "data" DESC, fluxo_id DESC
    `;

    const result = await client.query(query, values);
    return res.json({ ok: true, fluxo: result.rows });
  } catch (error) {
    console.error('Erro ao consultar fluxo:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar o extrato.' });
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
