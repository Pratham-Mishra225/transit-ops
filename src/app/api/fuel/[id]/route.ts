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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const data = fuelSchema.parse(json);

    const fuelLog = await prisma.fuelLog.update({
      where: { id: params.id },
      data: {
        vehicleId: data.vehicleId,
        tripId: data.tripId,
        liters: data.liters,
        cost: data.cost,
        loggedAt: data.loggedAt,
      },
    });
    return NextResponse.json(fuelLog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update fuel log" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.fuelLog.delete({
      where: { id: params.id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete fuel log" }, { status: 500 });
  }
}
