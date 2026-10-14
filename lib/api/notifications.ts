"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export type Notification = {
  id: string;
  kind: string;
  level: "ok" | "err" | "warn" | "info";
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
  read_at: string | null;
};

export type Inbox = { items: Notification[]; unread: number };

export type NotificationSettings = {
  email: string;
  email_deploy_success: boolean;
  email_deploy_failure: boolean;
};

export const notificationKeys = {
  inbox: ["notifications"] as const,
  settings: ["notifications", "settings"] as const,
};

function useSignedIn() {
  return useAuthStore((s) => s.status === "authenticated");
}

export function useInbox() {
  return useQuery({
    queryKey: notificationKeys.inbox,
    queryFn: () => api<Inbox>("/notifications?limit=30", { auth: true }),
    enabled: useSignedIn(),
    refetchInterval: 15_000,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    // No ids: mark everything read.
    mutationFn: (ids?: string[]) => api<void>("/notifications/read", { method: "POST", body: ids ? { ids } : {}, auth: true }),
    onMutate: (ids) => {
      // Optimistic: the dot clears immediately.
      queryClient.setQueryData<Inbox>(notificationKeys.inbox, (inbox) => {
        if (!inbox) return inbox;
        const now = new Date().toISOString();
        const items = inbox.items.map((n) => (!ids || ids.includes(n.id) ? { ...n, read_at: n.read_at ?? now } : n));
        return { items, unread: ids ? Math.max(0, inbox.unread - inbox.items.filter((n) => ids.includes(n.id) && !n.read_at).length) : 0 };
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.inbox, exact: true }),
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: notificationKeys.settings,
    queryFn: () => api<NotificationSettings>("/notifications/settings", { auth: true }),
    enabled: useSignedIn(),
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Omit<NotificationSettings, "email">>) =>
      api<NotificationSettings>("/notifications/settings", { method: "PUT", body, auth: true }),
    onSuccess: (data) => queryClient.setQueryData(notificationKeys.settings, data),
  });
}
