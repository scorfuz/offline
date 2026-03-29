/**
 * ProjectsListScreen - Displays projects assigned to the current tech
 *
 * Features:
 * - Shows only projects assigned to authenticated tech
 * - Displays title, status, and comment count
 * - Uses useLiveQuery for real-time updates
 * - Navigate to project detail on tap
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLiveQuery, eq } from "@tanstack/react-db";
import { theme } from "@base-template/ui";
import { useProjects } from "../lib/projects-provider";
import { SyncStatusIndicator } from "../components/SyncStatusIndicator";
import {
  getCommentCount,
  getStatusLabel,
  getStatusColor,
} from "./projects-helpers";
import type { Project, Comment } from "../lib/powersync-schema";

interface ProjectListItemProps {
  project: Project;
  comments: Iterable<Comment>;
  onPress: (projectId: string) => void;
}

function ProjectListItem({ project, comments, onPress }: ProjectListItemProps) {
  const commentCount = getCommentCount(comments, project.id);
  const statusLabel = getStatusLabel(project.status);
  const statusColor = getStatusColor(project.status);

  return (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => onPress(project.id)}
      activeOpacity={0.7}
    >
      <View style={styles.projectHeader}>
        <Text style={styles.projectTitle} numberOfLines={1}>
          {project.title ?? "Untitled Project"}
        </Text>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>
      <View style={styles.projectFooter}>
        <Text style={styles.commentCount}>
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface ProjectsListScreenProps {
  currentUserId: string;
  onProjectPress: (projectId: string) => void;
}

export function ProjectsListScreen({
  currentUserId,
  onProjectPress,
}: ProjectsListScreenProps) {
  const {
    projectsCollection,
    commentsCollection,
    isLoading,
    error,
    isConnected,
  } = useProjects();

  // Query projects assigned to current user
  const { data: projectsData } = useLiveQuery(
    (q) =>
      projectsCollection
        ? q
            .from({ project: projectsCollection })
            .where(({ project }) => eq(project.assigned_tech_id, currentUserId))
            .orderBy(({ project }) => project.updated_at, "desc")
        : null,
    [projectsCollection, currentUserId]
  );

  // Query all comments for counting
  const { data: commentsData } = useLiveQuery(
    (q) =>
      commentsCollection ? q.from({ comment: commentsCollection }) : null,
    [commentsCollection]
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.color.accent} />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load projects</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  const projects = projectsData ? Array.from(projectsData) : [];
  const comments = commentsData ? Array.from(commentsData) : [];

  if (projects.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>No Projects Assigned</Text>
        <Text style={styles.emptySubtext}>
          You don't have any projects assigned to you yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>My Projects</Text>
            <Text style={styles.headerSubtitle}>
              {projects.length} assigned
            </Text>
          </View>
          <SyncStatusIndicator isConnected={isConnected} />
        </View>
      </View>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProjectListItem
            project={item}
            comments={comments}
            onPress={onProjectPress}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.color.ink,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.color.muted,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  projectCard: {
    backgroundColor: theme.color.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.color.ink,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  projectFooter: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  commentCount: {
    fontSize: 13,
    color: theme.color.muted,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.color.muted,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.color.ink,
  },
  errorSubtext: {
    fontSize: 14,
    color: theme.color.muted,
    marginTop: 4,
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.color.ink,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.color.muted,
    marginTop: 8,
    textAlign: "center",
  },
});
