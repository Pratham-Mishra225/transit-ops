import { type NextRequest, NextResponse } from "next/server";
import { isPrismaError, PrismaErrorCode } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { createMaintenanceSchema } from "@/lib/validators/maintenance.schema";
<<<<<<< Updated upstream
import { requireAuthenticatedProfile, requireRole } from "@/lib/auth/access";
import { ApplicationRole } from "@prisma/client";
=======
import { requirePermission } from "@/lib/auth/authorize";
import { NextResponse } from "next/server";

>>>>>>> Stashed changes

// Opt out of static generation — this route requires a live DB connection.
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/maintenance — return all maintenance logs ordered newest first
// ---------------------------------------------------------------------------

export async function GET() {
<<<<<<< Updated upstream
  const context = await requireAuthenticatedProfile();
  if (context instanceof NextResponse) {
    return context;
  }
=======
  const authContext = await requirePermission("maintenance:read");
  if (authContext instanceof NextResponse) return authContext;
>>>>>>> Stashed changes

  try {
    const logs = await prisma.maintenanceLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vehicle: {
          select: { fleetCode: true, model: true, registrationNo: true },
        },
      },
    });
    return Response.json(logs);
  } catch (err: unknown) {
    console.error("[GET /api/maintenance]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to fetch maintenance logs" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/maintenance — create a new maintenance log
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
<<<<<<< Updated upstream
  const context = await requireRole(ApplicationRole.FLEET_MANAGER);
  if (context instanceof NextResponse) {
    return context;
  }
=======
  const authContext = await requirePermission("maintenance:create");
  if (authContext instanceof NextResponse) return authContext;

>>>>>>> Stashed changes
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = createMaintenanceSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    // If creating an ACTIVE maintenance log, we must update the vehicle to IN_SHOP
    // in a single transaction.
    const newLog = await prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.create({
        data: result.data,
        include: {
          vehicle: {
            select: { fleetCode: true, model: true, registrationNo: true },
          },
        },
      });

      if (log.status === "ACTIVE") {
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: "IN_SHOP" },
        });
      }

      return log;
    });

    return Response.json(newLog, { status: 201 });
  } catch (err: unknown) {
    if (isPrismaError(err)) {
      if (
        err.code === PrismaErrorCode.RECORD_NOT_FOUND ||
        err.code === PrismaErrorCode.FOREIGN_KEY_CONSTRAINT
      ) {
        return Response.json({ error: "Vehicle not found" }, { status: 404 });
      }
    }
    console.error("[POST /api/maintenance]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create maintenance log" },
      { status: 500 },
    );
  }
}
