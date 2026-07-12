import { z } from "zod";

export const dashboardFiltersSchema = z.object({
  vehicleType: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  driverId: z.string().optional(),
  vehicleId: z.string().optional(),
});

export const settingsSchema = z.object({
  depotName: z.string().min(1, { message: "Depot Name is required" }),
  currency: z.string().min(1, { message: "Currency is required" }),
  distanceUnit: z.string().min(1, { message: "Distance Unit is required" }),
});
