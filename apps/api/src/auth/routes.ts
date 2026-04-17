import type { IncomingMessage, ServerResponse } from "node:http";

import { CurrentUserResponse, LoginRequest } from "@offline/contracts";

import type { DatabaseClient } from "../platform/db";
import type { AppAuth } from "./config";
import { getCurrentUserResponse } from "./current-user";
import { getSession } from "./session";
import { readBody, sendJson } from "../routes/shared";

export async function routeAuth(options: {
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

    sendJson(response, 200, CurrentUserResponse, currentUser);
    return true;
  }

  if (method === "POST" && pathname === "/api/auth/login") {
    const body = await readBody(request, LoginRequest);
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
