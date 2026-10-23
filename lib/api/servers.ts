"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export type ServerStatus = "pending" | "online" | "offline" | "revoked";

export type MetricsSnapshot = {
  ts: string;
  cpu_percent: number;
  memory_percent: number;
  memory_used: number;
  swap_percent: number;
  disk_percent: number;
  disk_used: number;
  inode_percent: number | null;
  load_1: number;
  load_5: number;
  load_15: number;
  net_rx_bps: number;
  net_tx_bps: number;
};

export type ServerSummary = {
  id: string;
  name: string;
  tags: string[];
  status: ServerStatus;
  is_control_plane: boolean;
  hostname: string | null;
  os_name: string | null;
  os_version: string | null;
  arch: string | null;
  cpu_count: number | null;
  memory_total: number | null;
  disk_total: number | null;
  ip_addresses: string[];
  agent_version: string | null;
  last_heartbeat_at: string | null;
  enrolled_at: string | null;
  created_at: string;
  latest: MetricsSnapshot | null;
};

export type InventoryService = { name: string; active: string; sub: string; description: string };
export type InventoryContainer = { id: string; name: string; image: string; state: string; status: string; ports: string };

export type ServerUpdates = {
  total: number;
  security: number;
  packages: { name: string; version: string; security: boolean }[];
  reboot_required: boolean;
  checked_at: number;
};

export type ServerDetail = ServerSummary & {
  kernel: string | null;
  uptime_seconds: number | null;
  capabilities: Record<string, boolean | string>;
  inventory: {
    services?: InventoryService[];
    containers?: InventoryContainer[];
    runtimes?: Record<string, string | null>;
    docker_access?: boolean;
    updates?: ServerUpdates | null;
  };
  inventory_at: string | null;
  agent_token_rotated_at: string | null;
  revoked_at: string | null;
};

export type Enrollment = { server: ServerSummary; token: string; install_command: string; expires_at: string };

export type MetricPoint = {
  ts: string;
  cpu_percent: number;
  memory_percent: number;
  swap_percent: number;
  disk_percent: number;
  load_1: number;
  net_rx_bps: number;
  net_tx_bps: number;
};

export type MetricsRange = "1h" | "24h" | "7d" | "30d" | "90d";

export const serverKeys = {
  all: ["servers"] as const,
  detail: (id: string) => ["servers", id] as const,
  metrics: (id: string, range: MetricsRange) => ["servers", id, "metrics", range] as const,
};

function useSignedIn() {
  return useAuthStore((s) => s.status === "authenticated");
}

/** Live fleet list; polls so status and metrics stay fresh. */
export function useServers() {
  return useQuery({
    queryKey: serverKeys.all,
    queryFn: () => api<ServerSummary[]>("/servers", { auth: true }),
    enabled: useSignedIn(),
    refetchInterval: 5_000,
  });
}

export function useServer(id: string | undefined) {
  return useQuery({
    queryKey: serverKeys.detail(id ?? ""),
    queryFn: () => api<ServerDetail>(`/servers/${id}`, { auth: true }),
    enabled: useSignedIn() && !!id,
    refetchInterval: 5_000,
  });
}

export function useServerMetrics(id: string | undefined, range: MetricsRange = "1h") {
  return useQuery({
    queryKey: serverKeys.metrics(id ?? "", range),
    queryFn: () => api<MetricPoint[]>(`/servers/${id}/metrics?range=${range}`, { auth: true }),
    enabled: useSignedIn() && !!id,
    refetchInterval: range === "1h" ? 15_000 : 60_000,
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; tags: string[] }) =>
      api<Enrollment>("/servers/enrollments", { method: "POST", body, auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serverKeys.all }),
  });
}

export function useReissueEnrollment() {
  return useMutation({
    mutationFn: (id: string) => api<Enrollment>(`/servers/${id}/enrollments`, { method: "POST", auth: true }),
  });
}

export function useRevokeServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<ServerDetail>(`/servers/${id}/revoke`, { method: "POST", auth: true }),
    onSuccess: (server) => {
      queryClient.setQueryData(serverKeys.detail(server.id), server);
      queryClient.invalidateQueries({ queryKey: serverKeys.all });
    },
  });
}

export function useDeleteServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/servers/${id}`, { method: "DELETE", auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serverKeys.all }),
  });
}
