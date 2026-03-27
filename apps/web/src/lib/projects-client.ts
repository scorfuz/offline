import type { ProjectType } from "@base-template/contracts";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiFetch, apiPost, apiPut, apiDelete } from "./api";
import { projectKeys } from "./query-keys";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateProjectInput {
  title: string;
  description?: string;
  status?: string;
  assignedTechId?: string | null;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  status?: string;
  assignedTechId?: string | null;
}

export interface TechUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

// ---------------------------------------------------------------------------
// Query options
// ---------------------------------------------------------------------------

export function projectsQueryOptions() {
  return queryOptions({
    queryKey: projectKeys.list(),
    queryFn: () => apiFetch<ProjectType[]>("/api/projects"),
  });
}

export function techUsersQueryOptions() {
  return queryOptions({
    queryKey: projectKeys.techs(),
    queryFn: () => apiFetch<TechUser[]>("/api/users?role=tech"),
    staleTime: 5 * 60 * 1000, // 5 minutes — user list rarely changes
  });
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useProjectsQuery() {
  return useQuery(projectsQueryOptions());
}

export function useTechUsersQuery() {
  return useQuery(techUsersQueryOptions());
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      apiPost<ProjectType>("/api/projects", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateProjectInput & { id: string }) =>
      apiPut<ProjectType>(`/api/projects/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ success: boolean }>(`/api/projects/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
