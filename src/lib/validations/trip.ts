import { z } from "zod";
import { TRIP_STATUSES } from "@/types/trip";

export const tripFormSchema = z.object({
  source: z
    .string()
    .min(1, "Source is required")
    .max(100, "Source must be 100 characters or less"),
  destination: z
    .string()
    .min(1, "Destination is required")
    .max(100, "Destination must be 100 characters or less"),
  vehicleId: z.string().min(1, "Please select a vehicle"),
  driverId: z.string().min(1, "Please select a driver"),
  cargoWeight: z
    .number({ message: "Must be a valid number" })
    .min(1, "Cargo weight must be at least 1 kg"),
  plannedDistance: z
    .number({ message: "Must be a valid number" })
    .min(1, "Planned distance must be at least 1 km"),
  status: z.enum(TRIP_STATUSES, {
    message: "Please select a status",
  }),
});

export type TripFormValues = z.infer<typeof tripFormSchema>;

export const tripCompleteSchema = z.object({
  actualDistance: z
    .number({ message: "Must be a valid number" })
    .min(0, "Actual distance cannot be negative"),
  fuelConsumed: z
    .number({ message: "Must be a valid number" })
    .min(0, "Fuel consumed cannot be negative"),
  finalOdometer: z
    .number({ message: "Must be a valid number" })
    .min(0, "Odometer cannot be negative"),
  revenue: z
    .number({ message: "Must be a valid number" })
    .min(0, "Revenue cannot be negative")
    .optional(),
});

export type TripCompleteValues = z.infer<typeof tripCompleteSchema>;
