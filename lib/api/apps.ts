"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export type DeploymentStatus = "queued" | "running" | "succeeded" | "failed" | "canceled";

export type Deployment = {
  id: string;
  application_id: string;
  server_id: string;
  job_id: string | null;
  status: DeploymentStatus;
  trigger: "create" | "manual" | "rollback" | "push";
  requested_ref: string | null;
  commit_sha: string | null;
  commit_message: string | null;
  image_ref: string | null;
  rollback_of: string | null;
  error: string | null;
  created_by: string;
  created_at: string;
  finished_at: string | null;
  app_name: string | null;
  is_current: boolean;
};

export type DeploymentEvent = { level: "info" | "warn" | "error"; message: string; created_at: string };

export type DeploymentDetail = Deployment & {
  spec: Record<string, unknown>;
  output: string | null;
  events: DeploymentEvent[];
};

export type EnvVar = { key: string; secret: boolean; value: string | null };

/** docker: a container; systemd: a native Node.js/Python release; compose: the repo's compose file. */
export type Runtime = "docker" | "systemd" | "compose";

export const runtimeLabel: Record<Runtime, string> = { docker: "Docker", systemd: "systemd", compose: "Compose" };

export type App = {
  id: string;
  name: string;
  server_id: string;
  server_name: string | null;
  runtime: Runtime;
  source_type: "git" | "image";
  repo_url: string | null;
  github_repo: string | null;
  auto_deploy: boolean;
  branch: string | null;
  image: string | null;
  dockerfile: string;
  build_context: string;
  build_command: string | null;
  start_command: string | null;
  compose_file: string | null;
  compose_service: string | null;
  container_port: number;
  host_port: number;
  health_path: string;
  health_timeout_seconds: number;
  cpu_limit: string | null;
  memory_limit: string | null;
  /** Docker apps: folder inside the container kept across deploys (and backed up). */
  data_path: string | null;
  /** Runs with the new version before it takes traffic (e.g. migrations). */
  release_command: string | null;
  /** Docker/Compose: host port on 127.0.0.1 only (reachable through domains). */
  private_port: boolean;
  /** Error lines containing any of these aren't counted for alerts. */
  error_ignore: string[];
  env: EnvVar[];
  /** Previews: pr-<n>.<preview_domain>, with preview_env overriding env. */
  preview_domain: string | null;
  preview_env: EnvVar[];
  /** Set on a preview: the app it previews and its pull request. */
  preview_of: string | null;
  preview_pr: number | null;
  previews: { id: string; name: string; pr: number }[];
  current_deployment: Deployment | null;
  latest_deployment: Deployment | null;
  created_at: string;
};

/** What the API accepts for env: a secret sent without a value keeps its stored one. */
export type EnvInput = { key: string; value?: string | null; secret: boolean };

export type AppCreate = {
  name: string;
  server_id: string;
  source:
    | { type: "git"; url: string; branch: string }
    | { type: "git"; branch: string; installation_id: number; repo_id: number }
    | { type: "image"; image: string };
  auto_deploy?: boolean;
  runtime?: Runtime;
  compose_file?: string | null;
  compose_service?: string | null;
  dockerfile?: string;
  build_context?: string;
  build_command?: string | null;
  start_command?: string | null;
  container_port: number;
  host_port?: number | null;
  health_path?: string;
  health_timeout_seconds?: number;
  cpu_limit?: string | null;
  memory_limit?: string | null;
  env: EnvInput[];
};

export type AppUpdate = Partial<
  Pick<
    App,
    | "branch"
    | "image"
    | "dockerfile"
    | "build_context"
    | "build_command"
    | "start_command"
    | "compose_file"
    | "compose_service"
    | "container_port"
    | "host_port"
    | "health_path"
    | "health_timeout_seconds"
    | "cpu_limit"
    | "memory_limit"
    | "data_path"
    | "error_ignore"
    | "release_command"
    | "private_port"
  >
> & { env?: EnvInput[]; auto_deploy?: boolean; preview_domain?: string; preview_env?: EnvInput[] };

export const isDeploying = (s: DeploymentStatus | undefined) => s === "queued" || s === "running";

