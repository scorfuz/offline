import type { AuthSession } from "@base-template/contracts";
import {
  createAuthClient,
  type LoginCredentials,
} from "@base-template/api-client";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { authKeys } from "./query-keys";

// API base URL from environment - required for direct API calls
const API_BASE_URL: string =
  (import.meta.env.VITE_API_ORIGIN as string | undefined) ??
  "http://localhost:3001";

function getAuthClient() {
  return createAuthClient({ baseUrl: API_BASE_URL });
}

export function getBrowserAuthSession() {
  const authClient = getAuthClient();
  return authClient.getCurrentUser();
}

export function authSessionQueryOptions() {
  const queryKey = authKeys.session();
  return queryOptions({
    queryKey,
    queryFn: getBrowserAuthSession,
    staleTime: 30_000,
  });
}

export function useAuthSessionQuery(initialData?: AuthSession) {
  const sessionOpts = authSessionQueryOptions();
  return useQuery({
    ...sessionOpts,
    ...(initialData ? { initialData } : {}),
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  const mutationFn = (credentials: LoginCredentials) => {
    const authClient = getAuthClient();
    return authClient.login(credentials);
  };

  const onSuccess = (session: AuthSession) => {
    const sessionKey = authKeys.session();
    queryClient.setQueryData(sessionKey, session);
  };

  return useMutation({ mutationFn, onSuccess });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  const mutationFn = () => {
    const authClient = getAuthClient();
    return authClient.logout();
  };

  const onSuccess = () => {
    const sessionKey = authKeys.session();
    queryClient.setQueryData<AuthSession>(sessionKey, {
      type: "unauthenticated",
    });
  };

  return useMutation({ mutationFn, onSuccess });
}
