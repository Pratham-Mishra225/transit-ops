const http = require('http');

async function run() {
  // First GET the existing logs
  http.get('http://localhost:3000/api/maintenance', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const logs = JSON.parse(data);
      if (logs.length === 0) {
        console.log("No logs to edit.");
        return;
      }
      const log = logs[0];
      console.log("Editing log:", log.id);

      const updateData = JSON.stringify({
        status: "COMPLETED",
        completedAt: new Date().toISOString()
      });

      const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/maintenance/${log.id}`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(updateData) }
      };

      const req = http.request(options, (res2) => {
        let body = '';
        res2.on('data', chunk => body += chunk);
        res2.on('end', () => {
          console.log(`PATCH status: ${res2.statusCode}`);
          console.log(`PATCH body: ${body}`);
        });
      });
      req.write(updateData);
      req.end();
    });
  });
}

run();
