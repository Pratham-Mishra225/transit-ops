import { z } from "zod";
import { ExpenseCategory } from "@prisma/client";

export const createExpenseSchema = z.object({
  category: z.nativeEnum(ExpenseCategory, {
    error: "Invalid Expense Category",
  }),
  amount: z.coerce.number().min(0.01, { message: "Amount must be greater than 0" }),
  description: z.string().optional(),
  recordedAt: z.coerce.date({
    error: "Recorded Date must be a valid date",
  }),
  vehicleId: z.string().min(1, { message: "Vehicle selection is required" }),
  tripId: z.string().optional().or(z.literal("").transform(() => undefined)),
  maintenanceLogId: z.string().optional().or(z.literal("").transform(() => undefined)),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
