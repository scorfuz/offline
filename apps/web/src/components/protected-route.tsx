import { Navigate, useRouter } from "@tanstack/react-router";
import type { UserRoleType } from "@base-template/contracts";
import { useAuthSessionQuery } from "../lib/auth-client";

// ============================================================================
// Types
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRoleType;
  requiredRoles?: readonly UserRoleType[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

interface AccessDeniedProps {
  title?: string;
  message?: string;
  currentRole?: UserRoleType | null;
}

// ============================================================================
// Access Denied Component
// ============================================================================

export function AccessDenied({
  title = "Access Denied",
  message = "You don't have permission to access this page.",
  currentRole = undefined,
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8">
      <div className="rounded-full bg-destructive/10 p-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-8 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <div className="text-center">
        <h1 className="text-xl font-semibold text-destructive">{title}</h1>
        <p className="mt-2 text-muted-foreground">{message}</p>
        {currentRole && (
          <p className="mt-1 text-sm text-muted-foreground">
            Your current role:{" "}
            <span className="font-medium capitalize">
              {currentRole.replace("_", " ")}
            </span>
          </p>
        )}
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => {
            void router.navigate({ to: "/" });
          }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => router.history.back()}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Protected Route Component
// ============================================================================

export function ProtectedRoute({
  children,
  requiredRole = undefined,
  requiredRoles = undefined,
  fallback = undefined,
  redirectTo = "/",
}: ProtectedRouteProps) {
  const { data: session, isLoading } = useAuthSessionQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const userRole = session?.type === "authenticated" ? session.user.role : null;

  // Check if user has the required role
  let hasAccess = false;

  if (requiredRole) {
    hasAccess = userRole === requiredRole;
  } else if (requiredRoles && requiredRoles.length > 0) {
    hasAccess = requiredRoles.includes(userRole as UserRoleType);
  } else {
    // No specific requirement - just needs to be logged in
    hasAccess = !!userRole;
  }

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }

    if (redirectTo) {
      return <Navigate to={redirectTo} />;
    }

    return (
      <AccessDenied
        currentRole={userRole}
        message="You don't have the required role to access this page."
      />
    );
  }

  return children;
}
