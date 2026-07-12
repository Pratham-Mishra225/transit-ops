import { requireAuthenticatedProfile } from "@/lib/auth/access";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authContext = await requireAuthenticatedProfile();
    if (authContext instanceof NextResponse) {
      return authContext; // 401 Unauthorized
    }

    const { profile } = authContext;

    return Response.json({
      id: profile.id,
      authUserId: profile.authUserId,
      email: profile.email,
      name: profile.name,
      role: profile.role
    });
  } catch (err: unknown) {
    console.error("[GET /api/me]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to fetch current user profile" },
      { status: 500 }
    );
  }
}
