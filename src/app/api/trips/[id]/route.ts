import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTripSchema = z.object({
  source: z.string().min(1, "Source is required"),
  destination: z.string().min(1, "Destination is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  cargoWeightKg: z.coerce.number().min(0),
  plannedDistanceKm: z.coerce.number().min(0),
});

const dispatchSchema = z.object({
  status: z.literal("DISPATCHED"),
});

const completeSchema = z.object({
  status: z.literal("COMPLETED"),
  endOdometer: z.coerce.number().min(0),
  fuelConsumedL: z.coerce.number().min(0),
  revenue: z.coerce.number().min(0),
});

const cancelSchema = z.object({
  status: z.literal("CANCELLED"),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    
    // Status updates
    if (json.status === "DISPATCHED") {
      const trip = await prisma.trip.update({
        where: { id: params.id },
        data: {
          status: "DISPATCHED",
          dispatchedAt: new Date(),
          vehicle: { update: { status: "ON_TRIP" } },
          driver: { update: { status: "ON_TRIP" } },
        },
      });
      return NextResponse.json(trip);
    }
    
    if (json.status === "COMPLETED") {
      const data = completeSchema.parse(json);
      const trip = await prisma.trip.update({
        where: { id: params.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          endOdometer: data.endOdometer,
          fuelConsumedL: data.fuelConsumedL,
          revenue: data.revenue,
          vehicle: { 
            update: { 
              status: "AVAILABLE",
              odometer: data.endOdometer 
            } 
          },
          driver: { update: { status: "AVAILABLE" } },
        },
      });
      return NextResponse.json(trip);
    }
    
    if (json.status === "CANCELLED") {
      const trip = await prisma.trip.update({
        where: { id: params.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          vehicle: { update: { status: "AVAILABLE" } },
          driver: { update: { status: "AVAILABLE" } },
        },
      });
      return NextResponse.json(trip);
    }

    // Normal update
    const data = updateTripSchema.parse(json);
    const trip = await prisma.trip.update({
      where: { id: params.id },
      data: {
        source: data.source,
        destination: data.destination,
        cargoWeightKg: data.cargoWeightKg,
        plannedDistanceKm: data.plannedDistanceKm,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
      },
    });
    return NextResponse.json(trip);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.trip.delete({
      where: { id: params.id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 });
  }
}
