import { type NextRequest } from "next/server";
import { globalSearch } from "@/lib/dashboard/search";
import { requirePermission } from "@/lib/auth/authorize";
import { NextResponse } from "next/server";


export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authContext = await requirePermission("analytics:read");
  if (authContext instanceof NextResponse) return authContext;

  try {
    const query = request.nextUrl.searchParams.get("q");
    
    if (!query) {
      return Response.json([]);
    }

    const data = await globalSearch(query);
    return Response.json(data);
  } catch (err: unknown) {
    console.error("[GET /api/dashboard/search]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to execute search" },
      { status: 500 }
    );
  }
}
