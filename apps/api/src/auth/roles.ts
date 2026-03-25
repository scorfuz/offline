import { eq } from "drizzle-orm";

import type { UserRoleType } from "@base-template/contracts";
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

  const [record] = await database.db
    .select({ role: authUsers.role })
    .from(authUsers)
    .where(eq(authUsers.id, userId));

  if (!record || record.role === null || record.role === undefined) {
    return null;
  }

  return record.role as UserRoleType;
}
