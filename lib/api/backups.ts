"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api } from "@/lib/api/client";
import type { Engine } from "@/lib/api/databases";
import { useAuthStore } from "@/lib/stores/auth-store";

export type BackupRun = {
  id: string;
  instance_id: string;
  instance_name: string | null;
  engine: Engine | null;
  database: string;
  trigger: "scheduled" | "manual";
  status: "queued" | "running" | "succeeded" | "failed";
  size: number | null;
  sha256: string | null;
  local: boolean;
  remote: boolean;
  error: string | null;
  verify_status: "passed" | "failed" | "running" | null;
  verify_detail: string | null;
  verified_at: string | null;
  created_by: string;
  created_at: string;
  finished_at: string | null;
};

export type Policy = {
  instance_id: string;
  instance_name: string;
  engine: Engine;
  status: string;
  enabled: boolean;
  every_hours: number;
  keep: number;
  databases: string[];
  next_run_at: string | null;
};

export type BackupSettings = {
  storage_enabled: boolean;
  endpoint: string | null;
  region: string | null;
  bucket: string | null;
  prefix: string | null;
  has_credentials: boolean;
  keep_local: boolean;
  updated_at: string | null;
};

export type BackupSummary = { size: number; count: number; failed_24h: number; verified: number };

function useSignedIn() {
  return useAuthStore((s) => s.status === "authenticated");
}

const PAGE = 30;
const busy = (runs: BackupRun[] | undefined) => runs?.some((r) => r.status === "queued" || r.status === "running" || r.verify_status === "running");

export function useBackupRuns(instanceId?: string) {
  return useInfiniteQuery({
    queryKey: ["backups", "runs", instanceId ?? "all"],
    enabled: useSignedIn(),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(PAGE) });
      if (pageParam) params.set("before", pageParam);
      if (instanceId) params.set("instance_id", instanceId);
      return api<BackupRun[]>(`/backups?${params}`, { auth: true });
    },
    getNextPageParam: (last) => (last.length === PAGE ? last[last.length - 1].id : undefined),
    refetchInterval: (q) => (busy(q.state.data?.pages[0]) ? 2_000 : 20_000),
  });
}

export function useBackupSummary() {
  return useQuery({ queryKey: ["backups", "summary"], queryFn: () => api<BackupSummary>("/backups/summary", { auth: true }), enabled: useSignedIn(), refetchInterval: 30_000 });
}

export function usePolicies() {
  return useQuery({ queryKey: ["backups", "policies"], queryFn: () => api<Policy[]>("/backups/policies", { auth: true }), enabled: useSignedIn() });
}

export function useBackupSettings() {
  return useQuery({ queryKey: ["backups", "settings"], queryFn: () => api<BackupSettings>("/backups/settings", { auth: true }), enabled: useSignedIn() });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["backups"] });
}

export function useSetPolicy() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ instance_id, ...body }: Partial<Policy> & { instance_id: string }) =>
      api(`/backups/policies/${instance_id}`, { method: "PUT", body, auth: true }),
    onSuccess: invalidate,
  });
}

export function useRunBackup() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: { instance_id: string; database?: string }) => api<BackupRun[]>("/backups/run", { method: "POST", body, auth: true }),
    onSuccess: invalidate,
  });
}

export function useBackupAction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ run, action, body }: { run: string; action: "verify" | "restore" | "delete"; body?: unknown }): Promise<{ job_id: string | null }> => {
      if (action === "delete") {
        await api<void>(`/backups/${run}`, { method: "DELETE", auth: true });
        return { job_id: null };
      }
      return api<{ job_id: string }>(`/backups/${run}/${action}`, { method: "POST", body, auth: true });
    },
    onSuccess: invalidate,
  });
}

export function useSaveBackupSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<BackupSettings> & { access_key?: string; secret_key?: string }) => api<BackupSettings>("/backups/settings", { method: "PUT", body, auth: true }),
    onSuccess: (data) => queryClient.setQueryData(["backups", "settings"], data),
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Wait for a backup job (restore, storage test) and return its result. */
export async function waitForBackupJob(jobId: string, timeoutMs = 3 * 3600_000): Promise<Record<string, unknown>> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(1500);
    const reply = await api<{ status: string; error: string | null; result: Record<string, unknown> }>(`/backups/jobs/${jobId}`, { auth: true });
    if (reply.status === "succeeded") return reply.result;
    if (reply.status !== "queued" && reply.status !== "running") throw new ApiError(400, reply.error ?? `The job ${reply.status}`);
  }
  throw new ApiError(504, "Still running; check back later.");
}
