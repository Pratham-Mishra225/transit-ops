import { type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/access";
import { ApplicationRole } from "@prisma/client";
import { isApplicationRole } from "@/lib/auth/roles";
import { updateUserRole, getUserProfile } from "@/lib/rbac/rbac.service";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const roleUpdateSchema = z.object({
  role: z.string().refine((val) => isApplicationRole(val), {
    message: "Invalid role",
  }),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only Fleet Manager can update roles
  const authContext = await requireRole(ApplicationRole.FLEET_MANAGER);
  if (authContext instanceof NextResponse) {
    return authContext; // 401 or 403
  }

  const { id: targetUserId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = roleUpdateSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const existingUser = await getUserProfile(targetUserId);
    if (!existingUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await updateUserRole(targetUserId, result.data.role as ApplicationRole);

    return Response.json({
      id: updatedUser.id,
      authUserId: updatedUser.authUserId,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role
    });
  } catch (err: unknown) {
    console.error("[PATCH /api/users/[id]/role]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to update role" },
      { status: 500 }
    );
  }
}
