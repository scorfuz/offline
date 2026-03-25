import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface AppEnv {
  databaseUrl: string;
  port: number;
  apiOrigin: string;
  webOrigin: string;
  betterAuthSecret: string;
  authTrustedOrigins: string[];
}

export interface LoadEnvOptions {
  cwd?: string;
  env?: Record<string, string | undefined>;
}

export function loadEnv(options: LoadEnvOptions = {}): AppEnv {
  const cwd = options.cwd ?? process.cwd();
  const fileEnv = readEnvFile(join(cwd, ".env"));
  const rawEnv = { ...fileEnv, ...process.env, ...options.env };

  const webOrigin = readUrlWithDefault(
    rawEnv.WEB_ORIGIN,
    "WEB_ORIGIN",
    "http://localhost:3000"
  );

  return {
    databaseUrl: readRequired(rawEnv.DATABASE_URL, "DATABASE_URL"),
    port: readPort(rawEnv.PORT),
    apiOrigin: readUrl(rawEnv.API_ORIGIN, "API_ORIGIN"),
    webOrigin,
    betterAuthSecret: readRequired(
      rawEnv.BETTER_AUTH_SECRET,
      "BETTER_AUTH_SECRET"
    ),
    authTrustedOrigins: readTrustedOrigins(
      rawEnv.AUTH_TRUSTED_ORIGINS,
      webOrigin
    ),
  };
}

function readEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) {
    return {};
  }

  const content = readFileSync(path, "utf8");
  const entries: Record<string, string> = {};

  for (const line of content.split(/\r?\n/u)) {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0 || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (key.length === 0) {
      continue;
    }

    entries[key] = stripQuotes(value);
  }

  return entries;
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function readRequired(value: string | undefined, key: string): string {
  if (value === undefined || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function readUrl(value: string | undefined, key: string): string {
  const url = readRequired(value, key);

  try {
    return new URL(url).toString().replace(/\/$/u, "");
  } catch {
    throw new Error(`Invalid URL for environment variable: ${key}`);
  }
}

function readUrlWithDefault(
  value: string | undefined,
  key: string,
  defaultValue: string
): string {
  if (value === undefined || value.trim().length === 0) {
    return defaultValue;
  }

  try {
    return new URL(value).toString().replace(/\/$/u, "");
  } catch {
    throw new Error(`Invalid URL for environment variable: ${key}`);
  }
}

function readPort(value: string | undefined): number {
  if (value === undefined || value.trim().length === 0) {
    return 3001;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("Invalid PORT environment variable");
  }

  return port;
}

function readTrustedOrigins(
  value: string | undefined,
  webOrigin: string
): string[] {
  if (value === undefined || value.trim().length === 0) {
    return [webOrigin];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
    .map((origin) => {
      try {
        return new URL(origin).toString().replace(/\/$/u, "");
      } catch {
        throw new Error("Invalid AUTH_TRUSTED_ORIGINS environment variable");
      }
    });
}
