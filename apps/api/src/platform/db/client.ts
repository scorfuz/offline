import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { AppEnv } from "../env";
import * as schema from "./schema";

export type DatabaseClient = {
  pool: Pool;
  db: ReturnType<typeof drizzle<typeof schema>>;
  schema: typeof schema;
  close: () => Promise<void>;
};

export function createDatabaseClient(env: AppEnv): DatabaseClient {
  const pool = new Pool({ connectionString: env.databaseUrl });
  const db = drizzle({ client: pool, schema });

  return {
    pool,
    db,
    schema,
    close: () => pool.end(),
  };
}
