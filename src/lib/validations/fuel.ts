import { z } from "zod";

export const fuelLogFormSchema = z.object({
  vehicleId: z.string().min(1, "Please select a vehicle"),
  tripId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  volume: z
    .number({ message: "Must be a valid number" })
    .min(0.1, "Volume must be greater than 0"),
  cost: z
    .number({ message: "Must be a valid number" })
    .min(0, "Cost cannot be negative"),
  odometer: z
    .number({ message: "Must be a valid number" })
    .min(0, "Odometer cannot be negative"),
  station: z.string().min(1, "Station name is required"),
  notes: z.string().optional(),
});

export type FuelLogFormValues = z.infer<typeof fuelLogFormSchema>;
