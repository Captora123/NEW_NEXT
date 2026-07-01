"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { StudioProvider } from "@/lib/studio-context";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/toaster";

function AuthInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = localStorage.getItem("captora_token");
    if (token) {
      setAuthTokenGetter(() => localStorage.getItem("captora_token"));
    }
  }, []);
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const qcRef = useRef<QueryClient | null>(null);
  if (!qcRef.current) {
    qcRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          retry: 1,
        },
      },
    });
  }

  return (
    <QueryClientProvider client={qcRef.current}>
      <StudioProvider>
        <AuthInit>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </AuthInit>
      </StudioProvider>
    </QueryClientProvider>
  );
}
