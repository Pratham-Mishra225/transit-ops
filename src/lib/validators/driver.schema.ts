import { z } from "zod";
import { DriverStatus } from "@prisma/client";

export const createDriverSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  licenseNumber: z.string().min(1, { message: "License Number is required" }),
  licenseCategory: z.string().min(1, { message: "License Category is required" }),
  licenseExpiry: z.coerce.date({
    error: "License Expiry must be a valid date",
  }),
  contactNumber: z.string().min(1, { message: "Contact Number is required" }),
  safetyScore: z.coerce
    .number()
    .min(0, { message: "Safety score cannot be negative" })
    .default(100),
  status: z.nativeEnum(DriverStatus).default(DriverStatus.AVAILABLE),
});

export const updateDriverSchema = createDriverSchema.partial();

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
