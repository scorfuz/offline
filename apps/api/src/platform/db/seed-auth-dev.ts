import { fileURLToPath } from "node:url";

import { loadEnv, type AppEnv } from "../env";
import { createDatabaseClient } from "./client";
import { seedAuthUser } from "./seed";

export async function seedAdminAuthUser(env: AppEnv = loadEnv()) {
  const database = createDatabaseClient(env);

  try {
    await seedAuthUser(database, {
      email: "admin@test.com",
      password: "password1234",
      role: "admin",
      displayName: "Admin User",
    });
  } finally {
    await database.close();
  }
}

export async function seedMemberAuthUser(env: AppEnv = loadEnv()) {
  const database = createDatabaseClient(env);

  try {
    await seedAuthUser(database, {
      email: "member@test.com",
      password: "password1234",
      role: "member",
      displayName: "Team Member",
    });
  } finally {
    await database.close();
  }
}

export async function seedManagerAuthUser(env: AppEnv = loadEnv()) {
  const database = createDatabaseClient(env);

  try {
    await seedAuthUser(database, {
      email: "manager@test.com",
      password: "password1234",
      role: "manager",
      displayName: "Manager User",
    });
  } finally {
    await database.close();
  }
}

async function run() {
  await seedAdminAuthUser();
  console.log("Seeded admin@test.com with admin role");
  await seedMemberAuthUser();
  console.log("Seeded member@test.com with member role");
  await seedManagerAuthUser();
  console.log("Seeded manager@test.com with manager role");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void run();
}
