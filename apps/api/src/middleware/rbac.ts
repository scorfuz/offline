import type { IncomingMessage, ServerResponse } from "node:http";
import type { DatabaseClient } from "../platform/db";
import { getUserRoleById } from "../auth/roles";

// ============================================================================
// Types
// ============================================================================

export type UserRole = "admin" | "manager" | "tech";
export type Permission = "create" | "read" | "update" | "delete" | "manage";
export type Resource = "users";

interface RBACContext {
  userId: string;
  role: UserRole;
  database: DatabaseClient;
}

export type RBACCheck = (context: RBACContext) => boolean | Promise<boolean>;

// ============================================================================
// Role Permissions Mapping
// ============================================================================

const ROLE_PERMISSIONS: Record<UserRole, Record<Resource, Permission[]>> = {
  admin: {
    users: ["create", "read", "update", "delete", "manage"],
  },
  manager: {
    users: ["read"],
  },
  tech: {
    users: ["read"],
  },
};

// ============================================================================
// Permission Checking
// ============================================================================

export function hasPermission(
  role: UserRole,
  resource: Resource,
  permission: Permission
): boolean {
  const permissions = ROLE_PERMISSIONS[role]?.[resource];
  if (!permissions) return false;
  return permissions.includes(permission) || permissions.includes("manage");
}

export function hasAnyPermission(
  role: UserRole,
  resource: Resource,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, resource, p));
}

// ============================================================================
// Role Checking
// ============================================================================

export function hasRole(role: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(role);
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function canAccessAdmin(role: UserRole): boolean {
  return role === "admin";
}

// ============================================================================
// Middleware Factory
// ============================================================================

export interface RBACMiddlewareOptions {
  database: DatabaseClient;
  getUserIdFromRequest: (request: IncomingMessage) => Promise<string | null>;
}

export interface RBACEnforcementResult {
  allowed: boolean;
  reason?: string;
  context?: RBACContext;
}

export async function enforceRBAC(
  options: RBACMiddlewareOptions & {
    request: IncomingMessage;
    requiredRoles?: UserRole[];
    requiredPermission?: { resource: Resource; action: Permission };
    customCheck?: RBACCheck;
  }
): Promise<RBACEnforcementResult> {
  const {
    database,
    getUserIdFromRequest,
    request,
    requiredRoles,
    requiredPermission,
    customCheck,
  } = options;

  // Get user ID from request
  const userId = await getUserIdFromRequest(request);

  if (!userId) {
    return { allowed: false, reason: "Unauthorized - No user session" };
  }

  // Get user role from database
  const role = await getUserRoleById({ database, userId });

  if (!role) {
    return { allowed: false, reason: "Unauthorized - No role assigned" };
  }

  const context: RBACContext = { userId, role: role as UserRole, database };

  // Check required roles
  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasRole(role as UserRole, requiredRoles)) {
      return {
        allowed: false,
        reason: `Forbidden - Required roles: ${requiredRoles.join(", ")}`,
        context,
      };
    }
  }

  // Check required permission
  if (requiredPermission) {
    if (
      !hasPermission(
        role as UserRole,
        requiredPermission.resource,
        requiredPermission.action
      )
    ) {
      return {
        allowed: false,
        reason: `Forbidden - Required permission: ${requiredPermission.action} on ${requiredPermission.resource}`,
        context,
      };
    }
  }

  // Run custom check
  if (customCheck) {
    const customResult = await customCheck(context);
    if (!customResult) {
      return {
        allowed: false,
        reason: "Forbidden - Custom check failed",
        context,
      };
    }
  }

  return { allowed: true, context };
}

// ============================================================================
// Response Helpers
// ============================================================================

export function sendForbidden(response: ServerResponse, reason: string): void {
  response.writeHead(403, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "Forbidden", reason }));
}

export function sendUnauthorized(
  response: ServerResponse,
  reason: string = "Unauthorized"
): void {
  response.writeHead(401, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "Unauthorized", reason }));
}

// ============================================================================
// Resource Ownership Helpers
// ============================================================================

export function canEditOwnResource(
  context: RBACContext,
  resourceOwnerId: string
): boolean {
  const { role, userId } = context;

  // Admin can edit anything
  if (role === "admin") return true;

  // Manager can edit their team's resources (simplified)
  if (role === "manager") return true;

  // Tech can only edit their own
  if (role === "tech") return userId === resourceOwnerId;

  return true;
}

export function canDeleteOwnResource(
  context: RBACContext,
  resourceOwnerId: string
): boolean {
  // Same as edit for now
  return canEditOwnResource(context, resourceOwnerId);
}
