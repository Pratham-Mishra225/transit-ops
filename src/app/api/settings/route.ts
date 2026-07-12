import { type NextRequest } from "next/server";
import { settingsSchema } from "@/lib/validators/dashboard.schema";
import { getSettings, updateSettings } from "@/lib/settings/settings.service";
import { requirePermission } from "@/lib/auth/authorize";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettings();
    return Response.json(settings);
  } catch (err: unknown) {
    console.error("[GET /api/settings]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  // Enforce RBAC
  const authContext = await requirePermission("settings:update");
  if (authContext instanceof NextResponse) {
    return authContext; // 401 or 403
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = settingsSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const updated = await updateSettings(result.data);
    return Response.json(updated);
  } catch (err: unknown) {
    console.error("[PATCH /api/settings]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to update settings" },
      { status: 500 }
    );
  }
}
