import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

import type { DatabaseClient } from "./client";
import { authAccounts, authUsers } from "./schema";

export type SeedRole = "admin" | "tech" | "manager";

export type SeedUserInput = {
  id?: string;
  email: string;
  password: string;
  role: SeedRole;
  displayName: string;
};

export async function seedAuthUser(
  database: DatabaseClient,
  input: SeedUserInput
): Promise<string> {
  const userId = input.id ?? randomUUID();
  await database.db
    .insert(authUsers)
    .values({
      id: userId,
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

  const emailCondition = eq(authUsers.email, input.email);
  const [user] = await database.db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(emailCondition);

  if (!user) {
    throw new Error(`Expected user to exist: ${input.email}`);
  }

  const passwordHash = await hashPassword(input.password);

  const accountId = randomUUID();
  await database.db
    .insert(authAccounts)
    .values({
      id: accountId,
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

  return user.id;
}
