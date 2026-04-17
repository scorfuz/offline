import { eq } from "drizzle-orm";

import type { UserRoleType } from "@offline/contracts";
import type { DatabaseClient } from "../platform/db";
import { authUsers } from "../platform/db/schema";

type GetUserRoleByIdInput = {
  database: DatabaseClient;
  userId: string;
};

export async function getUserRoleById(
  options: GetUserRoleByIdInput
): Promise<UserRoleType | null> {
  const { database, userId } = options;

  const userIdCondition = eq(authUsers.id, userId);
  const [record] = await database.db
    .select({ role: authUsers.role })
    .from(authUsers)
    .where(userIdCondition);

  if (!record || record.role === null || record.role === undefined) {
    return null;
  }

  return record.role as UserRoleType;
}
