const http = require('http');

const endpoints = [
  '/api/dashboard/overview',
  '/api/dashboard/charts/monthly-revenue',
  '/api/dashboard/charts/costliest-vehicles',
  '/api/dashboard/charts/fuel-efficiency',
  '/api/dashboard/charts/fleet-utilization',
  '/api/dashboard/charts/vehicle-roi',
  '/api/dashboard/search?q=test',
  '/api/settings'
];

async function testEndpoint(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        console.log(`\n--- GET ${path} [${res.statusCode}] ---`);
        console.log(JSON.stringify(parsed, null, 2));
        resolve();
      });
    }).on('error', err => {
      console.error(`\n--- GET ${path} FAILED ---`, err.message);
      resolve();
    });
  });
}

async function run() {
  console.log("Running dashboard integration tests...");
  for (const path of endpoints) {
    await testEndpoint(path);
  }
}

run();
