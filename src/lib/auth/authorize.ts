import { ApplicationRole, UserProfile } from "@prisma/client";
import { ResourceAction, ROLE_PERMISSIONS } from "./permissions";
import { requireAuthenticatedProfile, problem, AuthContext } from "./access";
import { NextResponse } from "next/server";

/**
 * Synchronous check if a given role has a specific permission.
 */
export function hasPermission(role: ApplicationRole, permission: ResourceAction): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Synchronous check if a user has a specific role.
 */
export function hasRole(user: UserProfile, role: ApplicationRole): boolean {
  return user.role === role;
}

/**
 * Middleware-like helper for API routes to enforce a permission.
 * Returns the AuthContext if successful, or a NextResponse (401/403) if denied.
 */
export async function requirePermission(
  permission: ResourceAction
): Promise<AuthContext | NextResponse> {
  const context = await requireAuthenticatedProfile();

  if (context instanceof NextResponse) {
    return context; // 401 Unauthorized
  }

  if (!hasPermission(context.profile.role, permission)) {
    return problem(
      403,
      "Forbidden",
      `Your role (${context.profile.role}) does not have permission to perform this action (${permission}).`
    );
  }

  return context;
}
