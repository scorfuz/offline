import type { UserRoleType } from "@base-template/contracts";

// ============================================================================
// Role Checks
// ============================================================================

export function isAdmin(role?: UserRoleType | null): boolean {
  return role === "admin";
}

export function isManager(role?: UserRoleType | null): boolean {
  return role === "manager";
}

export function isMember(role?: UserRoleType | null): boolean {
  return role === "member";
}

// ============================================================================
// Admin Access
// ============================================================================

export function canAccessAdmin(role?: UserRoleType | null): boolean {
  return role === "admin";
}

export function canManageUsers(role?: UserRoleType | null): boolean {
  return role === "admin";
}

// ============================================================================
// Role Display
// ============================================================================

export function getRoleDisplayName(role?: UserRoleType | null): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "manager":
      return "Manager";
    case "member":
      return "Team Member";
    case undefined:
    case null:
      return "Unknown";
    default:
      return "Unknown";
  }
}

export function getRoleBadgeVariant(
  role?: UserRoleType | null
): "default" | "secondary" | "destructive" | "outline" {
  switch (role) {
    case "admin":
      return "destructive";
    case "manager":
      return "secondary";
    case "member":
    case undefined:
    case null:
      return "outline";
    default:
      return "outline";
  }
}
