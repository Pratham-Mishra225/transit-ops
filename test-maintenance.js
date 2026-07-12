const http = require('http');

const data = JSON.stringify({
  serviceType: "Oil Change",
  description: "Test",
  cost: 150,
  startedAt: new Date().toISOString(),
  status: "ACTIVE",
  vehicleId: "nonexistent" // Since there are no vehicles in the DB currently
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/maintenance',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`POST status: ${res.statusCode}`);
    console.log(`POST body: ${body}`);
  });
});

req.on('error', err => {
  console.log('POST Error:', err.message);
});

req.write(data);
req.end();
