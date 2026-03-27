import type { IncomingMessage, ServerResponse } from "node:http";

import type { DatabaseClient } from "../platform/db";
import type { AppAuth } from "../auth/config";
import { getSession } from "../auth/session";
import { getUserRoleById } from "../auth/roles";

export interface RouteContext {
  auth: AppAuth;
  database: DatabaseClient;
  method: string;
  pathname: string;
  headers: Headers;
  request: IncomingMessage;
  response: ServerResponse;
}

export async function requireAuth(ctx: RouteContext) {
  const session = await getSession(ctx.auth, ctx.headers);
  if (!session) return null;

  const role = await getUserRoleById({
    database: ctx.database,
    userId: session.user.id,
  });

  return { userId: session.user.id, role };
}

export function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown
) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

export async function readBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
