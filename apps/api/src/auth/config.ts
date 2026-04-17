import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import type { AppEnv } from "../platform/env";
import type { createDatabaseClient } from "../platform/db";
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
} from "../platform/db/schema";

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;

/**
 * Extract a shared parent domain for cross-subdomain cookies.
 * e.g. "https://api.sumisura.ca" -> ".sumisura.ca"
 * Returns null for localhost or Railway default domains.
 */
function extractCookieDomain(apiOrigin: string): string | null {
  try {
    const parsedUrl = new URL(apiOrigin);
    const hostname = parsedUrl.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return null;
    }

    // Skip Railway's default domains — no shared parent with the web app
    if (hostname.endsWith(".railway.app")) {
      return null;
    }

    const parts = hostname.split(".");
    if (parts.length < 2) {
      return null;
    }

    // Return the parent domain (e.g. ".sumisura.ca" from "api.sumisura.ca")
    const domainParts = parts.slice(-2);
    return `.${domainParts.join(".")}`;
  } catch {
    return null;
  }
}

export function createAuth(options: { env: AppEnv; database: DatabaseClient }) {
  const { env, database } = options;

  const cookieDomain = extractCookieDomain(env.apiOrigin);

  const dbAdapter = drizzleAdapter(database.db, {
    provider: "pg",
    schema: {
      user: authUsers,
      session: authSessions,
      account: authAccounts,
      verification: authVerifications,
    },
  });

  return betterAuth({
    secret: env.betterAuthSecret,
    baseURL: `${env.apiOrigin}/api/auth`,
    trustedOrigins: env.authTrustedOrigins,
    database: dbAdapter,
    emailAndPassword: {
      enabled: true,
    },
    user: {
      fields: {
        name: "displayName",
      },
    },
    account: {
      fields: {
        password: "passwordHash",
      },
    },
    ...(cookieDomain
      ? {
          advanced: {
            crossSubDomainCookies: {
              enabled: true,
              domain: cookieDomain,
            },
          },
        }
      : {}),
  });
}

export type AppAuth = ReturnType<typeof createAuth>;
