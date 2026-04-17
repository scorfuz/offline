import {
  ApiSuccess,
  CreateProjectRequest,
  Project,
  ProjectsResponse,
  UpdateProjectRequest,
  type UserSummaryType,
  UsersResponse,
} from "@offline/contracts";
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
  const queryKey = projectKeys.list();
  const queryFn = () => apiFetch("/api/projects", ProjectsResponse);
  return queryOptions({ queryKey, queryFn });
}

export function allUsersQueryOptions() {
  const queryKey = projectKeys.users();
  const queryFn = () => apiFetch("/api/users", UsersResponse);
  return queryOptions({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes — user list rarely changes
  });
}

export function techUsersQueryOptions() {
  const queryKey = projectKeys.techs();
  const queryFn = async () => {
    const users = await apiFetch("/api/users?role=tech", UsersResponse);
    return users.filter((user): user is TechUser => user.role === "tech");
  };
  return queryOptions({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes — user list rarely changes
  });
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useProjectsQuery() {
  const opts = projectsQueryOptions();
  return useQuery(opts);
}

export function useProjectQuery(projectId: string) {
  const baseOpts = projectsQueryOptions();
  return useQuery({
    ...baseOpts,
    select: (projects) => projects.find((p) => p.id === projectId) ?? null,
  });
}

export function useAllUsersQuery() {
  const opts = allUsersQueryOptions();
  return useQuery(opts);
}

export function useTechUsersQuery() {
  const opts = techUsersQueryOptions();
  return useQuery(opts);
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
