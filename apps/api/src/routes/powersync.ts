import { SignJWT } from "jose";

import { ApiError } from "@base-template/contracts";

import { type RouteContext, requireAuth, sendJson } from "./shared";

const TOKEN_EXPIRY_SECONDS = 300; // 5 minutes

export async function handlePowersyncRoutes(
  ctx: RouteContext
): Promise<boolean> {
  const { method, pathname } = ctx;

  if (method === "POST" && pathname === "/api/powersync/token") {
    return handleGetToken(ctx);
  }

  return false;
}

async function handleGetToken(ctx: RouteContext): Promise<boolean> {
  const { response } = ctx;

  const identity = await requireAuth(ctx);

  if (!identity) {
    sendJson(response, 401, ApiError, { error: "Unauthorized" });
    return true;
  }

  const secret = new TextEncoder().encode(ctx.env.powersyncJwtSecret);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + TOKEN_EXPIRY_SECONDS;

  const token = await new SignJWT({ role: identity.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(identity.userId)
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .sign(secret);

  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ token, expiresAt }));
  return true;
}
