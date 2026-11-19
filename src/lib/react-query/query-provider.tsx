"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "./query-client";
import { Toaster } from "sonner";

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Centralized QueryProvider for Next.js App Router.
 * Uses the getQueryClient singleton pattern to avoid cross-request data leaks
 * during SSR while preserving client-side cache and preventing re-instantiation
 * across route transitions and suspensions.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
