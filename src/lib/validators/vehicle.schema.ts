import { z } from "zod";

// ---------------------------------------------------------------------------
// Enum literals — mirrors prisma/schema.prisma enums without importing Prisma
// ---------------------------------------------------------------------------

export const VEHICLE_TYPES = [
  "VAN",
  "MINI_TRUCK",
  "TRUCK",
  "BUS",
  "OTHER",
] as const;

export const VEHICLE_STATUSES = [
  "AVAILABLE",
  "ON_TRIP",
  "IN_SHOP",
  "RETIRED",
] as const;

export const vehicleTypeSchema = z.enum(VEHICLE_TYPES);
export const vehicleStatusSchema = z.enum(VEHICLE_STATUSES);

// ---------------------------------------------------------------------------
// Create schema — all required fields + optional manufacturer
// z.coerce.number() handles HTML input strings and JSON numbers uniformly
// ---------------------------------------------------------------------------

export const createVehicleSchema = z.object({
  fleetCode: z.string().min(1, { error: "Fleet code is required" }),
  registrationNo: z.string().min(1, { error: "Registration number is required" }),
  manufacturer: z.string().optional(),
  model: z.string().min(1, { error: "Model is required" }),
  type: vehicleTypeSchema,
  maxLoadKg: z.coerce
    .number({ error: "Max load must be a number" })
    .int({ error: "Max load must be a whole number" })
    .min(1, { error: "Max load must be greater than 0" }),
  odometer: z.coerce
    .number({ error: "Odometer must be a number" })
    .int({ error: "Odometer must be a whole number" })
    .min(0, { error: "Odometer cannot be negative" }),
  acquisitionCost: z.coerce
    .number({ error: "Acquisition cost must be a number" })
    .min(0, { error: "Acquisition cost cannot be negative" }),
  status: vehicleStatusSchema.optional().default("AVAILABLE"),
});

// ---------------------------------------------------------------------------
// Update schema — all fields optional (for PATCH)
// ---------------------------------------------------------------------------

export const updateVehicleSchema = createVehicleSchema.partial();

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleTypeValue = z.infer<typeof vehicleTypeSchema>;
export type VehicleStatusValue = z.infer<typeof vehicleStatusSchema>;
