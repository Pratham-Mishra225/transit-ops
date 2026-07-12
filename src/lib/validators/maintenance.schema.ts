import { z } from "zod";
import { MaintenanceStatus } from "@prisma/client";

export const createMaintenanceSchema = z.object({
  serviceType: z.string().min(1, { message: "Service Type is required" }),
  description: z.string().optional(),
  cost: z.coerce.number().min(0, { message: "Cost cannot be negative" }),
  startedAt: z.coerce.date({
    error: "Start Date must be a valid date",
  }),
  completedAt: z.coerce.date().optional().or(z.literal("").transform(() => undefined)),
  status: z.nativeEnum(MaintenanceStatus).default(MaintenanceStatus.ACTIVE),
  vehicleId: z.string().min(1, { message: "Vehicle selection is required" }),
});

export const updateMaintenanceSchema = createMaintenanceSchema.partial();

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
