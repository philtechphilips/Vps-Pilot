"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export type CronJob = {
  id: string;
  name: string;
  schedule: string;
  timezone: string;
  command: string;
  enabled: boolean;
  timeout_minutes: number;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: "running" | "succeeded" | "failed" | "skipped" | null;
  last_error: string | null;
  last_job_id: string | null;
  created_at: string;
};

export type CronInput = Pick<CronJob, "name" | "schedule" | "timezone" | "command" | "enabled" | "timeout_minutes">;

export const SCHEDULE_PRESETS = [
  { value: "*/15 * * * *", label: "Every 15 minutes" },
  { value: "@hourly", label: "Every hour" },
  { value: "0 2 * * *", label: "Every day at 02:00" },
  { value: "0 3 * * 0", label: "Every Sunday at 03:00" },
  { value: "0 4 1 * *", label: "On the 1st of every month" },
];

const key = (appId: string) => ["apps", appId, "cron"] as const;

export function useCronJobs(appId: string) {
  const signedIn = useAuthStore((s) => s.status === "authenticated");
  return useQuery({
    queryKey: key(appId),
    queryFn: () => api<CronJob[]>(`/applications/${appId}/cron`, { auth: true }),
    enabled: signedIn,
    refetchInterval: (q) => (q.state.data?.some((j) => j.last_status === "running") ? 3_000 : 30_000),
  });
}

export function useSaveCronJob(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<CronInput> & { id?: string }) =>
      id
        ? api<CronJob>(`/applications/${appId}/cron/${id}`, { method: "PATCH", body, auth: true })
        : api<CronJob>(`/applications/${appId}/cron`, { method: "POST", body, auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(appId) }),
  });
}

export function useDeleteCronJob(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/applications/${appId}/cron/${id}`, { method: "DELETE", auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(appId) }),
  });
}

/** A one-off command inside the app; returns the job to follow. */
export function useRunCommand(appId: string) {
  return useMutation({
    mutationFn: (body: { command: string; timeout_minutes?: number }) =>
      api<{ job_id: string }>(`/applications/${appId}/run`, { method: "POST", body, auth: true }),
  });
}

export function useRunCronJob(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ job_id: string }>(`/applications/${appId}/cron/${id}/run`, { method: "POST", auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(appId) }),
  });
}
