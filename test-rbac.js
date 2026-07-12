const http = require('http');

const endpoints = [
  { path: '/api/settings', method: 'GET' },
  { path: '/api/me', method: 'GET' },
  { path: '/api/vehicles', method: 'GET' },
];

async function testEndpoint(options) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: options.path,
      method: options.method,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        console.log(`\n--- ${options.method} ${options.path} [${res.statusCode}] ---`);
        
        // Truncate long responses
        const str = JSON.stringify(parsed, null, 2);
        if (str.length > 500) {
           console.log(str.substring(0, 500) + '... (truncated)');
        } else {
           console.log(str);
        }
        resolve();
      });
    });

    req.on('error', err => {
      console.error(`\n--- ${options.method} ${options.path} FAILED ---`, err.message);
      resolve();
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function run() {
  console.log("Running RBAC verification tests...");
  // Note: These will return 401 because we are not authenticated.
  // This verifies that the RBAC and auth middlewares are active on these endpoints.
  for (const ep of endpoints) {
    await testEndpoint(ep);
  }
}

run();
