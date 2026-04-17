import type { CurrentUserResponseType } from "@offline/contracts";

import type { DatabaseClient } from "../platform/db";
import { getUserRoleById } from "./roles";

type SessionResult = {
  session: {
    id: string;
    expiresAt: Date;
  };
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
} | null;

const unauthenticated = {
  authenticated: false,
  session: null,
  user: null,
} as const;

export async function getCurrentUserResponse(options: {
  database: DatabaseClient;
  session: SessionResult;
}): Promise<CurrentUserResponseType> {
  const { database, session } = options;

  if (session === null) {
    return unauthenticated;
  }

  const role = await getUserRoleById({
    database,
    userId: session.user.id,
  });

  return {
    ...unauthenticated,
    authenticated: true,
    session: {
      id: session.session.id,
      expiresAt: session.session.expiresAt.toISOString(),
    },
    user: {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.name ?? null,
      role,
    },
  };
}
