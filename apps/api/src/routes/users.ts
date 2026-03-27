import { eq } from "drizzle-orm";

import { ApiError, RoleQuery, UsersResponse } from "@base-template/contracts";

import { authUsers } from "../platform/db/schema";
import {
  type RouteContext,
  requireAuth,
  readQueryParam,
  sendJson,
} from "./shared";

export async function handleUserRoutes(ctx: RouteContext): Promise<boolean> {
  const { method, pathname } = ctx;

  // GET /api/users
  if (method === "GET" && pathname === "/api/users") {
    return handleListUsers(ctx);
  }

  return false;
}

async function handleListUsers(ctx: RouteContext): Promise<boolean> {
  const user = await requireAuth(ctx);
  if (!user) {
    sendJson(ctx.response, 401, ApiError, { error: "Unauthorized" });
    return true;
  }

  if (user.role !== "admin") {
    sendJson(ctx.response, 403, ApiError, { error: "Forbidden" });
    return true;
  }

  // Parse role filter from the original pathname (query string is in the URL)
  const rawUrl = new URL(ctx.request.url ?? "/", "http://localhost");
  const role = readQueryParam(
    rawUrl.searchParams.get("role"),
    RoleQuery,
    "Invalid role query parameter"
  );

  let query = ctx.database.db
    .select({
      id: authUsers.id,
      email: authUsers.email,
      displayName: authUsers.displayName,
      role: authUsers.role,
    })
    .from(authUsers);

  if (role) {
    query = query.where(eq(authUsers.role, role)) as typeof query;
  }

  const rows = await query;

  sendJson(
    ctx.response,
    200,
    UsersResponse,
    rows.map((r) => ({
      id: r.id,
      email: r.email,
      displayName: r.displayName,
      role: r.role,
    }))
  );
  return true;
}
