/**
 * ProjectDetailScreen - Shows project details with status update
 *
 * Features:
 * - Display project title, description, status
 * - Update status (open → in_progress → completed)
 * - Shows offline/pending sync indicator
 * - Navigate to comments
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useLiveQuery } from "@tanstack/react-db";
import { eq } from "@tanstack/react-db";
import { theme } from "@base-template/ui";
import { useProjects } from "../lib/projects-provider";
import {
  getStatusLabel,
  getStatusColor,
  VALID_STATUS_TRANSITIONS,
  type ProjectStatus,
} from "./projects-helpers";
import type { Project } from "../lib/powersync-schema";

interface ProjectDetailScreenProps {
  projectId: string;
  currentUserId: string;
  onBack: () => void;
  onViewComments: (projectId: string) => void;
}

// All statuses for reference
const ALL_STATUSES: ProjectStatus[] = ["open", "in_progress", "completed"];

export function ProjectDetailScreen({
  projectId,
  currentUserId,
  onBack,
  onViewComments,
}: ProjectDetailScreenProps) {
  const { projectsCollection, commentsCollection, isLoading, error } =
    useProjects();
  const [updating, setUpdating] = useState(false);

  // Query the specific project
  const { data: projectData } = useLiveQuery(
    (q) =>
      projectsCollection
        ? q
            .from({ project: projectsCollection })
            .where(({ project }) => eq(project.id, projectId))
            .limit(1)
        : null,
    [projectsCollection, projectId]
  );

  // Query comments count for this project
  const { data: commentsData } = useLiveQuery(
    (q) =>
      commentsCollection
        ? q
            .from({ comment: commentsCollection })
            .where(({ comment }) => eq(comment.project_id, projectId))
        : null,
    [commentsCollection, projectId]
  );

  const project: Project | undefined = projectData
    ? Array.from(projectData)[0]
    : undefined;

  const comments = commentsData ? Array.from(commentsData) : [];

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (!project || !projectsCollection) return;

    // Validate transition
    const currentStatus = (project.status as ProjectStatus) ?? "open";
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];

    if (!validTransitions.includes(newStatus)) {
      Alert.alert(
        "Invalid Status Change",
        `Cannot change status from ${getStatusLabel(currentStatus)} to ${getStatusLabel(newStatus)}`
      );
      return;
    }

    setUpdating(true);
    try {
      await projectsCollection.update(project.id, (draft) => {
        draft.status = newStatus;
        draft.updated_at = new Date().toISOString();
      });
    } catch (err) {
      Alert.alert(
        "Update Failed",
        err instanceof Error ? err.message : "Failed to update status"
      );
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.color.accent} />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load project</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatus = (project.status as ProjectStatus) ?? "open";
  const statusLabel = getStatusLabel(project.status);
  const statusColor = getStatusColor(project.status);
  const validNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus];

  // Tech can only update if they're assigned and there are valid transitions
  const canUpdateStatus =
    project.assigned_tech_id === currentUserId && validNextStatuses.length > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Project Info */}
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            {project.title ?? "Untitled Project"}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "20" },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Description */}
        {project.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{project.description}</Text>
          </View>
        )}

        {/* Status Update Section */}
        {canUpdateStatus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Update Status</Text>
            <View style={styles.statusButtons}>
              {validNextStatuses.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    { borderColor: getStatusColor(status) },
                    updating && styles.statusButtonDisabled,
                  ]}
                  onPress={() => handleStatusChange(status)}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator
                      size="small"
                      color={getStatusColor(status)}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.statusButtonText,
                        { color: getStatusColor(status) },
                      ]}
                    >
                      Mark {getStatusLabel(status)}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Comments Section */}
        <TouchableOpacity
          style={styles.commentsCard}
          onPress={() => onViewComments(project.id)}
        >
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <Text style={styles.commentsCount}>{comments.length}</Text>
          </View>
          <Text style={styles.commentsSubtitle}>
            {comments.length === 0
              ? "No comments yet. Tap to add one."
              : comments.length === 1
                ? "1 comment. Tap to view."
                : `${comments.length} comments. Tap to view.`}
          </Text>
        </TouchableOpacity>

        {/* Project Metadata */}
        <View style={styles.metadataSection}>
          <Text style={styles.metadataText}>
            Created:{" "}
            {project.created_at
              ? new Date(project.created_at).toLocaleDateString()
              : "Unknown"}
          </Text>
          <Text style={styles.metadataText}>
            Updated:{" "}
            {project.updated_at
              ? new Date(project.updated_at).toLocaleDateString()
              : "Unknown"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.canvas,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.color.canvas,
    padding: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 16,
    color: theme.color.accent,
    fontWeight: "500",
  },
  content: {
    padding: 16,
    gap: 24,
  },
  titleSection: {
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.color.ink,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.color.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.color.ink,
  },
  statusButtons: {
    flexDirection: "row",
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.color.surface,
  },
  statusButtonDisabled: {
    opacity: 0.6,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  commentsCard: {
    backgroundColor: theme.color.surface,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.color.ink,
  },
  commentsCount: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.color.accent,
    backgroundColor: theme.color.accent + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  commentsSubtitle: {
    fontSize: 14,
    color: theme.color.muted,
  },
  metadataSection: {
    gap: 4,
    paddingTop: 8,
  },
  metadataText: {
    fontSize: 12,
    color: theme.color.muted,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.color.muted,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.color.ink,
  },
  errorSubtext: {
    fontSize: 14,
    color: theme.color.muted,
    marginTop: 4,
    textAlign: "center",
    marginBottom: 16,
  },
});
