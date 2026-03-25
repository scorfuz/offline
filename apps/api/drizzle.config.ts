import { defineConfig } from "drizzle-kit";

import { loadEnv } from "./src/platform/env";

const env = loadEnv();

export default defineConfig({
  schema: "./src/platform/db/schema/*.ts",
  out: "./src/platform/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.databaseUrl,
  },
});
