/**
 * Projects data helpers
 * Utility functions for filtering and transforming project data
 */

import type { Project, Comment } from "../lib/powersync-schema";

/**
 * Filter projects by assigned tech ID
 * Returns only projects assigned to the specified tech
 */
export function getAssignedProjects(
  projects: Iterable<Project>,
  techId: string
): Project[] {
  const result: Project[] = [];
  for (const project of projects) {
    if (project.assigned_tech_id === techId) {
      result.push(project);
    }
  }
  return result;
}

/**
 * Get comment count for a specific project
 */
export function getCommentCount(
  comments: Iterable<Comment>,
  projectId: string
): number {
  let count = 0;
  for (const comment of comments) {
    if (comment.project_id === projectId) {
      count++;
    }
  }
  return count;
}

/**
 * Project status display helper
 * Maps internal status to user-friendly labels
 */
export function getStatusLabel(status: string | null): string {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return "Unknown";
  }
}

/**
 * Project status color helper
 * Returns color codes for status indicators
 */
export function getStatusColor(status: string | null): string {
  switch (status) {
    case "open":
      return "#22c55e"; // green-500
    case "in_progress":
      return "#3b82f6"; // blue-500
    case "completed":
      return "#6b7280"; // gray-500
    default:
      return "#9ca3af"; // gray-400
  }
}

// ============================================================================
// Status Transition Helpers
// ============================================================================

export type ProjectStatus = "open" | "in_progress" | "completed";

/**
 * Valid status transitions for a tech
 */
export const VALID_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> =
  {
    open: ["in_progress"],
    in_progress: ["completed"],
    completed: [],
  };

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: ProjectStatus,
  newStatus: ProjectStatus
): boolean {
  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  return validTransitions.includes(newStatus);
}

/**
 * Get next possible statuses from current status
 */
export function getNextStatuses(currentStatus: ProjectStatus): ProjectStatus[] {
  return VALID_STATUS_TRANSITIONS[currentStatus];
}

// ============================================================================
// Comment Permission Helpers
// ============================================================================

/**
 * Check if user can edit a comment (must be the author)
 */
export function canEditComment(comment: Comment, userId: string): boolean {
  return comment.author_id === userId;
}

/**
 * Check if user can delete a comment (must be the author)
 */
export function canDeleteComment(comment: Comment, userId: string): boolean {
  return comment.author_id === userId;
}

/**
 * Validate comment text
 */
export function isValidCommentText(text: string): boolean {
  return text.trim().length > 0 && text.length <= 1000;
}
