import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import {
  ApiError,
  ApiSuccess,
  CreateProjectRequest,
  Project,
  ProjectsResponse,
  UpdateProjectRequest,
} from "@offline/contracts";

import { projects } from "../platform/db/schema";
import { type RouteContext, requireAuth, sendJson, readBody } from "./shared";

export async function routeProjects(ctx: RouteContext): Promise<boolean> {
  const { method, pathname } = ctx;

  // GET /api/projects
  if (method === "GET" && pathname === "/api/projects") {
    return listProjects(ctx);
  }

  // POST /api/projects
  if (method === "POST" && pathname === "/api/projects") {
    return createProject(ctx);
  }

  // PUT /api/projects/:id
  if (method === "PUT") {
    const match = pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (match) {
      return updateProject(ctx, match[1]!);
    }
  }

  // DELETE /api/projects/:id
  if (method === "DELETE") {
    const match = pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (match) {
      return deleteProject(ctx, match[1]!);
    }
  }

  return false;
}

function formatProject(row: typeof projects.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    assignedTechId: row.assignedTechId,
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /api/projects
async function listProjects(ctx: RouteContext): Promise<boolean> {
  const user = await requireAuth(ctx);
  if (!user) {
    sendJson(ctx.response, 401, ApiError, { error: "Unauthorized" });
    return true;
  }

  let rows;
  if (user.role === "admin" || user.role === "manager") {
    rows = await ctx.database.db
      .select()
      .from(projects)
      .orderBy(projects.createdAt);
  } else {
    rows = await ctx.database.db
      .select()
      .from(projects)
      .where(eq(projects.assignedTechId, user.userId))
      .orderBy(projects.createdAt);
  }

  const formattedRows = rows.map(formatProject);
  sendJson(ctx.response, 200, ProjectsResponse, formattedRows);
  return true;
}

// POST /api/projects
async function createProject(ctx: RouteContext): Promise<boolean> {
  const user = await requireAuth(ctx);
  if (!user) {
    sendJson(ctx.response, 401, ApiError, { error: "Unauthorized" });
    return true;
  }

  if (user.role !== "admin") {
    sendJson(ctx.response, 403, ApiError, { error: "Forbidden" });
    return true;
  }

  const body = await readBody(ctx.request, CreateProjectRequest);

  if (!body.title?.trim()) {
    sendJson(ctx.response, 400, ApiError, { error: "Title is required" });
    return true;
  }

  const id = randomUUID();
  const now = new Date();

  const rows = await ctx.database.db
    .insert(projects)
    .values({
      id,
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      status: body.status ?? "open",
      assignedTechId: body.assignedTechId ?? null,
      createdById: user.userId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const created = formatProject(rows[0]!);
  sendJson(ctx.response, 201, Project, created);
  return true;
}

// PUT /api/projects/:id
async function updateProject(
  ctx: RouteContext,
  projectId: string
): Promise<boolean> {
  const user = await requireAuth(ctx);
  if (!user) {
    sendJson(ctx.response, 401, ApiError, { error: "Unauthorized" });
    return true;
  }

  const [existing] = await ctx.database.db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!existing) {
    sendJson(ctx.response, 404, ApiError, { error: "Project not found" });
    return true;
  }

  const body = await readBody(ctx.request, UpdateProjectRequest);

  // Tech can only update status on their own assigned project
  if (user.role === "tech") {
    if (existing.assignedTechId !== user.userId) {
      sendJson(ctx.response, 403, ApiError, { error: "Forbidden" });
      return true;
    }

    // Tech can only change status
    const hasNonStatusFields =
      body.title !== undefined ||
      body.description !== undefined ||
      body.assignedTechId !== undefined;

    if (hasNonStatusFields) {
      sendJson(ctx.response, 403, ApiError, {
        error: "Techs can only update project status",
      });
      return true;
    }
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    ...(body.title !== undefined && { title: body.title.trim() }),
    ...(body.description !== undefined && {
      description: body.description.trim(),
    }),
    ...(body.status !== undefined && { status: body.status }),
    ...(body.assignedTechId !== undefined && {
      assignedTechId: body.assignedTechId,
    }),
  };

  const rows = await ctx.database.db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, projectId))
    .returning();

  const updated = formatProject(rows[0]!);
  sendJson(ctx.response, 200, Project, updated);
  return true;
}

// DELETE /api/projects/:id
async function deleteProject(
  ctx: RouteContext,
  projectId: string
): Promise<boolean> {
  const user = await requireAuth(ctx);
  if (!user) {
    sendJson(ctx.response, 401, ApiError, { error: "Unauthorized" });
    return true;
  }

  if (user.role !== "admin") {
    sendJson(ctx.response, 403, ApiError, { error: "Forbidden" });
    return true;
  }

  const [deleted] = await ctx.database.db
    .delete(projects)
    .where(eq(projects.id, projectId))
    .returning();

  if (!deleted) {
    sendJson(ctx.response, 404, ApiError, { error: "Project not found" });
    return true;
  }

  sendJson(ctx.response, 200, ApiSuccess, { success: true });
  return true;
}
