import type { AuthSession, UserRoleType } from "@base-template/contracts";
import { createServerFn } from "@tanstack/react-start";

import { getBrowserAuthSession } from "./auth-client";

interface ApiMeResponse {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    role: UserRoleType | null;
  } | null;
}

function transformApiResponse(apiResponse: ApiMeResponse): AuthSession {
  if (apiResponse.authenticated && apiResponse.user) {
    return {
      type: "authenticated",
      user: {
        id: apiResponse.user.id,
        email: apiResponse.user.email,
        role: apiResponse.user.role,
      },
    };
  }

  return { type: "unauthenticated" };
}

const getServerAuthSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");

    const apiOrigin = process.env.VITE_API_ORIGIN ?? "http://localhost:3001";
    const response = await fetch(new URL("/api/auth/me", apiOrigin), {
      headers: {
        Accept: "application/json",
        cookie: getRequestHeader("cookie") ?? "",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get current user: ${response.status}`);
    }

    const apiResponse = (await response.json()) as ApiMeResponse;
    return transformApiResponse(apiResponse);
  }
);

export async function getAuthSession(): Promise<AuthSession> {
  if (typeof window !== "undefined") {
    return getBrowserAuthSession();
  }

  return getServerAuthSession();
}
