"use client";

import { Icon, type IconName } from "@/components/icons";
import { Badge, Button, FormCard } from "@/components/ui";
import { useRevokeOtherSessions, useRevokeSession, useSessions } from "@/lib/api/auth";

function describe(ua: string | null): { label: string; icon: IconName } {
  if (!ua) return { label: "Unknown device", icon: "monitor" };
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : /curl|python|httpx/i.test(ua) ? "API client" : "Browser";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return { label: os ? `${browser} on ${os}` : browser, icon: /iPhone|Android/.test(ua) ? "monitor" : "monitor" };
}

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function SessionsCard() {
  const sessions = useSessions();
  const revoke = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const others = sessions.data?.filter((s) => !s.current).length ?? 0;

  return (
    <FormCard
      title="Sessions"
      description="Devices signed in to this control plane. Revoking a session signs that device out immediately."
      footer={revokeOthers.data?.message ?? (sessions.data ? `${sessions.data.length} active` : undefined)}
      action={
        <Button variant="secondary" size="sm" disabled={others === 0 || revokeOthers.isPending} onClick={() => revokeOthers.mutate()}>
          {revokeOthers.isPending ? "Signing out…" : "Revoke All Others"}
        </Button>
      }
    >
      <div className="overflow-hidden rounded-md border border-line">
        {sessions.isLoading &&
          [0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
              <span className="skeleton size-4 rounded" />
              <span className="skeleton h-4 w-48 rounded" />
            </div>
          ))}
        {sessions.error && <p className="px-4 py-3 text-sm text-err">{sessions.error.message}</p>}
        {sessions.data?.map((s) => {
          const d = describe(s.user_agent);
          return (
            <div key={s.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
              <Icon name={d.icon} className="text-muted" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  {d.label} {s.current && <Badge tone="ok">This device</Badge>}
                </div>
                <div className="truncate text-xs text-subtle">
                  {s.ip_address ?? "Unknown IP"} · signed in {ago(s.created_at)} · active {ago(s.last_used_at)}
                </div>
              </div>
              {!s.current && (
                <Button variant="ghost" size="xs" disabled={revoke.isPending && revoke.variables === s.id} onClick={() => revoke.mutate(s.id)}>
                  Revoke
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </FormCard>
  );
}
