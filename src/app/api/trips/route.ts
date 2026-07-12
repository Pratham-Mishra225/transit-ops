import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTripSchema = z.object({
  source: z.string().min(1, "Source is required"),
  destination: z.string().min(1, "Destination is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  cargoWeightKg: z.coerce.number().min(0),
  plannedDistanceKm: z.coerce.number().min(0),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = createTripSchema.parse(json);

    const tripCount = await prisma.trip.count();
    const tripNumber = `TRP-${new Date().getFullYear()}-${String(tripCount + 1).padStart(4, "0")}`;

    const trip = await prisma.trip.create({
      data: {
        tripNumber,
        source: data.source,
        destination: data.destination,
        cargoWeightKg: data.cargoWeightKg,
        plannedDistanceKm: data.plannedDistanceKm,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        startOdometer: 0,
        status: "DRAFT",
      },
    });
    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 });
  }
}
