"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AuthResponse, Challenge, LoginResult, Message, SessionInfo, User } from "@/lib/api/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useChallengeStore } from "@/lib/stores/challenge-store";

export const authKeys = {
  setupStatus: ["auth", "setup-status"] as const,
  me: ["auth", "me"] as const,
  sessions: ["auth", "sessions"] as const,
};

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

export function useSetupStatus() {
  return useQuery({
    queryKey: authKeys.setupStatus,
    queryFn: () => api<{ needs_setup: boolean }>("/auth/setup-status"),
    staleTime: 30_000,
  });
}

export function useMe() {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const user = await api<User>("/auth/me", { auth: true });
      useAuthStore.getState().setUser(user);
      return user;
    },
    enabled: status === "authenticated",
  });
}

export function useSessions() {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: authKeys.sessions,
    queryFn: () => api<SessionInfo[]>("/auth/sessions", { auth: true }),
    enabled: status === "authenticated",
  });
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

/** Stores a successful sign-in and clears any pending challenge. */
function useCompleteSignIn() {
  const queryClient = useQueryClient();
  return (auth: AuthResponse) => {
    useAuthStore.getState().setSession(auth);
    useChallengeStore.getState().reset();
    queryClient.setQueryData(authKeys.me, auth.user);
    queryClient.setQueryData(authKeys.setupStatus, { needs_setup: false });
  };
}

export function useSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; email: string; password: string }) =>
      api<Challenge>("/auth/setup", { method: "POST", body }),
    onSuccess: (challenge) => {
      useChallengeStore.getState().setChallenge(challenge);
      queryClient.setQueryData(authKeys.setupStatus, { needs_setup: false });
    },
  });
}

export function useLogin() {
  const complete = useCompleteSignIn();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) => api<LoginResult>("/auth/login", { method: "POST", body }),
    onSuccess: (result) => {
      if (result.status === "authenticated") complete(result);
      else useChallengeStore.getState().setChallenge(result);
    },
  });
}

export function useVerifyCode() {
  const complete = useCompleteSignIn();
  return useMutation({
    mutationFn: (body: { challenge_id: string; code: string }) =>
      api<AuthResponse>("/auth/2fa/verify", { method: "POST", body }),
    onSuccess: complete,
  });
}

export function useResendCode() {
  return useMutation({
    mutationFn: (challenge_id: string) => api<Challenge>("/auth/2fa/resend", { method: "POST", body: { challenge_id } }),
    onSuccess: (challenge) => useChallengeStore.getState().setChallenge(challenge),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>("/auth/logout", { method: "POST" }),
    onSettled: () => {
      useAuthStore.getState().clear();
      queryClient.removeQueries({ queryKey: ["auth"] });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => api<Message>("/auth/forgot-password", { method: "POST", body: { email } }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (body: { token: string; new_password: string }) =>
      api<Message>("/auth/reset-password", { method: "POST", body }),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/auth/sessions/${id}`, { method: "DELETE", auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.sessions }),
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<Message>("/auth/sessions/revoke-others", { method: "POST", auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.sessions }),
  });
}
