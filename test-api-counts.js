const http = require('http');

async function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null
        });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  try {
    const loginRes = await request('http://localhost:4200/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'abqueiroz86@gmail.com', senha: '123456' });

    const cookie = loginRes.headers['set-cookie'];
    if (cookie) {
      // 1. Fetch June 2026
      const junRes = await request('http://localhost:4200/api/fluxo?mes_ano=2026-06', {
        method: 'GET',
        headers: { 'Cookie': cookie.join('; ') }
      });
      console.log('June API count:', junRes.body?.fluxo?.length);
      console.log('June API sample:', junRes.body?.fluxo?.slice(0, 2));

      // 2. Fetch May 2026
      const mayRes = await request('http://localhost:4200/api/fluxo?mes_ano=2026-05', {
        method: 'GET',
        headers: { 'Cookie': cookie.join('; ') }
      });
      console.log('May API count:', mayRes.body?.fluxo?.length);
      console.log('May API sample:', mayRes.body?.fluxo?.slice(0, 2));

      // 3. Fetch No Filter
      const allRes = await request('http://localhost:4200/api/fluxo', {
        method: 'GET',
        headers: { 'Cookie': cookie.join('; ') }
      });
      console.log('All API count:', allRes.body?.fluxo?.length);
    }
  } catch (err) {
    console.error(err);
  }
}

run();
