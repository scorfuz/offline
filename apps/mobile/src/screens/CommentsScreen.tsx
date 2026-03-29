/**
 * CommentsScreen - Comment thread with full CRUD
 *
 * Features:
 * - Display all comments chronologically
 * - Add new comment
 * - Edit own comments
 * - Delete own comments
 * - Shows pending/synced status
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLiveQuery, eq } from "@tanstack/react-db";
import { theme } from "@base-template/ui";
import { useProjects } from "../lib/projects-provider";
import type { Comment } from "../lib/powersync-schema";

interface CommentsScreenProps {
  projectId: string;
  currentUserId: string;
  onBack: () => void;
}

interface CommentItemProps {
  comment: Comment;
  isOwn: boolean;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}

function CommentItem({
  comment,
  isOwn,
  onEdit,
  onDelete,
  isPending,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text ?? "");

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onEdit(comment.id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(comment.text ?? "");
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(comment.id),
        },
      ]
    );
  };

  const formattedDate = comment.created_at
    ? new Date(comment.created_at).toLocaleString()
    : "Unknown date";

  return (
    <View style={[styles.commentCard, isPending && styles.pendingCard]}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>
          {comment.author_id === comment.author_id ? "You" : "Admin"}
        </Text>
        <View style={styles.commentMeta}>
          {isPending && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Saving...</Text>
            </View>
          )}
          <Text style={styles.commentDate}>{formattedDate}</Text>
        </View>
      </View>

      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            autoFocus
          />
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleSaveEdit}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, styles.cancelButton]}
              onPress={handleCancelEdit}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.commentText}>{comment.text}</Text>
          {isOwn && !isPending && (
            <View style={styles.commentActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <Text style={[styles.actionButtonText, styles.deleteText]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

export function CommentsScreen({
  projectId,
  currentUserId,
  onBack,
}: CommentsScreenProps) {
  const { commentsCollection, isLoading, error } = useProjects();
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query comments for this project, ordered by creation date
  const { data: commentsData } = useLiveQuery(
    (q) =>
      commentsCollection
        ? q
            .from({ comment: commentsCollection })
            .where(({ comment }) => eq(comment.project_id, projectId))
            .orderBy(({ comment }) => comment.created_at, "asc")
        : null,
    [commentsCollection, projectId]
  );

  const comments = commentsData ? Array.from(commentsData) : [];

  const handleAddComment = useCallback(async () => {
    if (!newCommentText.trim() || !commentsCollection) return;

    setIsSubmitting(true);
    try {
      await commentsCollection.insert({
        id: crypto.randomUUID(),
        project_id: projectId,
        author_id: currentUserId,
        text: newCommentText.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setNewCommentText("");
    } catch (err) {
      Alert.alert(
        "Failed to add comment",
        err instanceof Error ? err.message : "Please try again"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [newCommentText, commentsCollection, projectId, currentUserId]);

  const handleEditComment = useCallback(
    async (commentId: string, newText: string) => {
      if (!commentsCollection) return;

      try {
        await commentsCollection.update(commentId, (draft) => {
          draft.text = newText;
          draft.updated_at = new Date().toISOString();
        });
      } catch (err) {
        Alert.alert(
          "Failed to update comment",
          err instanceof Error ? err.message : "Please try again"
        );
      }
    },
    [commentsCollection]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!commentsCollection) return;

      try {
        await commentsCollection.delete(commentId);
      } catch (err) {
        Alert.alert(
          "Failed to delete comment",
          err instanceof Error ? err.message : "Please try again"
        );
      }
    },
    [commentsCollection]
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.color.accent} />
        <Text style={styles.loadingText}>Loading comments...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load comments</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Comments List */}
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CommentItem
            comment={item}
            isOwn={item.author_id === currentUserId}
            onEdit={handleEditComment}
            onDelete={handleDeleteComment}
            isPending={false} // Will be enhanced with sync status
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Comments Yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to add a comment to this project.
            </Text>
          </View>
        }
      />

      {/* Add Comment Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newCommentText}
          onChangeText={setNewCommentText}
          placeholder="Add a comment..."
          placeholderTextColor={theme.color.muted}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newCommentText.trim() || isSubmitting) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleAddComment}
          disabled={!newCommentText.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={theme.color.surface} />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.color.ink,
  },
  placeholder: {
    width: 50,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.color.accent,
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  commentCard: {
    backgroundColor: theme.color.surface,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  pendingCard: {
    opacity: 0.7,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: theme.color.accent,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.color.ink,
  },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pendingBadge: {
    backgroundColor: theme.color.accent + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingText: {
    fontSize: 11,
    color: theme.color.accent,
    fontWeight: "500",
  },
  commentDate: {
    fontSize: 12,
    color: theme.color.muted,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.color.ink,
  },
  commentActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionButtonText: {
    fontSize: 13,
    color: theme.color.accent,
    fontWeight: "500",
  },
  deleteText: {
    color: "#ef4444",
  },
  editContainer: {
    gap: 8,
  },
  editInput: {
    backgroundColor: theme.color.canvas,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    lineHeight: 22,
    color: theme.color.ink,
    minHeight: 80,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.color.accent,
  },
  cancelButton: {
    backgroundColor: theme.color.muted + "30",
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.color.surface,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.color.muted,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.color.muted + "30",
    backgroundColor: theme.color.surface,
  },
  input: {
    flex: 1,
    backgroundColor: theme.color.canvas,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 20,
    color: theme.color.ink,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: theme.color.accent,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: theme.color.surface,
    fontSize: 15,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
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
  backButton: {
    paddingVertical: 8,
  },
});
