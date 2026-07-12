import { createMaintenanceSchema } from './src/lib/validators/maintenance.schema.ts';

const payload = {
  serviceType: "Oil Change",
  description: "Test",
  cost: "150",
  startedAt: "2026-07-12T15:00",
  completedAt: "",
  status: "ACTIVE",
  vehicleId: "123"
};

const result = createMaintenanceSchema.safeParse(payload);
console.log(JSON.stringify(result, null, 2));
