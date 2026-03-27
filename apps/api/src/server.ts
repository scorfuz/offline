import {
  createServer as createHttpServer,
  type ServerResponse,
} from "node:http";

import { ApiError } from "@base-template/contracts";

import { createAuth, handleAuthRoutes } from "./auth";
import { createDatabaseClient } from "./platform/db";
import { loadEnv, type AppEnv } from "./platform/env";
import { getHealthResponse } from "./routes/health";
import { handleProjectRoutes } from "./routes/projects";
import { handleCommentRoutes } from "./routes/comments";
import { handleUserRoutes } from "./routes/users";
import { RouteError, sendJson } from "./routes/shared";

export interface CreateServerOptions {
  env?: AppEnv;
}

function setCorsHeaders(response: ServerResponse, webOrigin: string): void {
  response.setHeader("Access-Control-Allow-Origin", webOrigin);
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.setHeader("Access-Control-Allow-Credentials", "true");
}

export function createServer(options: CreateServerOptions = {}) {
  const env = options.env ?? loadEnv();
  const database = createDatabaseClient(env);
  const auth = createAuth({ env, database });

  const server = createHttpServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://localhost");

      // Handle CORS preflight
      setCorsHeaders(response, env.webOrigin);

      if (request.method === "OPTIONS") {
        response.writeHead(204);
        response.end();
        return;
      }

      if (request.method === "GET" && url.pathname === "/health") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(getHealthResponse()));
        return;
      }

      const handledAuthRoute = await handleAuthRoutes({
        auth,
        database,
        method: request.method ?? "GET",
        pathname: url.pathname,
        headers: new Headers(request.headers as Record<string, string>),
        request,
        response,
      });

      if (handledAuthRoute) {
        return;
      }

      const handledProjectRoute = await handleProjectRoutes({
        auth,
        database,
        method: request.method ?? "GET",
        pathname: url.pathname,
        headers: new Headers(request.headers as Record<string, string>),
        request,
        response,
      });

      if (handledProjectRoute) {
        return;
      }

      const handledCommentRoute = await handleCommentRoutes({
        auth,
        database,
        method: request.method ?? "GET",
        pathname: url.pathname,
        headers: new Headers(request.headers as Record<string, string>),
        request,
        response,
      });

      if (handledCommentRoute) {
        return;
      }

      const handledUserRoute = await handleUserRoutes({
        auth,
        database,
        method: request.method ?? "GET",
        pathname: url.pathname,
        headers: new Headers(request.headers as Record<string, string>),
        request,
        response,
      });

      if (handledUserRoute) {
        return;
      }

      sendJson(response, 404, ApiError, { error: "Not Found" });
    } catch (error) {
      if (response.writableEnded) {
        return;
      }

      if (error instanceof RouteError) {
        sendJson(response, error.status, ApiError, error.body);
        return;
      }

      sendJson(response, 500, ApiError, { error: "Internal Server Error" });
    }
  });

  server.on("close", () => {
    void database.close();
  });

  return server;
}
