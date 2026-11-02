"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export type Severity = "critical" | "high" | "medium" | "low" | "unknown";
export type SeverityCounts = Record<Severity, number>;

export type Finding = {
  id: string;
  kind: "dependency" | "os" | "secret" | "eol";
  severity: Severity;
  title: string;
  ecosystem: string | null;
  package: string | null;
  version: string | null;
  fixed: string | null;
  advisory: string | null;
  aliases: string[];
  path: string | null;
  eol_at: string | null;
  first_seen_at: string;
  ignored_at: string | null;
  ignored_by: string | null;
};

export type AppSecurity = {
  lookups: boolean;
  agent_ready: boolean;
  auto_rebuild: boolean;
  scan: {
    scanned_at: string;
    checked_at: string | null;
    check_error: string | null;
    lockfiles: string[];
    packages: number;
    os: string | null;
    os_packages: number;
  } | null;
  counts: SeverityCounts;
  findings: Finding[];
};

export type SecurityOverview = {
  lookups: boolean;
  latest_agent: string;
  apps: {
    id: string;
    name: string;
    server: string | null;
    deployed: boolean;
    scanned_at: string | null;
    checked_at: string | null;
    check_error: string | null;
    counts: SeverityCounts;
    fixable: number;
    secrets: number;
    eol: string[];
    auto_rebuild: boolean;
  }[];
  outdated_agents: { id: string; name: string; version: string | null }[];
  events: { id: number; action: string; actor: string; target: string | null; detail: string | null; ip: string | null; at: string }[];
};

export function useAppSecurity(appId: string) {
  const signedIn = useAuthStore((s) => s.status === "authenticated");
  return useQuery({
    queryKey: ["security", "app", appId],
    queryFn: () => api<AppSecurity>(`/security/apps/${appId}`, { auth: true }),
    enabled: signedIn,
    // A scan takes a little while to come back.
    refetchInterval: (query) => (query.state.data && !query.state.data.scan?.checked_at ? 5000 : false),
  });
}

export function useSecurityOverview() {
  const signedIn = useAuthStore((s) => s.status === "authenticated");
  return useQuery({ queryKey: ["security", "overview"], queryFn: () => api<SecurityOverview>("/security/overview", { auth: true }), enabled: signedIn });
}

export function useScanApp(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ job_id: string }>(`/security/apps/${appId}/scan`, { method: "POST", auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["security"] }),
  });
}

export function useIgnoreFinding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ignored }: { id: string; ignored: boolean }) => api<Finding>(`/security/findings/${id}/ignore`, { method: "POST", body: { ignored }, auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["security"] }),
  });
}

export function useAutoRebuild(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => api<{ auto_rebuild: boolean }>(`/security/apps/${appId}/auto-rebuild`, { method: "PUT", body: { enabled }, auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["security"] }),
  });
}
