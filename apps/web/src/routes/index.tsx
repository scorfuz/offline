import { createFileRoute, redirect } from "@tanstack/react-router";

import { getAuthSession } from "../lib/auth-session";
import { useAuthSessionQuery, useLogoutMutation } from "../lib/auth-client";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export async function requireAuth() {
  let session;

  try {
    session = await getAuthSession();
  } catch {
    throw redirect({ to: "/login" });
  }

  if (session.type === "unauthenticated") {
    throw redirect({ to: "/login" });
  }

  return { auth: session };
}

export const Route = createFileRoute("/")({
  beforeLoad: requireAuth,
  component: DashboardPage,
});

function DashboardPage() {
  const { data: session } = useAuthSessionQuery();
  const logoutMutation = useLogoutMutation();

  const userEmail =
    session?.type === "authenticated" ? session.user.email : null;
  const userRole = session?.type === "authenticated" ? session.user.role : null;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Dashboard</CardTitle>
            <CardDescription>
              Welcome back{userEmail ? `, ${userEmail}` : ""}
              {userRole ? ` (${userRole})` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This is the base template. Start building your app from here.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                logoutMutation.mutate(undefined, {
                  onSuccess: () => {
                    window.location.href = "/login";
                  },
                });
              }}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
