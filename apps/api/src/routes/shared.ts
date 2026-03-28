import type { IncomingMessage, ServerResponse } from "node:http";

import { ParseResult, Schema } from "effect";

import type { DatabaseClient } from "../platform/db";
import type { AppEnv } from "../platform/env";
import type { AppAuth } from "../auth/config";
import { getSession } from "../auth/session";
import { getUserRoleById } from "../auth/roles";

export interface RouteContext {
  env: AppEnv;
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

export class RouteError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown
  ) {
    super(
      typeof body === "object" && body !== null && "error" in body
        ? String(body.error)
        : `HTTP ${status}`
    );
  }
}

type SchemaAny = Schema.Schema<any, any, any>;

function decodeWithSchema<A, I>(
  schema: Schema.Schema<A, I, any>,
  input: unknown,
  label: string
): A {
  try {
    return Schema.decodeUnknownSync(schema as Schema.Schema<A, I, never>)(
      input
    );
  } catch (error) {
    if (ParseResult.isParseError(error)) {
      throw new RouteError(400, {
        error: `${label}: ${error.message}`,
      });
    }

    throw error;
  }
}

export function sendJson(
  response: ServerResponse,
  status: number,
  schema: SchemaAny,
  body: unknown
) {
  decodeWithSchema(schema, body, "Invalid response body");
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

export async function readBody<A, I>(
  request: IncomingMessage,
  schema: Schema.Schema<A, I, any>
): Promise<A> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody =
    chunks.length === 0 ? "{}" : Buffer.concat(chunks).toString("utf8");

  return decodeWithSchema(
    Schema.parseJson(schema),
    rawBody,
    "Invalid request body"
  );
}

export function readQueryParam<A, I>(
  value: string | null,
  schema: Schema.Schema<A, I, any>,
  label: string
): A | null {
  if (value === null) {
    return null;
  }

  return decodeWithSchema(schema, value, label);
}
