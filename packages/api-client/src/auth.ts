import { ParseResult, Schema } from "effect";

import {
  type AuthSession,
  CurrentUserResponse,
  type CurrentUserResponseType,
  LoginRequest,
} from "@offline/contracts";

export interface AuthClientOptions {
  baseUrl: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthClient {
  getCurrentUser: () => Promise<AuthSession>;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  logout: () => Promise<void>;
}

function decodeWithSchema<A, I>(
  schema: Schema.Schema<A, I, any>,
  input: unknown,
  label: string
): A {
  try {
    return Schema.decodeUnknownSync(schema as Schema.Schema<A, I, never>)(
      input
    );
  } catch (error) {
    if (ParseResult.isParseError(error)) {
      throw new Error(`${label}: ${error.message}`);
    }

    throw error;
  }
}

function transformApiResponse(
  apiResponse: CurrentUserResponseType
): AuthSession {
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

      const meJson = await response.json();
      const apiResponse: CurrentUserResponseType = decodeWithSchema(
        CurrentUserResponse,
        meJson,
        "Invalid auth session response"
      );
      return transformApiResponse(apiResponse);
    },

    login: async (credentials: LoginCredentials) => {
      const body: LoginCredentials = decodeWithSchema(
        LoginRequest,
        credentials,
        "Invalid login request"
      );
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
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

      const sessionJson = await meResponse.json();
      const apiResponse: CurrentUserResponseType = decodeWithSchema(
        CurrentUserResponse,
        sessionJson,
        "Invalid auth session response"
      );
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
