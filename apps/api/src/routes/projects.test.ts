import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { startServer, type StartedServer } from "../main";
import { seedAuthUser } from "../platform/db/seed";
import { createDatabaseClient, type DatabaseClient } from "../platform/db";
import { loadEnv } from "../platform/env";
import { projects } from "../platform/db/schema";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let server: StartedServer;
let database: DatabaseClient;
let adminCookie: string;
let techCookie: string;
let adminUserId: string;
let techUserId: string;

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

  // Get user info
  const meRes = await api("/api/auth/me", {
    headers: { cookie },
  });
  const me = (await meRes.json()) as { user: { id: string } };

  return { cookie, userId: me.user.id };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

before(async () => {
  const env = loadEnv();
  database = createDatabaseClient(env);

  // Seed test users
  await seedAuthUser(database, {
    email: "test-admin@test.com",
    password: "password1234",
    role: "admin",
    displayName: "Test Admin",
  });

  await seedAuthUser(database, {
    email: "test-tech@test.com",
    password: "password1234",
    role: "tech",
    displayName: "Test Tech",
  });

  server = await startServer({ env, port: 0 });

  const admin = await loginAs("test-admin@test.com", "password1234");
  adminCookie = admin.cookie;
  adminUserId = admin.userId;

  const tech = await loginAs("test-tech@test.com", "password1234");
  techCookie = tech.cookie;
  techUserId = tech.userId;
});

after(async () => {
  await server.close();
  await database.db.delete(projects);
  await database.close();
});

beforeEach(async () => {
  await database.db.delete(projects);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/projects", () => {
  it("admin sees all projects", async () => {
    // Create two projects — one assigned to tech, one unassigned
    await api("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ title: "Project A", assignedTechId: techUserId }),
    });
    await api("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ title: "Project B" }),
    });

    const res = await api("/api/projects", {
      headers: { cookie: adminCookie },
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as Array<{ title: string }>;
    assert.equal(body.length, 2);
  });

  it("tech sees only their assigned projects", async () => {
    await api("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ title: "Assigned", assignedTechId: techUserId }),
    });
    await api("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ title: "Unassigned" }),
    });

    const res = await api("/api/projects", {
      headers: { cookie: techCookie },
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as Array<{ title: string }>;
    assert.equal(body.length, 1);
    assert.equal(body[0].title, "Assigned");
  });
});

describe("PUT /api/projects/:id", () => {
  it("admin can update any project field", async () => {
    const createRes = await api("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ title: "Original Title" }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await api(`/api/projects/${created.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({
        title: "Updated Title",
        description: "New description",
        status: "in_progress",
        assignedTechId: techUserId,
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      title: string;
      description: string;
      status: string;
      assignedTechId: string;
    };
    assert.equal(body.title, "Updated Title");
    assert.equal(body.description, "New description");
    assert.equal(body.status, "in_progress");
    assert.equal(body.assignedTechId, techUserId);
  });

  it("tech can update status on their own assigned project", async () => {
    const createRes = await api("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({
        title: "Tech's Project",
        assignedTechId: techUserId,
      }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await api(`/api/projects/${created.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: techCookie },
      body: JSON.stringify({ status: "in_progress" }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as { status: string };
    assert.equal(body.status, "in_progress");
  });

  it("tech cannot update status on another tech's project", async () => {
    const createRes = await api("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ title: "Not Mine" }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await api(`/api/projects/${created.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: techCookie },
      body: JSON.stringify({ status: "in_progress" }),
    });

    assert.equal(res.status, 403);
  });

  it("tech cannot update non-status fields on their own project", async () => {
    const createRes = await api("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({
        title: "Tech's Project",
        assignedTechId: techUserId,
      }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await api(`/api/projects/${created.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: techCookie },
      body: JSON.stringify({ title: "Sneaky rename" }),
    });

    assert.equal(res.status, 403);
  });

  it("returns 404 for non-existent project", async () => {
    const res = await api("/api/projects/nonexistent-id", {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ title: "Ghost" }),
    });

    assert.equal(res.status, 404);
  });
});

describe("DELETE /api/projects/:id", () => {
  it("admin can delete a project", async () => {
    const createRes = await api("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ title: "To Delete" }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await api(`/api/projects/${created.id}`, {
      method: "DELETE",
      headers: { cookie: adminCookie },
    });

    assert.equal(res.status, 200);

    // Verify it's gone
    const listRes = await api("/api/projects", {
      headers: { cookie: adminCookie },
    });
    const list = (await listRes.json()) as Array<{ id: string }>;
    assert.ok(!list.some((p) => p.id === created.id));
  });

  it("tech cannot delete a project", async () => {
    const createRes = await api("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({
        title: "Protected",
        assignedTechId: techUserId,
      }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await api(`/api/projects/${created.id}`, {
      method: "DELETE",
      headers: { cookie: techCookie },
    });

    assert.equal(res.status, 403);
  });

  it("returns 404 for non-existent project", async () => {
    const res = await api("/api/projects/nonexistent-id", {
      method: "DELETE",
      headers: { cookie: adminCookie },
    });

    assert.equal(res.status, 404);
  });
});

describe("POST /api/projects", () => {
  it("admin can create a project", async () => {
    const res = await api("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({
        title: "Install HVAC Unit",
        description: "Replace the rooftop unit at building A",
        assignedTechId: techUserId,
      }),
    });

    assert.equal(res.status, 201);

    const body = (await res.json()) as {
      id: string;
      title: string;
      description: string;
      status: string;
      assignedTechId: string;
      createdById: string;
    };

    assert.equal(body.title, "Install HVAC Unit");
    assert.equal(body.description, "Replace the rooftop unit at building A");
    assert.equal(body.status, "open");
    assert.equal(body.assignedTechId, techUserId);
    assert.equal(body.createdById, adminUserId);
    assert.ok(body.id);
  });

  it("tech cannot create a project", async () => {
    const res = await api("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: techCookie },
      body: JSON.stringify({ title: "Sneaky project" }),
    });

    assert.equal(res.status, 403);
  });

  it("unauthenticated request is rejected", async () => {
    const res = await api("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "No auth" }),
    });

    assert.equal(res.status, 401);
  });
});
