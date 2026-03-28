import { describe, it, expect, vi, beforeEach } from "vitest";

import { commentKeys, commentsQueryOptions } from "./comments-client";

// Mock the api module
vi.mock("./api", () => ({
  apiFetch: vi.fn(),
  apiPost: vi.fn(),
  apiDelete: vi.fn(),
  apiPut: vi.fn(),
}));

describe("comments-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("commentKeys", () => {
    it("produces hierarchical keys for list and detail", () => {
      expect(commentKeys.all).toEqual(["comments"]);
      expect(commentKeys.list("p1")).toEqual(["comments", "list", "p1"]);
    });
  });

  describe("commentsQueryOptions", () => {
    it("returns query options with correct key and fetcher for a projectId", async () => {
      const { apiFetch } = await import("./api");
      const mockComments = [
        {
          id: "c1",
          projectId: "p1",
          authorId: "u1",
          text: "hello",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ];
      vi.mocked(apiFetch).mockResolvedValueOnce(mockComments);

      const opts = commentsQueryOptions("p1");

      expect(opts.queryKey).toEqual(["comments", "list", "p1"]);

      const result = await opts.queryFn!({} as any);
      expect(apiFetch).toHaveBeenCalledWith(
        "/api/projects/p1/comments",
        expect.anything()
      );
      expect(result).toEqual(mockComments);
    });
  });
});