export const appKeys = {
  all: ["apps"] as const,
  detail: (id: string) => ["apps", id] as const,
  deployments: (appId: string) => ["apps", appId, "deployments"] as const,
  allDeployments: ["deployments"] as const,
  deployment: (id: string) => ["deployments", id] as const,
};

function useSignedIn() {
  return useAuthStore((s) => s.status === "authenticated");
}

const busy = (apps: App[] | undefined) => apps?.some((a) => isDeploying(a.latest_deployment?.status));

export function useApps() {
  return useQuery({
    queryKey: appKeys.all,
    queryFn: () => api<App[]>("/applications", { auth: true }),
    enabled: useSignedIn(),
    refetchInterval: (q) => (busy(q.state.data) ? 2_000 : 15_000),
  });
}

export function useApp(id: string | undefined) {
  return useQuery({
    queryKey: appKeys.detail(id ?? ""),
    queryFn: () => api<App>(`/applications/${id}`, { auth: true }),
    enabled: useSignedIn() && !!id,
    refetchInterval: (q) => (isDeploying(q.state.data?.latest_deployment?.status) ? 2_000 : 15_000),
  });
}

export function useAppDeployments(appId: string | undefined) {
  return useQuery({
    queryKey: appKeys.deployments(appId ?? ""),
    queryFn: () => api<Deployment[]>(`/applications/${appId}/deployments?limit=30`, { auth: true }),
    enabled: useSignedIn() && !!appId,
    refetchInterval: (q) => (q.state.data?.some((d) => isDeploying(d.status)) ? 2_000 : 15_000),
  });
}

export function useDeployments(limit = 50) {
  return useQuery({
    queryKey: [...appKeys.allDeployments, limit],
    queryFn: () => api<Deployment[]>(`/deployments?limit=${limit}`, { auth: true }),
    enabled: useSignedIn(),
    refetchInterval: (q) => (q.state.data?.some((d) => isDeploying(d.status)) ? 2_000 : 15_000),
  });
}

const DEPLOYMENTS_PAGE = 30;

/** All deployments (optionally one app's), newest first, page by page. */
export function useDeploymentPages(appId: string | null) {
  return useInfiniteQuery({
    queryKey: [...appKeys.allDeployments, "pages", appId ?? "all"],
    enabled: useSignedIn(),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(DEPLOYMENTS_PAGE) });
      if (pageParam) params.set("before", pageParam);
      if (appId) params.set("app_id", appId);
      return api<Deployment[]>(`/deployments?${params}`, { auth: true });
    },
    getNextPageParam: (last) => (last.length === DEPLOYMENTS_PAGE ? last[last.length - 1].id : undefined),
    // Keep statuses fresh while something is building (first page only).
    refetchInterval: (q) => (q.state.data?.pages[0]?.some((d) => isDeploying(d.status)) ? 3_000 : 20_000),
  });
}

/** One deployment with its log; polls quickly while it runs. */
export function useDeployment(id: string | undefined) {
  return useQuery({
    queryKey: appKeys.deployment(id ?? ""),
    queryFn: () => api<DeploymentDetail>(`/deployments/${id}`, { auth: true }),
    enabled: useSignedIn() && !!id,
    refetchInterval: (q) => (!q.state.data || isDeploying(q.state.data.status) ? 1_500 : false),
  });
}

function useInvalidateApps() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: appKeys.all });
    queryClient.invalidateQueries({ queryKey: appKeys.allDeployments });
  };
}

export function useCreateApp() {
  const invalidate = useInvalidateApps();
  return useMutation({
    mutationFn: (body: AppCreate) => api<App>("/applications", { method: "POST", body, auth: true }),
    onSuccess: invalidate,
  });
}

export function useUpdateApp(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AppUpdate) => api<App>(`/applications/${id}`, { method: "PATCH", body, auth: true }),
    onSuccess: (app) => {
      queryClient.setQueryData(appKeys.detail(id), app);
      queryClient.invalidateQueries({ queryKey: appKeys.all, exact: true });
    },
  });
}

