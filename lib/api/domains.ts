"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export type TlsMode = "auto" | "internal" | "off";

export type Domain = {
  id: string;
  hostname: string;
  server_id: string;
  server_name: string | null;
  server_ips: string[];
  application_id: string | null;
  application_name: string | null;
  redirect_to: string | null;
  tls_mode: TlsMode;
  status: "pending" | "active" | "error";
  error: string | null;
  dns_status: "ok" | "elsewhere" | "missing" | null;
  dns_addresses: string[];
  dns_checked_at: string | null;
  cert_issuer: string | null;
  cert_expires_at: string | null;
  cert_days_left: number | null;
  cert_error: string | null;
  cert_checked_at: string | null;
  /** Uptime checks from the control plane (domains that serve an app). */
  uptime: { up: boolean | null; checked_at: string | null; ms: number | null; error: string | null; uptime_24h: number | null } | null;
  created_at: string;
};

export type UptimeRange = "24h" | "7d" | "30d";
export type Uptime = {
  url: string;
  range: UptimeRange;
  uptime: number | null;
  checks: number;
  points: { t: string; uptime: number | null; ms: number | null }[];
  recent_failures: { ts: string; status: number | null; error: string | null }[];
};

export function useUptime(domainId: string | undefined, range: UptimeRange) {
  return useQuery({
    queryKey: ["domains", "uptime", domainId, range],
    queryFn: () => api<Uptime>(`/domains/${domainId}/uptime?range=${range}`, { auth: true }),
    enabled: useSignedIn() && !!domainId,
    refetchInterval: 60_000,
  });
}

export const domainKeys = { all: (appId?: string) => ["domains", appId ?? "all"] as const };

function useSignedIn() {
  return useAuthStore((s) => s.status === "authenticated");
}

export function useDomains(appId?: string) {
  return useQuery({
    queryKey: domainKeys.all(appId),
    queryFn: () => api<Domain[]>(`/domains${appId ? `?application_id=${appId}` : ""}`, { auth: true }),
    enabled: useSignedIn(),
    refetchInterval: (q) => (q.state.data?.some((d) => d.status === "pending") ? 2_000 : 20_000),
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["domains"] });
}

export function useAddDomain() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: { hostname: string; application_id: string; tls_mode: TlsMode; redirect_www: boolean }) =>
      api<Domain[]>("/domains", { method: "POST", body, auth: true }),
    onSuccess: invalidate,
  });
}

export function useUpdateDomain() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, tls_mode }: { id: string; tls_mode: TlsMode }) => api<Domain>(`/domains/${id}`, { method: "PATCH", body: { tls_mode }, auth: true }),
    onSuccess: invalidate,
  });
}

export function useRemoveDomain() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/domains/${id}`, { method: "DELETE", auth: true }),
    onSuccess: invalidate,
  });
}

export function useCheckDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ domain: Domain; job_id: string | null }>(`/domains/${id}/check`, { method: "POST", auth: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["domains"] });
      // The certificate arrives a few seconds later, once the agent answers.
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["domains"] }), 6_000);
    },
  });
}

export function domainUrl(d: Pick<Domain, "hostname" | "tls_mode">) {
  return `${d.tls_mode === "off" ? "http" : "https"}://${d.hostname}`;
}
