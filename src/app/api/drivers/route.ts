import { type NextRequest } from "next/server";
import { isPrismaError, PrismaErrorCode } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { createDriverSchema } from "@/lib/validators/driver.schema";

// Opt out of static generation — this route requires a live DB connection.
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/drivers — return all drivers ordered newest first
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json(drivers);
  } catch {
    return Response.json(
      { error: "Failed to fetch drivers" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/drivers — create a new driver
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = createDriverSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const driver = await prisma.driver.create({ data: result.data });
    return Response.json(driver, { status: 201 });
  } catch (err: unknown) {
    if (isPrismaError(err) && err.code === PrismaErrorCode.UNIQUE_CONSTRAINT) {
      return Response.json(
        { error: "License number already exists" },
        { status: 409 },
      );
    }
    return Response.json({ error: "Failed to create driver" }, { status: 500 });
  }
}
