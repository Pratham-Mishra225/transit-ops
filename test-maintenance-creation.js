const http = require('http');

async function run() {
  const vehicleData = JSON.stringify({
    fleetCode: "TEST-01",
    registrationNo: "REG-01",
    model: "Test Model",
    type: "BUS",
    maxLoadKg: 1000,
    odometer: 100,
    acquisitionCost: 50000
  });

  const vehicleOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/vehicles',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(vehicleData) }
  };

  const req1 = http.request(vehicleOptions, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Vehicle Created:', body);
      const v = JSON.parse(body);

      const maintData = JSON.stringify({
        serviceType: "Oil Change",
        description: "Test",
        cost: 150,
        startedAt: new Date().toISOString(),
        status: "ACTIVE",
        vehicleId: v.id
      });

      const maintOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/maintenance',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(maintData) }
      };

      const req2 = http.request(maintOptions, (res2) => {
        let body2 = '';
        res2.on('data', chunk => body2 += chunk);
        res2.on('end', () => {
          console.log(`Maintenance Created: ${res2.statusCode} - ${body2}`);
        });
      });
      req2.write(maintData);
      req2.end();
    });
  });

  req1.write(vehicleData);
  req1.end();
}

run();
