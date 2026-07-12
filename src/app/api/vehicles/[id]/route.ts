import { type NextRequest } from "next/server";
import { isPrismaError, PrismaErrorCode } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { updateVehicleSchema } from "@/lib/validators/vehicle.schema";

// Opt out of static generation — requires a live DB connection.
export const dynamic = "force-dynamic";

// In Next.js 16 the dynamic segment params object is a Promise.
type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/vehicles/:id — return a single vehicle, 404 if not found
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  const { id } = await params;

  const vehicle = await prisma.vehicle
    .findUnique({ where: { id } })
    .catch(() => null);

  if (!vehicle) {
    return Response.json({ error: "Vehicle not found" }, { status: 404 });
  }

  return Response.json(vehicle);
}

// ---------------------------------------------------------------------------
// PATCH /api/vehicles/:id — partial update
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = updateVehicleSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: result.data,
    });
    return Response.json(vehicle);
  } catch (err: unknown) {
    if (isPrismaError(err)) {
      if (err.code === PrismaErrorCode.RECORD_NOT_FOUND) {
        return Response.json({ error: "Vehicle not found" }, { status: 404 });
      }
      if (err.code === PrismaErrorCode.UNIQUE_CONSTRAINT) {
        return Response.json(
          { error: "Fleet code or registration number already exists" },
          { status: 409 },
        );
      }
    }
    return Response.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/vehicles/:id — delete a vehicle
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  const { id } = await params;

  try {
    await prisma.vehicle.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (err: unknown) {
    if (isPrismaError(err) && err.code === PrismaErrorCode.RECORD_NOT_FOUND) {
      return Response.json({ error: "Vehicle not found" }, { status: 404 });
    }
    return Response.json({ error: "Failed to delete vehicle" }, { status: 500 });
  }
}
