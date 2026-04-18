import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { startServer, type StartedServer } from "../main";
import { seedAuthUser } from "../platform/db/seed";
import { createDatabaseClient, type DatabaseClient } from "../platform/db";
import { loadEnv } from "../platform/env";
import { comments, projects } from "../platform/db/schema";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let server: StartedServer;
let database: DatabaseClient;
let adminCookie: string;
let techCookie: string;
let adminUserId: string;
let techUserId: string;
let testProjectId: string;

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

async function createProject(title: string): Promise<string> {
  const res = await api("/api/projects", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: adminCookie },
    body: JSON.stringify({ title, assignedTechId: techUserId }),
  });
  const body = (await res.json()) as { id: string };
  return body.id;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

before(async () => {
  const env = loadEnv();
  database = createDatabaseClient(env);

  await seedAuthUser(database, {
    email: "comment-admin@test.com",
    password: "password1234",
    role: "admin",
    displayName: "Comment Admin",
  });

  await seedAuthUser(database, {
    email: "comment-tech@test.com",
    password: "password1234",
    role: "tech",
    displayName: "Comment Tech",
  });

  server = await startServer({ env, port: 0 });

  const admin = await loginAs("comment-admin@test.com", "password1234");
  adminCookie = admin.cookie;
  adminUserId = admin.userId;

  const tech = await loginAs("comment-tech@test.com", "password1234");
  techCookie = tech.cookie;
  techUserId = tech.userId;
});

after(async () => {
  await database.db.delete(comments);
  await database.db.delete(projects);
  await server.close();
  await database.close();
});

beforeEach(async () => {
  await database.db.delete(comments);
  await database.db.delete(projects);
  testProjectId = await createProject("Test Project");
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/projects/:projectId/comments", () => {
  it("admin can create a comment", async () => {
    const res = await api(`/api/projects/${testProjectId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ text: "Admin comment" }),
    });

    assert.equal(res.status, 201);
    const body = (await res.json()) as {
      id: string;
      projectId: string;
      authorId: string;
      text: string;
    };
    assert.equal(body.text, "Admin comment");
    assert.equal(body.projectId, testProjectId);
    assert.equal(body.authorId, adminUserId);
    assert.ok(body.id);
  });

  it("tech can create a comment", async () => {
    const res = await api(`/api/projects/${testProjectId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: techCookie },
      body: JSON.stringify({ text: "Tech comment" }),
    });

    assert.equal(res.status, 201);
    const body = (await res.json()) as { authorId: string; text: string };
    assert.equal(body.text, "Tech comment");
    assert.equal(body.authorId, techUserId);
  });

  it("preserves a client-provided id for offline-created comments", async () => {
    const clientId = "comment-client-generated-id";

    const res = await api(`/api/projects/${testProjectId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: techCookie },
      body: JSON.stringify({ id: clientId, text: "Offline comment" }),
    });

    assert.equal(res.status, 201);
    const body = (await res.json()) as { id: string; text: string };
    assert.equal(body.id, clientId);
    assert.equal(body.text, "Offline comment");
  });

  it("rejects empty text", async () => {
    const res = await api(`/api/projects/${testProjectId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ text: "" }),
    });

    assert.equal(res.status, 400);
  });

  it("rejects invalid comment payloads at the boundary", async () => {
    const res = await api(`/api/projects/${testProjectId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ text: 123 }),
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: string };
    assert.match(body.error, /Invalid request body/);
  });

  it("rejects unauthenticated request", async () => {
    const res = await api(`/api/projects/${testProjectId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "No auth" }),
    });

    assert.equal(res.status, 401);
  });
});

describe("GET /api/projects/:projectId/comments", () => {
  it("returns comments for a project", async () => {
    // Create two comments from different users
    await api(`/api/projects/${testProjectId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ text: "First" }),
    });
    await api(`/api/projects/${testProjectId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: techCookie },
      body: JSON.stringify({ text: "Second" }),
    });

    const res = await api(`/api/projects/${testProjectId}/comments`, {
      headers: { cookie: adminCookie },
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as Array<{ text: string }>;
    assert.equal(body.length, 2);
    assert.equal(body[0].text, "First");
    assert.equal(body[1].text, "Second");
  });

  it("returns empty array for project with no comments", async () => {
    const res = await api(`/api/projects/${testProjectId}/comments`, {
      headers: { cookie: techCookie },
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as Array<unknown>;
    assert.equal(body.length, 0);
  });
});

describe("PUT /api/comments/:id", () => {
  it("author can edit their own comment", async () => {
    const createRes = await api(`/api/projects/${testProjectId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: techCookie },
      body: JSON.stringify({ text: "Original" }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await api(`/api/comments/${created.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: techCookie },
      body: JSON.stringify({ text: "Updated" }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as { text: string };
    assert.equal(body.text, "Updated");
  });

  it("another user cannot edit someone else's comment", async () => {
    const createRes = await api(`/api/projects/${testProjectId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: techCookie },
      body: JSON.stringify({ text: "Tech's comment" }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await api(`/api/comments/${created.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ text: "Admin tries to edit" }),
    });

    assert.equal(res.status, 403);
  });

  it("returns 404 for non-existent comment", async () => {
    const res = await api("/api/comments/nonexistent-id", {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ text: "Ghost" }),
    });

    assert.equal(res.status, 404);
  });
});

describe("DELETE /api/comments/:id", () => {
  it("author can delete their own comment", async () => {
    const createRes = await api(`/api/projects/${testProjectId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ text: "To delete" }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await api(`/api/comments/${created.id}`, {
      method: "DELETE",
      headers: { cookie: adminCookie },
    });

    assert.equal(res.status, 200);

    // Verify it's gone
    const listRes = await api(`/api/projects/${testProjectId}/comments`, {
      headers: { cookie: adminCookie },
    });
    const list = (await listRes.json()) as Array<{ id: string }>;
    assert.ok(!list.some((c) => c.id === created.id));
  });

  it("another user cannot delete someone else's comment", async () => {
    const createRes = await api(`/api/projects/${testProjectId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ text: "Admin's comment" }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await api(`/api/comments/${created.id}`, {
      method: "DELETE",
      headers: { cookie: techCookie },
    });

    assert.equal(res.status, 403);
  });

  it("returns 404 for non-existent comment", async () => {
    const res = await api("/api/comments/nonexistent-id", {
      method: "DELETE",
      headers: { cookie: adminCookie },
    });

    assert.equal(res.status, 404);
  });
});
