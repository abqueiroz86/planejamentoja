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
    console.log('Logging in...');
    // Attempt login on port 4200 (Angular dev port)
    const loginRes = await request('http://localhost:4200/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'abqueiroz86@gmail.com', senha: '123456' }); // Check credentials if we know them, or find another way

    console.log('Login Response:', loginRes.statusCode, loginRes.body);
    
    const cookie = loginRes.headers['set-cookie'];
    console.log('Session cookie:', cookie);

    if (cookie) {
      console.log('\nFetching fluxo for June 2026...');
      const fluxoRes = await request('http://localhost:4200/api/fluxo?mes_ano=2026-06', {
        method: 'GET',
        headers: { 'Cookie': cookie.join('; ') }
      });
      console.log('Fluxo Response Status:', fluxoRes.statusCode);
      if (fluxoRes.body && fluxoRes.body.fluxo) {
        console.log('Total items returned:', fluxoRes.body.fluxo.length);
        const uniqueMonths = [...new Set(fluxoRes.body.fluxo.map(f => f.data.slice(0, 7)))];
        console.log('Months in returned data:', uniqueMonths);
      } else {
        console.log('Response body:', fluxoRes.body);
      }
    }
  } catch (err) {
    console.error('Error connecting to localhost:4200. Is the server running there? Trying port 4000 next...');
    try {
      const loginRes = await request('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { email: 'abqueiroz86@gmail.com', senha: '123456' });

      console.log('Login Response (4000):', loginRes.statusCode, loginRes.body);
      const cookie = loginRes.headers['set-cookie'];
      if (cookie) {
        const fluxoRes = await request('http://localhost:4000/api/fluxo?mes_ano=2026-06', {
          method: 'GET',
          headers: { 'Cookie': cookie.join('; ') }
        });
        console.log('Fluxo Response Status:', fluxoRes.statusCode);
        if (fluxoRes.body && fluxoRes.body.fluxo) {
          console.log('Total items returned:', fluxoRes.body.fluxo.length);
          const uniqueMonths = [...new Set(fluxoRes.body.fluxo.map(f => f.data.slice(0, 7)))];
          console.log('Months in returned data:', uniqueMonths);
        } else {
          console.log('Response body:', fluxoRes.body);
        }
      }
    } catch (err4000) {
      console.error('Error on port 4000:', err4000.message);
    }
  }
}

run();
