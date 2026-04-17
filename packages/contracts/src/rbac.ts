import { Schema } from "effect";

// Date schema that parses ISO strings from API
export const DateFromString = Schema.DateFromString;

// Role definitions
export const UserRole = Schema.Literal("admin", "manager", "tech");

export type UserRole = typeof UserRole.Type;

// Permission actions
export const Permission = Schema.Literal(
  "create",
  "read",
  "update",
  "delete",
  "manage"
);

export type Permission = typeof Permission.Type;

// Resource types that can be protected
export const Resource = Schema.Literal("users");

export type Resource = typeof Resource.Type;

const optionalResourceId = Schema.optional(Schema.String);

// Permission check request
export const CheckPermissionRequest = Schema.Struct({
  userId: Schema.String,
  role: UserRole,
  permission: Permission,
  resource: Resource,
  resourceId: optionalResourceId,
});

export type CheckPermissionRequest = typeof CheckPermissionRequest.Type;

const optionalReason = Schema.optional(Schema.String);

// Permission check response
export const CheckPermissionResponse = Schema.Struct({
  allowed: Schema.Boolean,
  reason: optionalReason,
});

export type CheckPermissionResponse = typeof CheckPermissionResponse.Type;

// User with role information
export const UserWithRole = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  displayName: Schema.String,
  role: UserRole,
  isActive: Schema.Boolean,
  createdAt: DateFromString,
  updatedAt: DateFromString,
});

export type UserWithRole = typeof UserWithRole.Type;

const permissionsArray = Schema.Array(Permission);

// Role permissions mapping entry
export const RolePermissionEntry = Schema.Struct({
  role: UserRole,
  resource: Resource,
  permissions: permissionsArray,
});

export type RolePermissionEntry = typeof RolePermissionEntry.Type;

// Default role permissions mapping
export const RolePermissions: readonly RolePermissionEntry[] = [
  // Admin: full access to everything
  {
    role: "admin",
    resource: "users",
    permissions: ["create", "read", "update", "delete", "manage"],
  },

  // Manager: read users
  { role: "manager", resource: "users", permissions: ["read"] },

  // Tech: read users
  { role: "tech", resource: "users", permissions: ["read"] },
];

// Check if a role has a specific permission on a resource
export function hasPermission(
  role: UserRole,
  permission: Permission,
  resource: Resource
): boolean {
  const entry = RolePermissions.find(
    (rp) => rp.role === role && rp.resource === resource
  );
  const found = entry?.permissions.includes(permission) ?? false;
  return found;
}
