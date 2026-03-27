import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import type { DatabaseClient } from "../platform/db";
import type { AppAuth } from "../auth/config";
import { getSession } from "../auth/session";
import { getUserRoleById } from "../auth/roles";
import { projects } from "../platform/db/schema";

interface RouteContext {
  auth: AppAuth;
  database: DatabaseClient;
  method: string;
  pathname: string;
  headers: Headers;
  request: IncomingMessage;
  response: ServerResponse;
}

export async function handleProjectRoutes(ctx: RouteContext): Promise<boolean> {
  const { method, pathname } = ctx;

  // GET /api/projects
  if (method === "GET" && pathname === "/api/projects") {
    return handleListProjects(ctx);
  }

  // POST /api/projects
  if (method === "POST" && pathname === "/api/projects") {
    return handleCreateProject(ctx);
  }

  // PUT /api/projects/:id
  if (method === "PUT") {
    const match = pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (match) {
      return handleUpdateProject(ctx, match[1]!);
    }
  }

  // DELETE /api/projects/:id
  if (method === "DELETE") {
    const match = pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (match) {
      return handleDeleteProject(ctx, match[1]!);
    }
  }

  return false;
}

async function requireAuth(ctx: RouteContext) {
  const session = await getSession(ctx.auth, ctx.headers);
  if (!session) return null;

  const role = await getUserRoleById({
    database: ctx.database,
    userId: session.user.id,
  });

  return { userId: session.user.id, role };
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
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
async function handleListProjects(ctx: RouteContext): Promise<boolean> {
  const user = await requireAuth(ctx);
  if (!user) {
    sendJson(ctx.response, 401, { error: "Unauthorized" });
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

  sendJson(ctx.response, 200, rows.map(formatProject));
  return true;
}

// POST /api/projects
async function handleCreateProject(ctx: RouteContext): Promise<boolean> {
  const user = await requireAuth(ctx);
  if (!user) {
    sendJson(ctx.response, 401, { error: "Unauthorized" });
    return true;
  }

  if (user.role !== "admin") {
    sendJson(ctx.response, 403, { error: "Forbidden" });
    return true;
  }

  const body = (await readBody(ctx.request)) as {
    title?: string;
    description?: string;
    status?: string;
    assignedTechId?: string | null;
  };

  if (!body.title?.trim()) {
    sendJson(ctx.response, 400, { error: "Title is required" });
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

  sendJson(ctx.response, 201, formatProject(rows[0]!));
  return true;
}

// PUT /api/projects/:id
async function handleUpdateProject(
  ctx: RouteContext,
  projectId: string
): Promise<boolean> {
  const user = await requireAuth(ctx);
  if (!user) {
    sendJson(ctx.response, 401, { error: "Unauthorized" });
    return true;
  }

  const [existing] = await ctx.database.db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!existing) {
    sendJson(ctx.response, 404, { error: "Project not found" });
    return true;
  }

  const body = (await readBody(ctx.request)) as {
    title?: string;
    description?: string;
    status?: string;
    assignedTechId?: string | null;
  };

  // Tech can only update status on their own assigned project
  if (user.role === "tech") {
    if (existing.assignedTechId !== user.userId) {
      sendJson(ctx.response, 403, { error: "Forbidden" });
      return true;
    }

    // Tech can only change status
    const hasNonStatusFields =
      body.title !== undefined ||
      body.description !== undefined ||
      body.assignedTechId !== undefined;

    if (hasNonStatusFields) {
      sendJson(ctx.response, 403, {
        error: "Techs can only update project status",
      });
      return true;
    }
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined)
    updates.description = body.description.trim();
  if (body.status !== undefined) updates.status = body.status;
  if (body.assignedTechId !== undefined)
    updates.assignedTechId = body.assignedTechId;

  const rows = await ctx.database.db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, projectId))
    .returning();

  sendJson(ctx.response, 200, formatProject(rows[0]!));
  return true;
}

// DELETE /api/projects/:id
async function handleDeleteProject(
  ctx: RouteContext,
  projectId: string
): Promise<boolean> {
  const user = await requireAuth(ctx);
  if (!user) {
    sendJson(ctx.response, 401, { error: "Unauthorized" });
    return true;
  }

  if (user.role !== "admin") {
    sendJson(ctx.response, 403, { error: "Forbidden" });
    return true;
  }

  const [deleted] = await ctx.database.db
    .delete(projects)
    .where(eq(projects.id, projectId))
    .returning();

  if (!deleted) {
    sendJson(ctx.response, 404, { error: "Project not found" });
    return true;
  }

  sendJson(ctx.response, 200, { success: true });
  return true;
}
