"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { MetricPoint, MetricsRange, ServerStatus } from "@/lib/api/servers";
import { useAuthStore } from "@/lib/stores/auth-store";

export type Severity = "critical" | "warning" | "info";

export type AlertState = "firing" | "acknowledged" | "resolved";

export type Alert = {
  id: string;
  rule_id: string;
  target_type: "server" | "application";
  target_id: string;
  target_label: string;
  severity: Severity;
  title: string;
  detail: string | null;
  value: number | null;
  state: AlertState;
  started_at: string;
  fired_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
};

export type RuleKind = "agent_offline" | "cpu_high" | "memory_high" | "disk_high" | "inode_high" | "swap_high" | "app_down";

export type AlertRule = {
  id: string;
  kind: RuleKind;
  name: string;
  threshold: number | null;
  duration_minutes: number;
  severity: Severity;
  enabled: boolean;
  notify_email: boolean;
  server_id: string | null;
  target: "server" | "application";
  metric: boolean;
};

export type Fleet = {
  servers: { id: string; name: string; status: ServerStatus; points: MetricPoint[] }[];
  firing: number;
  acknowledged: number;
};

export const monitoringKeys = {
  fleet: (range: MetricsRange) => ["monitoring", "fleet", range] as const,
  alerts: (state: string) => ["monitoring", "alerts", state] as const,
  rules: ["monitoring", "rules"] as const,
};

function useSignedIn() {
  return useAuthStore((s) => s.status === "authenticated");
}

export function useFleet(range: MetricsRange) {
  return useQuery({
    queryKey: monitoringKeys.fleet(range),
    queryFn: () => api<Fleet>(`/monitoring/fleet?range=${range}`, { auth: true }),
    enabled: useSignedIn(),
    refetchInterval: range === "1h" ? 15_000 : 60_000,
  });
}

export function useAlerts(state: "open" | "resolved" | "all" = "open") {
  return useQuery({
    queryKey: monitoringKeys.alerts(state),
    queryFn: () => api<Alert[]>(`/monitoring/alerts?state=${state}&limit=100`, { auth: true }),
    enabled: useSignedIn(),
    refetchInterval: 15_000,
  });
}

export function useAlertRules() {
  return useQuery({
    queryKey: monitoringKeys.rules,
    queryFn: () => api<AlertRule[]>("/monitoring/rules", { auth: true }),
    enabled: useSignedIn(),
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["monitoring"] });
}

export function useAcknowledge() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<Alert>(`/monitoring/alerts/${id}/acknowledge`, { method: "POST", auth: true }),
    onSuccess: invalidate,
  });
}

export function useEvaluateNow() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () => api<{ fired: number; resolved: number }>("/monitoring/evaluate", { method: "POST", auth: true }),
    onSuccess: invalidate,
  });
}

export type RuleInput = Partial<Pick<AlertRule, "name" | "threshold" | "duration_minutes" | "severity" | "enabled" | "notify_email">>;

export function useUpdateRule() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...body }: RuleInput & { id: string }) => api<AlertRule>(`/monitoring/rules/${id}`, { method: "PATCH", body, auth: true }),
    onSuccess: invalidate,
  });
}

export function useCreateRule() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: RuleInput & { kind: RuleKind; server_id?: string | null }) =>
      api<AlertRule>("/monitoring/rules", { method: "POST", body, auth: true }),
    onSuccess: invalidate,
  });
}

export function useDeleteRule() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/monitoring/rules/${id}`, { method: "DELETE", auth: true }),
    onSuccess: invalidate,
  });
}

/** Rule kinds as shown in the UI. */
export const KIND_INFO: Record<RuleKind, { label: string; describe: (r: Pick<AlertRule, "threshold" | "duration_minutes">) => string }> = {
  agent_offline: { label: "Agent offline", describe: (r) => `No heartbeat for ${r.duration_minutes} min` },
  cpu_high: { label: "CPU", describe: (r) => `CPU above ${r.threshold}% for ${r.duration_minutes} min` },
  memory_high: { label: "Memory", describe: (r) => `Memory above ${r.threshold}% for ${r.duration_minutes} min` },
  disk_high: { label: "Disk", describe: (r) => `Disk above ${r.threshold}% for ${r.duration_minutes} min` },
  inode_high: { label: "Inodes", describe: (r) => `Inodes above ${r.threshold}% for ${r.duration_minutes} min` },
  swap_high: { label: "Swap", describe: (r) => `Swap above ${r.threshold}% for ${r.duration_minutes} min` },
  app_down: { label: "Application down", describe: (r) => `Container not running for ${r.duration_minutes} min` },
};
