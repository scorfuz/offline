import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SYNC_STREAMS_PATH = join(process.cwd(), "powersync", "sync-streams.yaml");

describe("PowerSync Sync Streams", () => {
  describe("sync-streams.yaml file", () => {
    it("exists and is readable", () => {
      assert.ok(
        existsSync(SYNC_STREAMS_PATH),
        "sync-streams.yaml file should exist at apps/api/powersync/sync-streams.yaml"
      );

      const content = readFileSync(SYNC_STREAMS_PATH, "utf-8");
      assert.ok(content.length > 0, "sync-streams.yaml should not be empty");
    });

    it("contains PowerSync streams section (Sync Streams format)", () => {
      const content = readFileSync(SYNC_STREAMS_PATH, "utf-8");

      assert.ok(
        content.includes("streams:"),
        "should have 'streams:' section (Sync Streams format, not legacy bucket_definitions)"
      );
    });

    it("defines streams for projects table", () => {
      const content = readFileSync(SYNC_STREAMS_PATH, "utf-8");

      assert.ok(
        content.includes("projects"),
        "should reference projects table"
      );
    });

    it("defines streams for comments table", () => {
      const content = readFileSync(SYNC_STREAMS_PATH, "utf-8");

      assert.ok(
        content.includes("comments"),
        "should reference comments table"
      );
    });

    it("uses Sync Streams auth.user_id() syntax in stream queries", () => {
      const content = readFileSync(SYNC_STREAMS_PATH, "utf-8");

      // Find the streams section (after "streams:" line)
      const streamsMatch = content.match(/streams:\n([\s\S]*)/);
      assert.ok(streamsMatch, "should have a streams section");
      const streamsSection = streamsMatch ? streamsMatch[1] : "";

      // Check auth.user_id() is used in the actual stream queries
      assert.ok(
        streamsSection.includes("auth.user_id()"),
        "should use new Sync Streams syntax: auth.user_id() in stream queries"
      );
    });

    it("filters by user role (admin vs tech)", () => {
      const content = readFileSync(SYNC_STREAMS_PATH, "utf-8");

      assert.ok(
        content.includes("role"),
        "should filter by user role (admin/tech)"
      );
    });

    it("references auth_users table for role checks", () => {
      const content = readFileSync(SYNC_STREAMS_PATH, "utf-8");

      assert.ok(
        content.includes("auth_users"),
        "should reference auth_users table for role checks"
      );
    });

    it("references assigned_tech_id for project filtering", () => {
      const content = readFileSync(SYNC_STREAMS_PATH, "utf-8");

      assert.ok(
        content.includes("assigned_tech_id"),
        "should reference assigned_tech_id for tech project filtering"
      );
    });

    it("has auto_subscribe enabled for offline-first behavior", () => {
      const content = readFileSync(SYNC_STREAMS_PATH, "utf-8");

      assert.ok(
        content.includes("auto_subscribe: true"),
        "should have auto_subscribe: true for offline-first sync behavior"
      );
    });

    it("has documentation for JWT authentication endpoint", () => {
      const content = readFileSync(SYNC_STREAMS_PATH, "utf-8");

      assert.ok(
        content.includes("/api/powersync/token") ||
          content.includes("powersync/token"),
        "should document the JWT token endpoint"
      );
    });

    it("has required config edition (2 or higher) for Sync Streams", () => {
      const content = readFileSync(SYNC_STREAMS_PATH, "utf-8");

      // Check for config block with edition (handles various YAML formats)
      const configMatch = content.match(/config:\s*\n?\s*edition:\s*(\d+)/);
      assert.ok(
        configMatch,
        "should have 'config:\n  edition: N' block at end of file (required for Sync Streams)"
      );

      const edition = parseInt(configMatch ? configMatch[1] : "0", 10);
      assert.ok(
        edition >= 2,
        `config edition should be 2 or higher, got ${edition}`
      );
    });
  });
});
