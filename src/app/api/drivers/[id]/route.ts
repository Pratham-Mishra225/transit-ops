import { type NextRequest, NextResponse } from "next/server";
import { isPrismaError, PrismaErrorCode } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { updateDriverSchema } from "@/lib/validators/driver.schema";
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
// GET /api/drivers/:id — return a specific driver
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
  const authContext = await requirePermission("driver:read");
  if (authContext instanceof NextResponse) return authContext;
>>>>>>> Stashed changes

  const { id } = await params;

  try {
    const driver = await prisma.driver.findUnique({
      where: { id },
    });
    if (!driver) {
      return Response.json({ error: "Driver not found" }, { status: 404 });
    }
    return Response.json(driver);
  } catch {
    return Response.json({ error: "Failed to fetch driver" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/drivers/:id — update a driver
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
<<<<<<< Updated upstream
  const context = await requireRole(ApplicationRole.FLEET_MANAGER, ApplicationRole.SAFETY_OFFICER);
  if (context instanceof NextResponse) {
    return context;
  }
=======
  const authContext = await requirePermission("driver:update");
  if (authContext instanceof NextResponse) return authContext;
>>>>>>> Stashed changes

  const { id } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = updateDriverSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const driver = await prisma.driver.update({
      where: { id },
      data: result.data,
    });
    return Response.json(driver);
  } catch (err: unknown) {
    if (isPrismaError(err)) {
      if (err.code === PrismaErrorCode.RECORD_NOT_FOUND) {
        return Response.json({ error: "Driver not found" }, { status: 404 });
      }
      if (err.code === PrismaErrorCode.UNIQUE_CONSTRAINT) {
        return Response.json(
          { error: "License number already exists" },
          { status: 409 },
        );
      }
    }
    return Response.json({ error: "Failed to update driver" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/drivers/:id — delete a driver
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
<<<<<<< Updated upstream
  const context = await requireRole(ApplicationRole.FLEET_MANAGER, ApplicationRole.SAFETY_OFFICER);
  if (context instanceof NextResponse) {
    return context;
  }
=======
  const authContext = await requirePermission("driver:delete");
  if (authContext instanceof NextResponse) return authContext;
>>>>>>> Stashed changes

  const { id } = await params;

  try {
    await prisma.driver.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (err: unknown) {
    if (isPrismaError(err) && err.code === PrismaErrorCode.RECORD_NOT_FOUND) {
      return Response.json({ error: "Driver not found" }, { status: 404 });
    }
    return Response.json({ error: "Failed to delete driver" }, { status: 500 });
  }
}
