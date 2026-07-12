import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const fuelSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  tripId: z.string().optional().nullable().transform(val => val || null),
  liters: z.coerce.number().min(0.1, "Liters must be greater than 0"),
  cost: z.coerce.number().min(0, "Cost must be greater than 0"),
  loggedAt: z.string().transform((str) => new Date(str)),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = fuelSchema.parse(json);

    const fuelLog = await prisma.fuelLog.create({
      data: {
        vehicleId: data.vehicleId,
        tripId: data.tripId,
        liters: data.liters,
        cost: data.cost,
        loggedAt: data.loggedAt,
      },
    });
    return NextResponse.json(fuelLog, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create fuel log" }, { status: 500 });
  }
}
