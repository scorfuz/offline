import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ============================================================================
// Test Data
// ============================================================================

const mockProjects = [
  {
    id: "proj-1",
    title: "Fix HVAC",
    description: "Repair heating unit",
    status: "open",
    assigned_tech_id: "tech-123",
    created_by_id: "admin-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "proj-2",
    title: "Install Lighting",
    description: "Install LED fixtures",
    status: "in_progress",
    assigned_tech_id: "tech-456", // Different tech
    created_by_id: "admin-1",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
  {
    id: "proj-3",
    title: "Maintenance Check",
    description: "Quarterly maintenance",
    status: "completed",
    assigned_tech_id: "tech-123",
    created_by_id: "admin-1",
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z",
  },
];

const mockComments = [
  {
    id: "comment-1",
    project_id: "proj-1",
    author_id: "tech-123",
    text: "Starting work",
    created_at: "2024-01-01T12:00:00Z",
    updated_at: "2024-01-01T12:00:00Z",
  },
  {
    id: "comment-2",
    project_id: "proj-1",
    author_id: "admin-1",
    text: "Check the filters",
    created_at: "2024-01-01T13:00:00Z",
    updated_at: "2024-01-01T13:00:00Z",
  },
  {
    id: "comment-3",
    project_id: "proj-3",
    author_id: "tech-123",
    text: "Maintenance complete",
    created_at: "2024-01-03T14:00:00Z",
    updated_at: "2024-01-03T14:00:00Z",
  },
];

// ============================================================================
// Helper Functions (to be implemented)
// ============================================================================

/**
 * Filter projects by assigned tech ID
 * Returns only projects assigned to the specified tech
 */
function getAssignedProjects(
  projects: typeof mockProjects,
  techId: string
): typeof mockProjects {
  return projects.filter((p) => p.assigned_tech_id === techId);
}

/**
 * Get comment count for a specific project
 */
function getCommentCount(
  comments: typeof mockComments,
  projectId: string
): number {
  return comments.filter((c) => c.project_id === projectId).length;
}

/**
 * Get project with metadata including comment count
 */
function getProjectWithMetadata(
  project: (typeof mockProjects)[0],
  comments: typeof mockComments
) {
  return {
    ...project,
    commentCount: getCommentCount(comments, project.id),
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("ProjectsListScreen logic", () => {
  describe("getAssignedProjects", () => {
    it("should return only projects assigned to the specified tech", () => {
      // Arrange
      const currentUserId = "tech-123";

      // Act
      const result = getAssignedProjects(mockProjects, currentUserId);

      // Assert
      assert.equal(result.length, 2);
      assert.ok(
        result.some((p) => p.id === "proj-1"),
        "should include proj-1"
      );
      assert.ok(
        result.some((p) => p.id === "proj-3"),
        "should include proj-3"
      );
      assert.ok(
        !result.some((p) => p.id === "proj-2"),
        "should NOT include proj-2 (assigned to different tech)"
      );
    });

    it("should return empty array when no projects are assigned to the tech", () => {
      // Arrange
      const unknownTechId = "tech-unknown";

      // Act
      const result = getAssignedProjects(mockProjects, unknownTechId);

      // Assert
      assert.equal(result.length, 0);
    });
  });

  describe("getCommentCount", () => {
    it("should return correct comment count for a project", () => {
      // Assert
      assert.equal(getCommentCount(mockComments, "proj-1"), 2);
      assert.equal(getCommentCount(mockComments, "proj-3"), 1);
    });

    it("should return 0 for project with no comments", () => {
      assert.equal(getCommentCount(mockComments, "proj-2"), 0);
    });
  });

  describe("getProjectWithMetadata", () => {
    it("should include comment count in metadata", () => {
      // Arrange
      const project = mockProjects[0]!; // proj-1 (non-null assertion for test)

      // Act
      const result = getProjectWithMetadata(project, mockComments);

      // Assert
      assert.equal(result.id, "proj-1");
      assert.equal(result.title, "Fix HVAC");
      assert.equal(result.commentCount, 2);
    });
  });
});
