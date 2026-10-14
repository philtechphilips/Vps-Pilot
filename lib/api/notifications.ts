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
  email_alerts: boolean;
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

/* Alert channels (shared by all admins) */

export type ChannelKind = "webhook" | "slack" | "telegram";
export type ChannelEvent = "alert.firing" | "alert.resolved" | "deployment.failed" | "deployment.succeeded";

export type AlertChannel = {
  id: string;
  kind: ChannelKind;
  name: string;
  target_label: string;
  events: ChannelEvent[];
  enabled: boolean;
  created_by: string;
  created_at: string;
  last_sent_at: string | null;
  last_error: string | null;
};

export type ChannelConfig = { url?: string; bot_token?: string; chat_id?: string };

const channelKey = ["notifications", "channels"] as const;

export function useAlertChannels() {
  return useQuery({
    queryKey: channelKey,
    queryFn: () => api<AlertChannel[]>("/notifications/channels", { auth: true }),
    enabled: useSignedIn(),
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { kind: ChannelKind; name: string; config: ChannelConfig; events: ChannelEvent[] }) =>
      api<{ channel: AlertChannel; secret: string | null }>("/notifications/channels", { method: "POST", body, auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: channelKey }),
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; enabled?: boolean; events?: ChannelEvent[]; name?: string; config?: ChannelConfig }) =>
      api<AlertChannel>(`/notifications/channels/${id}`, { method: "PATCH", body, auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: channelKey }),
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/notifications/channels/${id}`, { method: "DELETE", auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: channelKey }),
  });
}

export function useTestChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<AlertChannel>(`/notifications/channels/${id}/test`, { method: "POST", auth: true }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: channelKey }),
  });
}
