import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

import { startServer, type StartedServer } from "../main";
import { seedAuthUser } from "../platform/db/seed";
import { createDatabaseClient, type DatabaseClient } from "../platform/db";
import { loadEnv } from "../platform/env";

let server: StartedServer;
let database: DatabaseClient;
let adminCookie: string;

function api(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`http://localhost:${server.port}${path}`, init);
}

async function loginAs(email: string, password: string): Promise<string> {
  const res = await api("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  assert.equal(res.status, 200, `Login failed for ${email}`);

  return res.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

before(async () => {
  const env = loadEnv();
  database = createDatabaseClient(env);

  await seedAuthUser(database, {
    email: "users-admin@test.com",
    password: "password1234",
    role: "admin",
    displayName: "Users Admin",
  });

  server = await startServer({ env, port: 0 });
  adminCookie = await loginAs("users-admin@test.com", "password1234");
});

after(async () => {
  await server.close();
  await database.close();
});

describe("GET /api/users", () => {
  it("rejects invalid role query parameters at the boundary", async () => {
    const res = await api("/api/users?role=owner", {
      headers: { cookie: adminCookie },
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: string };
    assert.match(body.error, /Invalid role query parameter/);
  });
});
