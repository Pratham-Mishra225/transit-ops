import { type NextRequest } from "next/server";
import { getOverviewMetrics } from "@/lib/dashboard/overview";
import { parseDashboardFilters } from "@/lib/dashboard/filters";
import { dashboardFiltersSchema } from "@/lib/validators/dashboard.schema";
import { requirePermission } from "@/lib/auth/authorize";
import { NextResponse } from "next/server";


export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authContext = await requirePermission("analytics:read");
  if (authContext instanceof NextResponse) return authContext;

  try {
    const rawFilters = parseDashboardFilters(request.nextUrl.searchParams);
    
    // Validate filters
    const parseResult = dashboardFiltersSchema.safeParse(rawFilters);
    if (!parseResult.success) {
      return Response.json(
        { errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = await getOverviewMetrics(parseResult.data);
    return Response.json(data);
  } catch (err: unknown) {
    console.error("[GET /api/dashboard/overview]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to fetch overview metrics" },
      { status: 500 }
    );
  }
}
