import type { AuthSession, UserRoleType } from "@base-template/contracts";

export interface AuthClientOptions {
  baseUrl: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// API response shape from backend
interface ApiMeResponse {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    role: UserRoleType | null;
  } | null;
  session: {
    id: string;
    expiresAt: string;
  } | null;
}

export interface AuthClient {
  getCurrentUser: () => Promise<AuthSession>;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  logout: () => Promise<void>;
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

export function createAuthClient(options: AuthClientOptions): AuthClient {
  const { baseUrl } = options;

  return {
    getCurrentUser: async () => {
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get current user: ${response.status}`);
      }

      const apiResponse = (await response.json()) as ApiMeResponse;
      return transformApiResponse(apiResponse);
    },

    login: async (credentials: LoginCredentials) => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Login failed: ${response.status}`);
      }

      // After successful login, fetch current user to get the session
      const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!meResponse.ok) {
        throw new Error("Login succeeded but failed to get session");
      }

      const apiResponse = (await meResponse.json()) as ApiMeResponse;
      return transformApiResponse(apiResponse);
    },

    logout: async () => {
      const response = await fetch(`${baseUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Logout failed: ${response.status}`);
      }
    },
  };
}
