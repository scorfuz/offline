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

export function createAuth(options: { env: AppEnv; database: DatabaseClient }) {
  const { env, database } = options;

  return betterAuth({
    secret: env.betterAuthSecret,
    baseURL: `${env.apiOrigin}/api/auth`,
    trustedOrigins: env.authTrustedOrigins,
    database: drizzleAdapter(database.db, {
      provider: "pg",
      schema: {
        user: authUsers,
        session: authSessions,
        account: authAccounts,
        verification: authVerifications,
      },
    }),
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
  });
}

export type AppAuth = ReturnType<typeof createAuth>;
