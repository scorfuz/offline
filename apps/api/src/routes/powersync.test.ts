import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

import * as jose from "jose";

import { startServer, type StartedServer } from "../main";
import { seedAuthUser } from "../platform/db/seed";
import { createDatabaseClient, type DatabaseClient } from "../platform/db";
import { loadEnv } from "../platform/env";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let server: StartedServer;
let database: DatabaseClient;
let techCookie: string;
let techUserId: string;
let jwtSecret: string;

function api(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`http://localhost:${server.port}${path}`, init);
}

async function loginAs(
  email: string,
  password: string
): Promise<{ cookie: string; userId: string }> {
  const res = await api("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  assert.equal(res.status, 200, `Login failed for ${email}`);

  const setCookie = res.headers.getSetCookie();
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");

  const meRes = await api("/api/auth/me", { headers: { cookie } });
  const me = (await meRes.json()) as { user: { id: string } };

  return { cookie, userId: me.user.id };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

before(async () => {
  const env = loadEnv();
  jwtSecret = env.powersyncJwtSecret;
  database = createDatabaseClient(env);

  await seedAuthUser(database, {
    email: "ps-tech@test.com",
    password: "password1234",
    role: "tech",
    displayName: "PS Tech",
  });

  server = await startServer({ env, port: 0 });

  const tech = await loginAs("ps-tech@test.com", "password1234");
  techCookie = tech.cookie;
  techUserId = tech.userId;
});

after(async () => {
  await server.close();
  await database.close();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/powersync/token", () => {
  it("returns 401 when no session cookie is present", async () => {
    const res = await api("/api/powersync/token", {
      method: "POST",
    });

    assert.equal(res.status, 401);

    const body = (await res.json()) as { error: string };
    assert.equal(body.error, "Unauthorized");
  });

  it("returns 401 when session cookie is invalid", async () => {
    const res = await api("/api/powersync/token", {
      method: "POST",
      headers: { cookie: "better-auth.session_token=bogus-value" },
    });

    assert.equal(res.status, 401);

    const body = (await res.json()) as { error: string };
    assert.equal(body.error, "Unauthorized");
  });

  it("returns a signed JWT with sub and role claims for a valid session", async () => {
    const res = await api("/api/powersync/token", {
      method: "POST",
      headers: { cookie: techCookie },
    });

    assert.equal(res.status, 200);

    const body = (await res.json()) as { token: string; expiresAt: number };
    assert.ok(body.token, "response should contain a token");
    assert.ok(body.expiresAt, "response should contain expiresAt");

    // Verify the JWT
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jose.jwtVerify(body.token, secret);

    assert.equal(payload.sub, techUserId, "sub should be the userId");
    assert.equal(payload.role, "tech", "role should be tech");

    // Expiry should be in the future but within ~5 minutes
    assert.ok(payload.exp, "JWT should have an exp claim");
    const now = Math.floor(Date.now() / 1000);
    assert.ok(payload.exp! > now, "JWT should not be expired");
    assert.ok(payload.exp! <= now + 310, "JWT should expire within ~5 minutes");
  });
});
