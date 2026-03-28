import {
  ApiSuccess,
  Comment,
  CommentsResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
} from "@base-template/contracts";
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
};

// ---------------------------------------------------------------------------
// Query options
// ---------------------------------------------------------------------------

export function commentsQueryOptions(projectId: string) {
  return queryOptions({
    queryKey: commentKeys.list(projectId),
    queryFn: () =>
      apiFetch(`/api/projects/${projectId}/comments`, CommentsResponse),
  });
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useCommentsQuery(projectId: string) {
  return useQuery(commentsQueryOptions(projectId));
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
      void queryClient.invalidateQueries({
        queryKey: commentKeys.list(projectId),
      });
    },
  });
}

export function useUpdateCommentMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      apiPut(`/api/comments/${id}`, Comment, UpdateCommentRequest, { text }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: commentKeys.list(projectId),
      });
    },
  });
}

export function useDeleteCommentMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/comments/${id}`, ApiSuccess),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: commentKeys.list(projectId),
      });
    },
  });
}
