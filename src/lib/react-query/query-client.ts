import { QueryClient } from "@tanstack/react-query";

/**
 * Creates and configures a QueryClient with sensible defaults.
 * - staleTime: 5 minutes for general product & catalog data.
 * - gcTime: 30 minutes to retain cache across navigation.
 * - refetchOnWindowFocus: false to avoid sudden refetching.
 * - retry: 1 to gracefully handle transient network hiccups.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000,    // 30 minutes
        refetchOnWindowFocus: false,
        retry: 1,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Singleton QueryClient provider for Next.js App Router:
 * - Server components / SSR: Returns a new QueryClient per request to prevent cross-request leakage.
 * - Browser: Reuses the existing singleton QueryClient across navigation to keep cache alive.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a new QueryClient per request
    return makeQueryClient();
  }
  // Browser: initialize singleton QueryClient if not yet created
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
