import type { Server } from "node:http";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

import { loadEnv, type AppEnv } from "./platform/env";
import { createServer } from "./server";

export interface StartServerOptions {
  env?: AppEnv;
  port?: number;
}

export interface StartedServer {
  env: AppEnv;
  server: Server;
  port: number;
  close: () => Promise<void>;
}

export async function startServer(
  options: StartServerOptions = {}
): Promise<StartedServer> {
  const env = options.env ?? loadEnv();
  const server = createServer({ env });
  const port = options.port ?? env.port;

  server.listen(port);
  await once(server, "listening");

  const address = server.address();

  if (address === null || typeof address === "string") {
    throw new Error("API server did not bind to a TCP port");
  }

  return {
    env,
    server,
    port: address.port,
    close: async () => {
      server.close();
      await once(server, "close");
    },
  };
}

async function run() {
  try {
    const { port } = await startServer();
    console.log(`base-template api listening on port ${port}`);
  } catch (error) {
    console.error(formatStartupError(error));
    process.exitCode = 1;
  }
}

function formatStartupError(error: unknown): string {
  if (error instanceof Error) {
    return `Failed to start API server: ${error.message}`;
  }

  return "Failed to start API server";
}

function isMainModule(metaUrl: string): boolean {
  const entryPath = process.argv[1];

  if (!entryPath) {
    return false;
  }

  return fileURLToPath(metaUrl) === entryPath;
}

if (isMainModule(import.meta.url)) {
  void run();
}
