import { ApplicationRole } from "@prisma/client";

export type ResourceAction = 
  | "vehicle:create" | "vehicle:read" | "vehicle:update" | "vehicle:delete"
  | "driver:create" | "driver:read" | "driver:update" | "driver:delete"
  | "trip:create" | "trip:read" | "trip:update" | "trip:delete"
  | "maintenance:create" | "maintenance:read" | "maintenance:update" | "maintenance:delete"
  | "fuel:create" | "fuel:read" | "fuel:update" | "fuel:delete"
  | "expense:create" | "expense:read" | "expense:update" | "expense:delete"
  | "analytics:read"
  | "settings:update";

type RolePermissions = Record<ApplicationRole, ResourceAction[]>;

// Define all permissions here so Fleet Manager gets everything automatically
const ALL_PERMISSIONS: ResourceAction[] = [
  "vehicle:create", "vehicle:read", "vehicle:update", "vehicle:delete",
  "driver:create", "driver:read", "driver:update", "driver:delete",
  "trip:create", "trip:read", "trip:update", "trip:delete",
  "maintenance:create", "maintenance:read", "maintenance:update", "maintenance:delete",
  "fuel:create", "fuel:read", "fuel:update", "fuel:delete",
  "expense:create", "expense:read", "expense:update", "expense:delete",
  "analytics:read",
  "settings:update"
];

export const ROLE_PERMISSIONS: RolePermissions = {
  [ApplicationRole.FLEET_MANAGER]: ALL_PERMISSIONS,
  [ApplicationRole.DISPATCHER]: [
    "vehicle:read",
    "trip:create", "trip:read", "trip:update", "trip:delete",
    "driver:read"
  ],
  [ApplicationRole.SAFETY_OFFICER]: [
    "driver:create", "driver:read", "driver:update", "driver:delete",
    "trip:read",
    "maintenance:read"
  ],
  [ApplicationRole.FINANCIAL_ANALYST]: [
    "fuel:create", "fuel:read", "fuel:update", "fuel:delete",
    "expense:create", "expense:read", "expense:update", "expense:delete",
    "analytics:read",
    "vehicle:read"
  ],
  [ApplicationRole.UNASSIGNED]: []
};
