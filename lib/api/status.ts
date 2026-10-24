"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export type StatusPage = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  components: { domain_id: string; label: string }[];
  created_at: string;
};

export type PublicStatus = {
  title: string;
  description: string | null;
  overall: "up" | "degraded" | "down";
  components: { label: string; status: "up" | "down" | "unknown"; uptime: number | null; days: { day: string; uptime: number | null }[] }[];
  incidents: { component: string | null; started_at: string; resolved_at: string | null }[];
  updated_at: string;
};

export type StatusPageInput = Partial<Pick<StatusPage, "slug" | "title" | "description" | "components">>;

const key = ["status-pages"] as const;

export function useStatusPages() {
  const signedIn = useAuthStore((s) => s.status === "authenticated");
  return useQuery({ queryKey: key, queryFn: () => api<StatusPage[]>("/status-pages", { auth: true }), enabled: signedIn });
}

export function useSaveStatusPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: StatusPageInput & { id?: string }) =>
      id ? api<StatusPage>(`/status-pages/${id}`, { method: "PATCH", body, auth: true }) : api<StatusPage>("/status-pages", { method: "POST", body, auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteStatusPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/status-pages/${id}`, { method: "DELETE", auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

/** The public view; no sign-in. */
export function usePublicStatus(slug: string) {
  return useQuery({ queryKey: ["status", slug], queryFn: () => api<PublicStatus>(`/status/${slug}`), refetchInterval: 60_000 });
}
