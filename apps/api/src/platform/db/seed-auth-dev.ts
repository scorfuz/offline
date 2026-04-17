import { fileURLToPath } from "node:url";

import { loadEnv, type AppEnv } from "../env";
import { createDatabaseClient } from "./client";
import { comments, projects } from "./schema";
import { seedAuthUser } from "./seed";

const DEV_ADMIN_ID = "admin-1";
const DEV_TECH_ID = "tech-1";
const DEV_MANAGER_ID = "manager-1";

export async function seedAdminAuthUser(env: AppEnv = loadEnv()) {
  const database = createDatabaseClient(env);

  try {
    return await seedAuthUser(database, {
      id: DEV_ADMIN_ID,
      email: "admin@test.com",
      password: "password1234",
      role: "admin",
      displayName: "Admin User",
    });
  } finally {
    await database.close();
  }
}

export async function seedTechAuthUser(env: AppEnv = loadEnv()) {
  const database = createDatabaseClient(env);

  try {
    return await seedAuthUser(database, {
      id: DEV_TECH_ID,
      email: "tech@test.com",
      password: "password1234",
      role: "tech",
      displayName: "Tech",
    });
  } finally {
    await database.close();
  }
}

export async function seedManagerAuthUser(env: AppEnv = loadEnv()) {
  const database = createDatabaseClient(env);

  try {
    return await seedAuthUser(database, {
      id: DEV_MANAGER_ID,
      email: "manager@test.com",
      password: "password1234",
      role: "manager",
      displayName: "Manager User",
    });
  } finally {
    await database.close();
  }
}

export async function seedDevProjects(env: AppEnv = loadEnv()) {
  const database = createDatabaseClient(env);

  try {
    const adminUserId = await seedAuthUser(database, {
      id: DEV_ADMIN_ID,
      email: "admin@test.com",
      password: "password1234",
      role: "admin",
      displayName: "Admin User",
    });

    const techUserId = await seedAuthUser(database, {
      id: DEV_TECH_ID,
      email: "tech@test.com",
      password: "password1234",
      role: "tech",
      displayName: "Tech",
    });

    await database.db
      .insert(projects)
      .values({
        id: "project-1",
        title: "Tech Project 1",
        description: "Assigned to the seeded mobile tech user",
        status: "open",
        assignedTechId: techUserId,
        createdById: adminUserId,
      })
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          title: "Tech Project 1",
          description: "Assigned to the seeded mobile tech user",
          status: "open",
          assignedTechId: techUserId,
          createdById: adminUserId,
        },
      });

    await database.db
      .insert(projects)
      .values({
        id: "project-2",
        title: "Tech Project 2",
        description: "Second assigned project for navigation testing",
        status: "in_progress",
        assignedTechId: techUserId,
        createdById: adminUserId,
      })
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          title: "Tech Project 2",
          description: "Second assigned project for navigation testing",
          status: "in_progress",
          assignedTechId: techUserId,
          createdById: adminUserId,
        },
      });

    await database.db
      .insert(comments)
      .values({
        id: "comment-1",
        projectId: "project-1",
        authorId: adminUserId,
        text: "Initial seeded comment",
      })
      .onConflictDoUpdate({
        target: comments.id,
        set: {
          projectId: "project-1",
          authorId: adminUserId,
          text: "Initial seeded comment",
        },
      });

    await database.db
      .insert(comments)
      .values({
        id: "comment-2",
        projectId: "project-2",
        authorId: techUserId,
        text: "Seeded tech update",
      })
      .onConflictDoUpdate({
        target: comments.id,
        set: {
          projectId: "project-2",
          authorId: techUserId,
          text: "Seeded tech update",
        },
      });

    return { adminUserId, techUserId };
  } finally {
    await database.close();
  }
}

async function run() {
  const adminUserId = await seedAdminAuthUser();
  console.log(`Seeded admin@test.com with admin role (${adminUserId})`);

  const techUserId = await seedTechAuthUser();
  console.log(`Seeded tech@test.com with tech role (${techUserId})`);

  const managerUserId = await seedManagerAuthUser();
  console.log(`Seeded manager@test.com with manager role (${managerUserId})`);

  const seededProjects = await seedDevProjects();
  console.log(
    `Seeded projects for mobile/e2e testing (EXPO_PUBLIC_MOBILE_USER_ID=${seededProjects.techUserId})`
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void run();
}
