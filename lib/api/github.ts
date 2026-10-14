"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export type GitHubInstallation = {
  id: number;
  account_login: string;
  account_type: string;
  account_avatar_url: string | null;
  repository_selection: "all" | "selected";
  suspended: boolean;
};

export type GitHubStatus = {
  connected: boolean;
  webhooks_available: boolean;
  app: {
    name: string;
    slug: string;
    owner_login: string;
    owner_type: string;
    html_url: string;
    install_url: string;
    webhook_url: string | null;
    created_at: string;
  } | null;
  installations: GitHubInstallation[];
};

export type GitHubRepo = {
  id: number;
  installation_id: number;
  full_name: string;
  name: string;
  owner: string;
  private: boolean;
  default_branch: string;
  html_url: string;
  clone_url: string;
  description: string | null;
  language: string | null;
  pushed_at: string | null;
};

export const githubKeys = {
  status: ["github", "status"] as const,
  repos: ["github", "repos"] as const,
  branches: (installationId: number, repoId: number) => ["github", "branches", installationId, repoId] as const,
};

function useSignedIn() {
  return useAuthStore((s) => s.status === "authenticated");
}

export function useGitHubStatus(refresh = false) {
  return useQuery({
    queryKey: githubKeys.status,
    queryFn: () => api<GitHubStatus>(`/github/status${refresh ? "?refresh=true" : ""}`, { auth: true }),
    enabled: useSignedIn(),
    staleTime: 30_000,
  });
}

export function useGitHubRepos(enabled: boolean) {
  return useQuery({
    queryKey: githubKeys.repos,
    queryFn: () => api<GitHubRepo[]>("/github/repositories", { auth: true }),
    enabled: useSignedIn() && enabled,
    staleTime: 60_000,
  });
}

export function useGitHubBranches(installationId: number | undefined, repoId: number | undefined) {
  return useQuery({
    queryKey: githubKeys.branches(installationId ?? 0, repoId ?? 0),
    queryFn: () => api<string[]>(`/github/repositories/${installationId}/${repoId}/branches`, { auth: true }),
    enabled: useSignedIn() && !!installationId && !!repoId,
    staleTime: 60_000,
  });
}

/** Start connecting: get the manifest, then post it to GitHub in a real form
 * submission (GitHub's manifest flow requires a browser POST). */
export function useStartGitHubConnect() {
  return useMutation({
    mutationFn: (organization: string | null) =>
      api<{ post_url: string; manifest: Record<string, unknown>; webhooks: boolean }>("/github/manifest", {
        method: "POST",
        body: { organization },
        auth: true,
      }),
    onSuccess: ({ post_url, manifest }) => {
      const form = document.createElement("form");
      form.method = "post";
      form.action = post_url;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "manifest";
      input.value = JSON.stringify(manifest);
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    },
  });
}

export function useCompleteGitHubConnect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { code: string; state: string }) =>
      api<GitHubStatus>("/github/manifest/complete", { method: "POST", body, auth: true }),
    onSuccess: (status) => queryClient.setQueryData(githubKeys.status, status),
  });
}

export function useRegisterInstallation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (installationId: number) =>
      api<GitHubStatus>("/github/installations", { method: "POST", body: { installation_id: installationId }, auth: true }),
    onSuccess: (status) => {
      queryClient.setQueryData(githubKeys.status, status);
      queryClient.invalidateQueries({ queryKey: githubKeys.repos });
    },
  });
}

export function useDisconnectGitHub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>("/github/app", { method: "DELETE", auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github"] });
    },
  });
}