export function useDeleteApp() {
  const invalidate = useInvalidateApps();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/applications/${id}`, { method: "DELETE", auth: true }),
    onSuccess: invalidate,
  });
}

export function useDeploy(appId: string) {
  const invalidate = useInvalidateApps();
  return useMutation({
    mutationFn: (ref?: string) =>
      api<Deployment>(`/applications/${appId}/deployments`, { method: "POST", body: ref ? { ref } : {}, auth: true }),
    onSuccess: invalidate,
  });
}

export function useRollback() {
  const invalidate = useInvalidateApps();
  return useMutation({
    mutationFn: (deploymentId: string) =>
      api<Deployment>(`/deployments/${deploymentId}/rollback`, { method: "POST", auth: true }),
    onSuccess: invalidate,
  });
}

export type TrafficRange = "1h" | "24h" | "7d";

export type Traffic = {
  points: { ts: string; requests: number; s4xx: number; s5xx: number; p95_ms: number; bytes: number }[];
  totals: { requests: number; s2xx: number; s3xx: number; s4xx: number; s5xx: number; bytes: number; per_minute: number; error_rate: number; p95_ms: number | null };
  hosts: string[];
};

/** Requests through the app's domains, from the proxy's access log. */
export function useAppTraffic(appId: string | undefined, range: TrafficRange) {
  return useQuery({
    queryKey: ["applications", appId, "traffic", range],
    queryFn: () => api<Traffic>(`/applications/${appId}/requests?range=${range}`, { auth: true }),
    enabled: useSignedIn() && !!appId,
    refetchInterval: 60_000,
  });
}

export type Usage = {
  range: TrafficRange;
  points: { ts: string; cpu_percent: number | null; memory_bytes: number | null }[];
  cpu_percent: number | null;
  memory_bytes: number | null;
  peak_memory_bytes: number | null;
  memory_limit: string | null;
};

/** The app's CPU and memory over time (reported once a minute). */
export function useAppUsage(appId: string | undefined, range: TrafficRange) {
  return useQuery({
    queryKey: ["applications", appId, "usage", range],
    queryFn: () => api<Usage>(`/applications/${appId}/usage?range=${range}`, { auth: true }),
    enabled: useSignedIn() && !!appId,
    refetchInterval: 60_000,
  });
}

export type ErrorGroup = {
  id: string;
  fingerprint: string;
  sample: string;
  total: number;
  today: number;
  days: number[];
  first_seen: string;
  last_seen: string;
  ignored: boolean;
};

/** The app's errors grouped by cause, most recent first. */
export function useErrorGroups(appId: string | undefined) {
  return useQuery({
    queryKey: ["applications", appId, "errors"],
    queryFn: () => api<ErrorGroup[]>(`/applications/${appId}/errors`, { auth: true }),
    enabled: useSignedIn() && !!appId,
    refetchInterval: 60_000,
  });
}

export function useIgnoreError(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ignored }: { id: string; ignored: boolean }) =>
      api<{ ignored: boolean }>(`/applications/${appId}/errors/${id}/ignore?ignored=${ignored}`, { method: "POST", auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications", appId, "errors"] }),
  });
}

export type AppMove = {
  id: string;
  status: "running" | "waiting_dns" | "done" | "failed" | "canceled";
  step: "files" | "databases" | "deploy" | "restore" | "domains" | "dns" | "finished";
  include_files: boolean;
  source_server: string | null;
  target_server: string | null;
  target_ips: string[];
  databases: { from: string; to: string | null; engine: string; stage: string }[];
  error: string | null;
  created_at: string;
  finished_at: string | null;
};

export type MoveInfo = {
  plan: { databases: { name: string; engine: string }[]; files: boolean; storage: boolean };
  move: AppMove | null;
};

export function useAppMove(appId: string) {
  return useQuery({
    queryKey: ["applications", appId, "move"],
    queryFn: () => api<MoveInfo>(`/applications/${appId}/move`, { auth: true }),
    enabled: useSignedIn(),
    refetchInterval: (q) => (q.state.data?.move?.status === "running" ? 3_000 : q.state.data?.move?.status === "waiting_dns" ? 20_000 : false),
  });
}

export function useMoveAction(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, body }: { action: "start" | "finish" | "cancel"; body?: { server_id: string; include_files: boolean } }) =>
      api<AppMove>(`/applications/${appId}/move${action === "start" ? "" : `/${action}`}`, { method: "POST", body, auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", appId] });
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
  });
}
