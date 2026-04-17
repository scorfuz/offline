import {
  ApiSuccess,
  Comment,
  CommentsResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
} from "@offline/contracts";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiFetch, apiPost, apiPut, apiDelete } from "./api";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const commentKeys = {
  all: ["comments"] as const,
  list: (projectId: string) => [...commentKeys.all, "list", projectId] as const,
} as const;

// ---------------------------------------------------------------------------
// Query options
// ---------------------------------------------------------------------------

export function commentsQueryOptions(projectId: string) {
  const queryKey = commentKeys.list(projectId);
  const queryFn = () =>
    apiFetch(`/api/projects/${projectId}/comments`, CommentsResponse);
  return queryOptions({ queryKey, queryFn });
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useCommentsQuery(projectId: string) {
  const opts = commentsQueryOptions(projectId);
  return useQuery(opts);
}

export function useCreateCommentMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { text: string }) =>
      apiPost(
        `/api/projects/${projectId}/comments`,
        Comment,
        CreateCommentRequest,
        input
      ),
    onSuccess: () => {
      const queryKey = commentKeys.list(projectId);
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateCommentMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      apiPut(`/api/comments/${id}`, Comment, UpdateCommentRequest, { text }),
    onSuccess: () => {
      const queryKey = commentKeys.list(projectId);
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteCommentMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/comments/${id}`, ApiSuccess),
    onSuccess: () => {
      const queryKey = commentKeys.list(projectId);
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
