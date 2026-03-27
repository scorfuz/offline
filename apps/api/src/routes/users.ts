import { eq } from "drizzle-orm";

import { authUsers } from "../platform/db/schema";
import { type RouteContext, requireAuth, sendJson } from "./shared";

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
    sendJson(ctx.response, 401, { error: "Unauthorized" });
    return true;
  }

  if (user.role !== "admin") {
    sendJson(ctx.response, 403, { error: "Forbidden" });
    return true;
  }

  const url = new URL(ctx.pathname, "http://localhost");
  const roleFilter = url.searchParams.get("role");

  // Parse role filter from the original pathname (query string is in the URL)
  const rawUrl = new URL(ctx.request.url ?? "/", "http://localhost");
  const role = rawUrl.searchParams.get("role");

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
    rows.map((r) => ({
      id: r.id,
      email: r.email,
      displayName: r.displayName,
      role: r.role,
    }))
  );
  return true;
}
