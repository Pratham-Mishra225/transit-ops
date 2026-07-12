import { type NextRequest, NextResponse } from "next/server";
import { isPrismaError, PrismaErrorCode } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { updateExpenseSchema } from "@/lib/validators/expense.schema";
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
// GET /api/expenses/:id — return a specific expense
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
  const authContext = await requirePermission("expense:read");
  if (authContext instanceof NextResponse) return authContext;
>>>>>>> Stashed changes

  const { id } = await params;

  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: { fleetCode: true, model: true, registrationNo: true },
        },
      },
    });
    if (!expense) {
      return Response.json({ error: "Expense not found" }, { status: 404 });
    }
    return Response.json(expense);
  } catch {
    return Response.json({ error: "Failed to fetch expense" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/expenses/:id — update an expense
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
<<<<<<< Updated upstream
  const context = await requireRole(ApplicationRole.FLEET_MANAGER, ApplicationRole.FINANCIAL_ANALYST);
  if (context instanceof NextResponse) {
    return context;
  }
=======
  const authContext = await requirePermission("expense:update");
  if (authContext instanceof NextResponse) return authContext;
>>>>>>> Stashed changes

  const { id } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = updateExpenseSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: result.data,
      include: {
        vehicle: {
          select: { fleetCode: true, model: true, registrationNo: true },
        },
      },
    });
    return Response.json(expense);
  } catch (err: unknown) {
    if (isPrismaError(err)) {
      if (
        err.code === PrismaErrorCode.RECORD_NOT_FOUND ||
        err.code === PrismaErrorCode.FOREIGN_KEY_CONSTRAINT
      ) {
        return Response.json({ error: "Record not found" }, { status: 404 });
      }
    }
    return Response.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/expenses/:id — delete an expense
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
<<<<<<< Updated upstream
  const context = await requireRole(ApplicationRole.FLEET_MANAGER, ApplicationRole.FINANCIAL_ANALYST);
  if (context instanceof NextResponse) {
    return context;
  }
=======
  const authContext = await requirePermission("expense:delete");
  if (authContext instanceof NextResponse) return authContext;
>>>>>>> Stashed changes

  const { id } = await params;

  try {
    await prisma.expense.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (err: unknown) {
    if (isPrismaError(err) && err.code === PrismaErrorCode.RECORD_NOT_FOUND) {
      return Response.json({ error: "Expense not found" }, { status: 404 });
    }
    return Response.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
