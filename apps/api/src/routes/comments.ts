import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import {
  ApiError,
  ApiSuccess,
  Comment,
  CommentsResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
} from "@base-template/contracts";

import { comments } from "../platform/db/schema";
import { type RouteContext, requireAuth, sendJson, readBody } from "./shared";

export async function handleCommentRoutes(ctx: RouteContext): Promise<boolean> {
  const { method, pathname } = ctx;

  // GET /api/projects/:projectId/comments
  if (method === "GET") {
    const match = pathname.match(/^\/api\/projects\/([^/]+)\/comments$/);
    if (match) {
      return handleListComments(ctx, match[1]!);
    }
  }

  // POST /api/projects/:projectId/comments
  if (method === "POST") {
    const match = pathname.match(/^\/api\/projects\/([^/]+)\/comments$/);
    if (match) {
      return handleCreateComment(ctx, match[1]!);
    }
  }

  // PUT /api/comments/:id
  if (method === "PUT") {
    const match = pathname.match(/^\/api\/comments\/([^/]+)$/);
    if (match) {
      return handleUpdateComment(ctx, match[1]!);
    }
  }

  // DELETE /api/comments/:id
  if (method === "DELETE") {
    const match = pathname.match(/^\/api\/comments\/([^/]+)$/);
    if (match) {
      return handleDeleteComment(ctx, match[1]!);
    }
  }

  return false;
}

function formatComment(row: typeof comments.$inferSelect) {
  return {
    id: row.id,
    projectId: row.projectId,
    authorId: row.authorId,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /api/projects/:projectId/comments
async function handleListComments(
  ctx: RouteContext,
  projectId: string
): Promise<boolean> {
  const user = await requireAuth(ctx);
  if (!user) {
    sendJson(ctx.response, 401, ApiError, { error: "Unauthorized" });
    return true;
  }

  const rows = await ctx.database.db
    .select()
    .from(comments)
    .where(eq(comments.projectId, projectId))
    .orderBy(comments.createdAt);

  sendJson(ctx.response, 200, CommentsResponse, rows.map(formatComment));
  return true;
}

// POST /api/projects/:projectId/comments
async function handleCreateComment(
  ctx: RouteContext,
  projectId: string
): Promise<boolean> {
  const user = await requireAuth(ctx);
  if (!user) {
    sendJson(ctx.response, 401, ApiError, { error: "Unauthorized" });
    return true;
  }

  const body = await readBody(ctx.request, CreateCommentRequest);

  if (!body.text?.trim()) {
    sendJson(ctx.response, 400, ApiError, { error: "Text is required" });
    return true;
  }

  const id = randomUUID();
  const now = new Date();

  const rows = await ctx.database.db
    .insert(comments)
    .values({
      id,
      projectId,
      authorId: user.userId,
      text: body.text.trim(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  sendJson(ctx.response, 201, Comment, formatComment(rows[0]!));
  return true;
}

// PUT /api/comments/:id
async function handleUpdateComment(
  ctx: RouteContext,
  commentId: string
): Promise<boolean> {
  const user = await requireAuth(ctx);
  if (!user) {
    sendJson(ctx.response, 401, ApiError, { error: "Unauthorized" });
    return true;
  }

  const [existing] = await ctx.database.db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId));

  if (!existing) {
    sendJson(ctx.response, 404, ApiError, { error: "Comment not found" });
    return true;
  }

  if (existing.authorId !== user.userId) {
    sendJson(ctx.response, 403, ApiError, { error: "Forbidden" });
    return true;
  }

  const body = await readBody(ctx.request, UpdateCommentRequest);

  if (!body.text?.trim()) {
    sendJson(ctx.response, 400, ApiError, { error: "Text is required" });
    return true;
  }

  const rows = await ctx.database.db
    .update(comments)
    .set({ text: body.text.trim(), updatedAt: new Date() })
    .where(eq(comments.id, commentId))
    .returning();

  sendJson(ctx.response, 200, Comment, formatComment(rows[0]!));
  return true;
}

// DELETE /api/comments/:id
async function handleDeleteComment(
  ctx: RouteContext,
  commentId: string
): Promise<boolean> {
  const user = await requireAuth(ctx);
  if (!user) {
    sendJson(ctx.response, 401, ApiError, { error: "Unauthorized" });
    return true;
  }

  const [existing] = await ctx.database.db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId));

  if (!existing) {
    sendJson(ctx.response, 404, ApiError, { error: "Comment not found" });
    return true;
  }

  if (existing.authorId !== user.userId) {
    sendJson(ctx.response, 403, ApiError, { error: "Forbidden" });
    return true;
  }

  await ctx.database.db.delete(comments).where(eq(comments.id, commentId));

  sendJson(ctx.response, 200, ApiSuccess, { success: true });
  return true;
}
