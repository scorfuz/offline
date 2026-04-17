import { useState } from "react";

import type { CommentType } from "@offline/contracts";

import {
  useCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} from "../lib/comments-client";
import { useAllUsersQuery } from "../lib/projects-client";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface CommentThreadProps {
  projectId: string;
  currentUserId: string | null;
}

export function CommentThread({
  projectId,
  currentUserId,
}: CommentThreadProps) {
  const { data: comments = [], isLoading, error } = useCommentsQuery(projectId);
  const { data: users = [] } = useAllUsersQuery();
  const createMutation = useCreateCommentMutation(projectId);

  function getAuthorName(authorId: string): string {
    const user = users.find((u) => u.id === authorId);
    return user?.displayName ?? user?.email ?? authorId;
  }

  const [newText, setNewText] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = newText.trim();
    if (!trimmed) return;

    createMutation.mutate(
      { text: trimmed },
      { onSuccess: () => setNewText("") }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <p className="text-center text-muted-foreground">
            Loading comments...
          </p>
        )}

        {error && (
          <p className="text-center text-destructive">
            Failed to load comments: {error.message}
          </p>
        )}

        {!isLoading && !error && comments.length === 0 && (
          <p className="text-center text-muted-foreground">
            No comments yet. Be the first to comment.
          </p>
        )}

        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            projectId={projectId}
            isOwn={comment.authorId === currentUserId}
            authorName={getAuthorName(comment.authorId)}
          />
        ))}

        {/* Add comment form */}
        <form onSubmit={handleSubmit} className="space-y-2 pt-4 border-t">
          <Textarea
            placeholder="Add a comment..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!newText.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Single comment item
// ---------------------------------------------------------------------------

interface CommentItemProps {
  comment: CommentType;
  projectId: string;
  isOwn: boolean;
  authorName: string;
}

function CommentItem({
  comment,
  projectId,
  isOwn,
  authorName,
}: CommentItemProps) {
  const updateMutation = useUpdateCommentMutation(projectId);
  const deleteMutation = useDeleteCommentMutation(projectId);

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleSaveEdit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = editText.trim();
    if (!trimmed) return;

    updateMutation.mutate(
      { id: comment.id, text: trimmed },
      {
        onSuccess: () => setEditing(false),
      }
    );
  }

  function handleDelete() {
    deleteMutation.mutate(comment.id, {
      onSuccess: () => setDeleteOpen(false),
    });
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {authorName}
          {" · "}
          {new Date(comment.createdAt).toLocaleString()}
          {comment.updatedAt !== comment.createdAt && " (edited)"}
        </span>
        {isOwn && !editing && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditText(comment.text);
                setEditing(true);
              }}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSaveEdit} className="space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!editText.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm">{comment.text}</p>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
