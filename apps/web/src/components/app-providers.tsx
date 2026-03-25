import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** Shared default options — used by both router and provider */
export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 60 * 1000, // 1 minute default; override per-query for more/less volatile data
        gcTime: 10 * 60 * 1000, // 10 minutes; keep inactive queries longer for fast back-navigation
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function AppProviders(props: {
  children: ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={props.queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}
