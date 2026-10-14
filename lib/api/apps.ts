"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export type App = {
  id: string;
  name: string;
  server_id: string;
  server_name: string | null;
  runtime: string;
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
  container_port: number;
  host_port: number;
  health_path: string;
  health_timeout_seconds: number;
  cpu_limit: string | null;
  memory_limit: string | null;
  env: EnvVar[];
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
    | "container_port"
    | "host_port"
    | "health_path"
    | "health_timeout_seconds"
    | "cpu_limit"
    | "memory_limit"
  >
> & { env?: EnvInput[]; auto_deploy?: boolean };

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
