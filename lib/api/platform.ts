"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export type Platform = {
  name: string;
  public_url: string | null;
  agent_url: string;
  webhook_url: string;
  version: string;
  agent_version: string;
  schema: string | null;
  updated_at: string | null;
};

export type EnrollmentTokenRow = {
  id: number;
  server_id: string;
  server_name: string;
  state: "pending" | "redeemed" | "expired";
  created_at: string;
  expires_at: string;
  used_at: string | null;
};

function useSignedIn() {
  return useAuthStore((s) => s.status === "authenticated");
}

export function usePlatform() {
  return useQuery({ queryKey: ["platform"], queryFn: () => api<Platform>("/platform", { auth: true }), enabled: useSignedIn() });
}

export function useSavePlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; public_url?: string }) => api<Platform>("/platform", { method: "PUT", body, auth: true }),
    onSuccess: (data) => queryClient.setQueryData(["platform"], data),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { current_password: string; new_password: string }) => api<{ message: string }>("/auth/password", { method: "POST", body, auth: true }),
  });
}

export function useEnrollmentTokens() {
  return useQuery({
    queryKey: ["enrollment-tokens"],
    queryFn: () => api<EnrollmentTokenRow[]>("/servers/enrollments", { auth: true }),
    enabled: useSignedIn(),
    refetchInterval: 30_000,
  });
}

export function useRevokeEnrollmentToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/servers/enrollments/${id}`, { method: "DELETE", auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["enrollment-tokens"] }),
  });
}
