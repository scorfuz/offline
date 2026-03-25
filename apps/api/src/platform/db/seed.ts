import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

import type { DatabaseClient } from "./client";
import { authAccounts, authUsers } from "./schema";

export type SeedRole = "admin" | "member" | "manager";

export type SeedUserInput = {
  email: string;
  password: string;
  role: SeedRole;
  displayName: string;
};

export async function seedAuthUser(
  database: DatabaseClient,
  input: SeedUserInput
): Promise<void> {
  await database.db
    .insert(authUsers)
    .values({
      id: randomUUID(),
      email: input.email,
      emailVerified: true,
      displayName: input.displayName,
      role: input.role,
    })
    .onConflictDoUpdate({
      target: authUsers.email,
      set: {
        emailVerified: true,
        displayName: input.displayName,
        role: input.role,
      },
    });

  const [user] = await database.db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(eq(authUsers.email, input.email));

  if (!user) {
    throw new Error(`Expected user to exist: ${input.email}`);
  }

  const passwordHash = await hashPassword(input.password);

  await database.db
    .insert(authAccounts)
    .values({
      id: randomUUID(),
      accountId: input.email,
      providerId: "credential",
      userId: user.id,
      passwordHash,
    })
    .onConflictDoUpdate({
      target: [authAccounts.providerId, authAccounts.accountId],
      set: {
        userId: user.id,
        passwordHash,
      },
    });
}
