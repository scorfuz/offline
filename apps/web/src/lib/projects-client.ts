import {
  ApiSuccess,
  CreateProjectRequest,
  Project,
  type ProjectType,
  ProjectsResponse,
  UpdateProjectRequest,
  type UserSummaryType,
  UsersResponse,
} from "@base-template/contracts";
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

export type TechUser = UserSummaryType & { role: "tech" };

// ---------------------------------------------------------------------------
// Query options
// ---------------------------------------------------------------------------

export function projectsQueryOptions() {
  return queryOptions({
    queryKey: projectKeys.list(),
    queryFn: () => apiFetch("/api/projects", ProjectsResponse),
  });
}

export function techUsersQueryOptions() {
  return queryOptions({
    queryKey: projectKeys.techs(),
    queryFn: async () => {
      const users = await apiFetch("/api/users?role=tech", UsersResponse);
      return users.filter((user): user is TechUser => user.role === "tech");
    },
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
      apiPost("/api/projects", Project, CreateProjectRequest, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateProjectInput & { id: string }) =>
      apiPut(`/api/projects/${id}`, Project, UpdateProjectRequest, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/projects/${id}`, ApiSuccess),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
