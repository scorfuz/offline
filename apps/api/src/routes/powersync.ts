import { SignJWT } from "jose";

import { ApiError } from "@offline/contracts";

import { type RouteContext, requireAuth, sendJson } from "./shared";

const TOKEN_EXPIRY_SECONDS = 300; // 5 minutes

export async function routePowersync(ctx: RouteContext): Promise<boolean> {
  const { method, pathname } = ctx;

  if (method === "POST" && pathname === "/api/powersync/token") {
    return getToken(ctx);
  }

  return false;
}

async function getToken(ctx: RouteContext): Promise<boolean> {
  const { response } = ctx;

  const identity = await requireAuth(ctx);

  if (!identity) {
    sendJson(response, 401, ApiError, { error: "Unauthorized" });
    return true;
  }

  const encoder = new TextEncoder();
  const secret = encoder.encode(ctx.env.powersyncJwtSecret);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + TOKEN_EXPIRY_SECONDS;

  const token = await new SignJWT({ role: identity.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(identity.userId)
    .setAudience(ctx.env.powersyncJwtAudience)
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .sign(secret);

  response.writeHead(200, { "content-type": "application/json" });
  const tokenPayload = JSON.stringify({ token, expiresAt });
  response.end(tokenPayload);
  return true;
}
