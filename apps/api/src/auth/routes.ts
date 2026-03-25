import type { IncomingMessage, ServerResponse } from "node:http";

import type { DatabaseClient } from "../platform/db";
import type { AppAuth } from "./config";
import { getCurrentUserResponse } from "./current-user";
import { getSession } from "./session";

export async function handleAuthRoutes(options: {
  auth: AppAuth;
  database: DatabaseClient;
  method: string;
  pathname: string;
  headers: Headers;
  request: IncomingMessage;
  response: ServerResponse;
}) {
  const { auth, database, method, pathname, headers, request, response } =
    options;

  if (method === "GET" && pathname === "/api/auth/me") {
    const session = await getSession(auth, headers);
    const currentUser = await getCurrentUserResponse({ database, session });

    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(currentUser));
    return true;
  }

  if (method === "POST" && pathname === "/api/auth/login") {
    const body = await readJsonBody(request);
    const authResponse = await auth.api.signInEmail({
      body,
      headers,
      asResponse: true,
    });

    await writeFetchResponse(response, authResponse);
    return true;
  }

  if (method === "POST" && pathname === "/api/auth/logout") {
    const authResponse = await auth.api.signOut({
      headers,
      asResponse: true,
    });

    await writeFetchResponse(response, authResponse);
    return true;
  }

  return false;
}

async function readJsonBody(request: IncomingMessage): Promise<{
  email: string;
  password: string;
}> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    throw new Error("Missing request body");
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
    email: string;
    password: string;
  };
}

async function writeFetchResponse(
  response: ServerResponse,
  fetchResponse: Response
) {
  for (const [key, value] of fetchResponse.headers.entries()) {
    if (key === "set-cookie") {
      continue;
    }

    response.setHeader(key, value);
  }

  const setCookie = fetchResponse.headers.getSetCookie();

  if (setCookie.length > 0) {
    response.setHeader("set-cookie", setCookie);
  }

  response.writeHead(fetchResponse.status);
  response.end(await fetchResponse.text());
}
