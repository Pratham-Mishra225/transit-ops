import { type NextRequest, NextResponse } from "next/server";
import { isPrismaError, PrismaErrorCode } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { updateMaintenanceSchema } from "@/lib/validators/maintenance.schema";
<<<<<<< Updated upstream
import { requireAuthenticatedProfile, requireRole } from "@/lib/auth/access";
import { ApplicationRole } from "@prisma/client";
=======
import { requirePermission } from "@/lib/auth/authorize";
import { NextResponse } from "next/server";

>>>>>>> Stashed changes

// Opt out of static generation — requires a live DB connection.
export const dynamic = "force-dynamic";

// In Next.js 16 the dynamic segment params object is a Promise.
type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/maintenance/:id — return a specific maintenance log
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
<<<<<<< Updated upstream
  const context = await requireAuthenticatedProfile();
  if (context instanceof NextResponse) {
    return context;
  }
=======
  const authContext = await requirePermission("maintenance:read");
  if (authContext instanceof NextResponse) return authContext;
>>>>>>> Stashed changes

  const { id } = await params;

  try {
    const log = await prisma.maintenanceLog.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: { fleetCode: true, model: true, registrationNo: true },
        },
      },
    });
    if (!log) {
      return Response.json({ error: "Maintenance log not found" }, { status: 404 });
    }
    return Response.json(log);
  } catch (err: unknown) {
    console.error("[GET /api/maintenance/:id]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to fetch maintenance log" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/maintenance/:id — update a maintenance log
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
<<<<<<< Updated upstream
  const context = await requireRole(ApplicationRole.FLEET_MANAGER);
  if (context instanceof NextResponse) {
    return context;
  }
=======
  const authContext = await requirePermission("maintenance:update");
  if (authContext instanceof NextResponse) return authContext;
>>>>>>> Stashed changes

  const { id } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = updateMaintenanceSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const updatedLog = await prisma.$transaction(async (tx) => {
      // Fetch the existing log to check status transitions
      const existingLog = await tx.maintenanceLog.findUnique({
        where: { id },
        include: { vehicle: true },
      });

      if (!existingLog) {
        throw new Error("NOT_FOUND");
      }

      const log = await tx.maintenanceLog.update({
        where: { id },
        data: result.data,
        include: {
          vehicle: {
            select: { fleetCode: true, model: true, registrationNo: true },
          },
        },
      });

      // Handle status transitions
      const becameCompleted =
        existingLog.status !== "COMPLETED" && log.status === "COMPLETED";
      const becameActive =
        existingLog.status !== "ACTIVE" && log.status === "ACTIVE";

      if (becameCompleted) {
        // Restore vehicle to AVAILABLE unless it's RETIRED
        if (existingLog.vehicle.status !== "RETIRED") {
          await tx.vehicle.update({
            where: { id: log.vehicleId },
            data: { status: "AVAILABLE" },
          });
        }
      } else if (becameActive) {
        // Set vehicle to IN_SHOP
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: "IN_SHOP" },
        });
      }

      return log;
    });

    return Response.json(updatedLog);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return Response.json({ error: "Maintenance log not found" }, { status: 404 });
    }
    if (isPrismaError(err)) {
      if (
        err.code === PrismaErrorCode.RECORD_NOT_FOUND ||
        err.code === PrismaErrorCode.FOREIGN_KEY_CONSTRAINT
      ) {
        return Response.json({ error: "Record not found" }, { status: 404 });
      }
    }
    console.error("[PATCH /api/maintenance/:id]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to update maintenance log" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/maintenance/:id — delete a maintenance log
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
<<<<<<< Updated upstream
  const context = await requireRole(ApplicationRole.FLEET_MANAGER);
  if (context instanceof NextResponse) {
    return context;
  }
=======
  const authContext = await requirePermission("maintenance:delete");
  if (authContext instanceof NextResponse) return authContext;
>>>>>>> Stashed changes

  const { id } = await params;

  try {
    await prisma.maintenanceLog.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (err: unknown) {
    if (isPrismaError(err) && err.code === PrismaErrorCode.RECORD_NOT_FOUND) {
      return Response.json({ error: "Maintenance log not found" }, { status: 404 });
    }
    console.error("[DELETE /api/maintenance/:id]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to delete maintenance log" },
      { status: 500 }
    );
  }
}
