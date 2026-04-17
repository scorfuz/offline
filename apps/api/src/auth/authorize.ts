import type { UserRoleType } from "@offline/contracts";

type AuthorizeInput = {
  currentRole: UserRoleType | null;
  allowedRoles: readonly UserRoleType[];
  message?: string;
};

export function hasRequiredRole(options: {
  currentRole: UserRoleType | null;
  allowedRoles: readonly UserRoleType[];
}): boolean {
  return (
    options.currentRole !== null &&
    options.allowedRoles.includes(options.currentRole)
  );
}

export function assertAuthorized(options: AuthorizeInput): void {
  const { currentRole, allowedRoles, message } = options;

  if (!hasRequiredRole({ currentRole, allowedRoles })) {
    throw new Error(message ?? "Access denied");
  }
}
