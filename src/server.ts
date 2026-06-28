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
const angularApp = new AngularNodeAppEngine({
  trustProxyHeaders: true,
});

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
  const mesAno = req.query['mes_ano'] as string | undefined;
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
  } else if (mesAno && /^\d{4}-\d{2}$/.test(mesAno)) {
    const [year, month] = mesAno.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    filters += ` AND "data" >= $${counter} AND "data" <= $${counter + 1}`;
    values.push(startDate, endDate);
    counter += 2;
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

app.post('/api/fluxo', async (req: SessionRequest, res) => {
  const usuarioId = req.session?.usuarioId;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Sessão não autenticada.' });
  }

  const { entrada_saida, data, valor, descricao } = req.body as {
    entrada_saida?: number;
    data?: string;
    valor?: number;
    descricao?: string;
  };

  if (entrada_saida === undefined || !data || valor === undefined || !descricao) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios (tipo, data, valor, descrição).' });
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    const query = `
      INSERT INTO fluxo (usuario_id, entrada_saida, "data", valor, descricao)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING fluxo_id
    `;

    const result = await client.query(query, [usuarioId, Number(entrada_saida), data, Number(valor), descricao]);
    return res.json({ ok: true, fluxoId: result.rows[0].fluxo_id });
  } catch (error) {
    console.error('Erro ao criar fluxo:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar o lançamento.' });
  } finally {
    await client.end();
  }
});

app.put('/api/fluxo/:id', async (req: SessionRequest, res) => {
  const usuarioId = req.session?.usuarioId;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Sessão não autenticada.' });
  }

  const fluxoId = Number(req.params['id']);
  const { entrada_saida, data, valor, descricao } = req.body as {
    entrada_saida?: number;
    data?: string;
    valor?: number;
    descricao?: string;
  };

  if (Number.isNaN(fluxoId)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  if (entrada_saida === undefined || !data || valor === undefined || !descricao) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios (tipo, data, valor, descrição).' });
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    const query = `
      UPDATE fluxo
      SET entrada_saida = $1, "data" = $2, valor = $3, descricao = $4
      WHERE fluxo_id = $5 AND usuario_id = $6
    `;

    const result = await client.query(query, [Number(entrada_saida), data, Number(valor), descricao, fluxoId, usuarioId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Lançamento não encontrado ou não pertence a este usuário.' });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao atualizar fluxo:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar o lançamento.' });
  } finally {
    await client.end();
  }
});

app.delete('/api/fluxo/:id', async (req: SessionRequest, res) => {
  const usuarioId = req.session?.usuarioId;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Sessão não autenticada.' });
  }

  const fluxoId = Number(req.params['id']);

  if (Number.isNaN(fluxoId)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    const query = `
      DELETE FROM fluxo
      WHERE fluxo_id = $1 AND usuario_id = $2
    `;

    const result = await client.query(query, [fluxoId, usuarioId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Lançamento não encontrado ou não pertence a este usuário.' });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao excluir fluxo:', error);
    return res.status(500).json({ error: 'Erro interno ao excluir o lançamento.' });
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
