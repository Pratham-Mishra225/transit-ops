import { type NextRequest } from "next/server";
import { isPrismaError, PrismaErrorCode } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { createExpenseSchema } from "@/lib/validators/expense.schema";

// Opt out of static generation — this route requires a live DB connection.
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/expenses — return all expenses ordered newest first
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { recordedAt: "desc" },
      include: {
        vehicle: {
          select: { fleetCode: true, model: true },
        },
      },
    });
    return Response.json(expenses);
  } catch {
    return Response.json(
      { error: "Failed to fetch expenses" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/expenses — create a new expense
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = createExpenseSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const expense = await prisma.expense.create({
      data: result.data,
      include: {
        vehicle: {
          select: { fleetCode: true, model: true },
        },
      },
    });
    return Response.json(expense, { status: 201 });
  } catch (err: unknown) {
    if (isPrismaError(err)) {
      if (
        err.code === PrismaErrorCode.RECORD_NOT_FOUND ||
        err.code === PrismaErrorCode.FOREIGN_KEY_CONSTRAINT
      ) {
        return Response.json({ error: "Related record (Vehicle, Trip, or Maintenance Log) not found" }, { status: 404 });
      }
    }
    return Response.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
