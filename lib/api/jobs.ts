"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { serverKeys } from "@/lib/api/servers";
import { useAuthStore } from "@/lib/stores/auth-store";

export type JobType =
  | "service.restart"
  | "service.start"
  | "service.stop"
  | "service.logs"
  | "container.restart"
  | "container.start"
  | "container.stop"
  | "container.logs"
  | "app.deploy"
  | "app.remove"
  | "os.upgrade"
  | "os.reboot"
  | "app.exec";

export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "expired" | "canceled";

export type Job = {
  id: string;
  server_id: string;
  type: JobType;
  payload: Record<string, unknown>;
  status: JobStatus;
  created_by: string;
  correlation_id: string;
  created_at: string;
  claimed_at: string | null;
  finished_at: string | null;
  exit_code: number | null;
  error: string | null;
};

export type JobDetail = Job & {
  output: string | null;
  events: { level: string; message: string; created_at: string }[];
};

export type AuditEntry = {
  id: number;
  actor: string;
  actor_label: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
  result: "success" | "failure" | "accepted" | "rejected";
  detail: string | null;
  correlation_id: string;
  ip_address: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

export const isActive = (s: JobStatus) => s === "queued" || s === "running";

export const jobKeys = {
  server: (id: string) => ["jobs", "server", id] as const,
  detail: (id: string) => ["jobs", id] as const,
  audit: (action: string) => ["audit", action] as const,
};

function useSignedIn() {
  return useAuthStore((s) => s.status === "authenticated");
}

/** Recent jobs for a server; polls quickly while any are in flight. */
export function useServerJobs(serverId: string | undefined) {
  return useQuery({
    queryKey: jobKeys.server(serverId ?? ""),
    queryFn: () => api<Job[]>(`/jobs?server_id=${serverId}&limit=15`, { auth: true }),
    enabled: useSignedIn() && !!serverId,
    refetchInterval: (query) => (query.state.data?.some((j) => isActive(j.status)) ? 1_500 : 10_000),
  });
}

/** One job with output; polls until it finishes. */
export function useJob(jobId: string | null) {
  return useQuery({
    queryKey: jobKeys.detail(jobId ?? ""),
    queryFn: () => api<JobDetail>(`/jobs/${jobId}`, { auth: true }),
    enabled: useSignedIn() && !!jobId,
    refetchInterval: (query) => (!query.state.data || isActive(query.state.data.status) ? 1_000 : false),
  });
}

export function useRunAction(serverId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { type: JobType; payload: Record<string, unknown> }) =>
      api<Job>(`/servers/${serverId}/actions`, { method: "POST", body, auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.server(serverId) });
      // Inventory changes after actions; the agent re-reports shortly.
      setTimeout(() => queryClient.invalidateQueries({ queryKey: serverKeys.detail(serverId) }), 4_000);
    },
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => api<Job>(`/jobs/${jobId}/cancel`, { method: "POST", auth: true }),
    onSuccess: (job) => queryClient.invalidateQueries({ queryKey: jobKeys.server(job.server_id) }),
  });
}

const PAGE = 50;

/** Audit log, newest first, paged by id. */
export function useAuditLog(actionPrefix: string) {
  return useInfiniteQuery({
    queryKey: jobKeys.audit(actionPrefix),
    enabled: useSignedIn(),
    initialPageParam: undefined as number | undefined,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(PAGE) });
      if (pageParam) params.set("before", String(pageParam));
      if (actionPrefix) params.set("action", actionPrefix);
      return api<AuditEntry[]>(`/audit-logs?${params}`, { auth: true });
    },
    getNextPageParam: (last) => (last.length === PAGE ? last[last.length - 1].id : undefined),
    refetchInterval: 15_000,
  });
}
