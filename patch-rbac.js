const fs = require('fs');
const path = require('path');

const PROTECTIONS = {
  vehicles: { GET: 'vehicle:read', POST: 'vehicle:create', PATCH: 'vehicle:update', DELETE: 'vehicle:delete' },
  drivers: { GET: 'driver:read', POST: 'driver:create', PATCH: 'driver:update', DELETE: 'driver:delete' },
  trips: { GET: 'trip:read', POST: 'trip:create', PATCH: 'trip:update', DELETE: 'trip:delete' },
  maintenance: { GET: 'maintenance:read', POST: 'maintenance:create', PATCH: 'maintenance:update', DELETE: 'maintenance:delete' },
  fuel: { GET: 'fuel:read', POST: 'fuel:create', PATCH: 'fuel:update', DELETE: 'fuel:delete' },
  expenses: { GET: 'expense:read', POST: 'expense:create', PATCH: 'expense:update', DELETE: 'expense:delete' },
  dashboard: { GET: 'analytics:read' }
};

const BASE_DIR = path.join(__dirname, 'src', 'app', 'api');

function patchFile(filePath, resource) {
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filePath} (Not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already patched
  if (content.includes('requirePermission')) {
    console.log(`Skipping ${filePath} (Already patched)`);
    return;
  }

  // Add imports
  let importStr = `import { requirePermission } from "@/lib/auth/authorize";\nimport { NextResponse } from "next/server";\n`;
  
  // Clean up existing NextResponse if it's there
  if (content.includes('import { NextResponse } from "next/server";')) {
    importStr = `import { requirePermission } from "@/lib/auth/authorize";\n`;
  }

  // Find last import
  const importLines = content.split('\n').filter(l => l.startsWith('import '));
  if (importLines.length > 0) {
    const lastImport = importLines[importLines.length - 1];
    content = content.replace(lastImport, `${lastImport}\n${importStr}`);
  } else {
    content = importStr + '\n' + content;
  }

  const methods = ['GET', 'POST', 'PATCH', 'DELETE'];
  
  for (const method of methods) {
    const perm = PROTECTIONS[resource][method];
    if (!perm) continue;

    const authCheck = `
  const authContext = await requirePermission("${perm}");
  if (authContext instanceof NextResponse) return authContext;
`;

    // Regex to match: export async function GET(request: NextRequest, { params }: ...) {
    const regex1 = new RegExp(`export async function ${method}\\s*\\([^)]*\\)\\s*{`, 'g');
    
    content = content.replace(regex1, (match) => {
      return match + authCheck;
    });
  }

  fs.writeFileSync(filePath, content);
  console.log(`Patched ${filePath}`);
}

function run() {
  const resources = ['vehicles', 'drivers', 'trips', 'maintenance', 'fuel', 'expenses'];
  
  for (const res of resources) {
    patchFile(path.join(BASE_DIR, res, 'route.ts'), res);
    patchFile(path.join(BASE_DIR, res, '[id]', 'route.ts'), res);
  }

  const dashboardRoutes = [
    'overview',
    'search',
    'charts/costliest-vehicles',
    'charts/fleet-utilization',
    'charts/fuel-efficiency',
    'charts/monthly-revenue',
    'charts/vehicle-roi'
  ];

  for (const route of dashboardRoutes) {
    patchFile(path.join(BASE_DIR, 'dashboard', route, 'route.ts'), 'dashboard');
  }
}

run();
