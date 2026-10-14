"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export type Engine = "postgres" | "mysql" | "mariadb" | "redis";

export type DbStatus = "creating" | "running" | "stopped" | "error" | "removing" | "checking";

export type DatabaseInstance = {
  id: string;
  name: string;
  engine: Engine;
  engine_label: string;
  version: string;
  mode: "managed" | "external";
  server_id: string;
  server_name: string | null;
  host: string;
  port: number;
  admin_user: string | null;
  default_database: string | null;
  local_port: number | null;
  status: DbStatus;
  error: string | null;
  server_version: string | null;
  created_by: string;
  created_at: string;
  users: number;
};

export type Login = {
  id: string | null;
  username: string | null;
  password: string | null;
  database: string | null;
  access: "admin" | "owner" | "readwrite" | "readonly";
  status: "pending" | "active";
  application_id: string | null;
  url: string;
};

export type ResultSet = { columns: string[]; rows: (string | null)[][]; truncated: boolean; duration_ms: number };

export const ENGINE_BRAND = { postgres: "PostgreSQL", mysql: "MySQL", mariadb: "MariaDB", redis: "Redis" } as const;
export const ENGINE_VERSIONS: Record<Engine, string[]> = { postgres: ["17", "16"], mysql: ["8.4"], mariadb: ["11"], redis: ["7"] };
export const DEFAULT_PORTS: Record<Engine, number> = { postgres: 5432, mysql: 3306, mariadb: 3306, redis: 6379 };

export const dbKeys = {
  all: ["databases"] as const,
  detail: (id: string) => ["databases", id] as const,
  op: (id: string, what: unknown) => ["databases", id, "op", what] as const,
  connection: (id: string) => ["databases", id, "connection"] as const,
};

function useSignedIn() {
  return useAuthStore((s) => s.status === "authenticated");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type JobReply<T> = { status: string; error: string | null; data: T | null };

/** Queue a database operation on the agent and wait for its result. */
export async function runDbJob<T>(instanceId: string, path: string, body: unknown): Promise<T> {
  const { job_id } = await api<{ job_id: string }>(`/databases/${instanceId}/${path}`, { method: "POST", body, auth: true });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    await sleep(600);
    const reply = await api<JobReply<T>>(`/databases/${instanceId}/jobs/${job_id}`, { auth: true });
    if (reply.status === "succeeded") return reply.data as T;
    if (reply.status !== "queued" && reply.status !== "running") {
      throw new ApiError(400, reply.error ?? (reply.status === "expired" ? "The server's agent didn't pick this up. Is it online?" : `The operation ${reply.status}`));
    }
  }
  throw new ApiError(504, "The agent didn't answer in time. Is the server online?");
}

/** Wait for any queued job (create, admin actions) to finish. */
export async function waitForJob(instanceId: string, jobId: string, timeoutMs = 20 * 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(1200);
    const reply = await api<JobReply<unknown>>(`/databases/${instanceId}/jobs/${jobId}`, { auth: true });
    if (reply.status === "succeeded") return;
    if (reply.status !== "queued" && reply.status !== "running") throw new ApiError(400, reply.error ?? `The operation ${reply.status}`);
  }
  throw new ApiError(504, "Still running; check back in a moment.");
}

export function useDatabases() {
  return useQuery({
    queryKey: dbKeys.all,
    queryFn: () => api<DatabaseInstance[]>("/databases", { auth: true }),
    enabled: useSignedIn(),
    refetchInterval: (q) => (q.state.data?.some((d) => ["creating", "removing", "checking"].includes(d.status)) ? 2_000 : 15_000),
  });
}

export function useDatabase(id: string | undefined) {
  return useQuery({
    queryKey: dbKeys.detail(id ?? ""),
    queryFn: () => api<DatabaseInstance>(`/databases/${id}`, { auth: true }),
    enabled: useSignedIn() && !!id,
    refetchInterval: (q) => (["creating", "removing", "checking"].includes(q.state.data?.status ?? "") ? 2_000 : 15_000),
  });
}

/** A read-only operation (stats, browsing), cached briefly. */
export function useDbRead<T>(instance: DatabaseInstance | undefined, path: "explore" | "redis", body: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: dbKeys.op(instance?.id ?? "", { path, ...body }),
    queryFn: () => runDbJob<T>(instance!.id, path, body),
    enabled: useSignedIn() && !!instance && instance.status === "running" && enabled,
    staleTime: 15_000,
    retry: false,
  });
}

export function useConnection(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: dbKeys.connection(id ?? ""),
    queryFn: () => api<{ logins: Login[]; local_url: string | null }>(`/databases/${id}/connection`, { auth: true }),
    enabled: useSignedIn() && !!id && enabled,
  });
}

export function useCreateDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mode, ...body }: { mode: "managed" | "external" } & Record<string, unknown>) =>
      api<{ database: DatabaseInstance; job_id: string }>(mode === "managed" ? "/databases" : "/databases/external", { method: "POST", body, auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dbKeys.all }),
  });
}

/** Admin actions (users, databases, control, attach): queue, then wait. */
export function useDbAction(instanceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ method = "POST", path, body }: { method?: "POST" | "DELETE"; path: string; body?: unknown }) => {
      const reply = await api<{ job_id: string | null }>(`/databases/${instanceId}/${path}`, { method, body, auth: true });
      if (reply.job_id) await waitForJob(instanceId, reply.job_id);
      return reply;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: dbKeys.detail(instanceId) }),
  });
}

export function useRemoveDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deleteData }: { id: string; deleteData: boolean }) =>
      api<{ job_id: string | null }>(`/databases/${id}?delete_data=${deleteData}`, { method: "DELETE", auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dbKeys.all }),
  });
}
