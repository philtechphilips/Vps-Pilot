"use client";

import Link from "next/link";
import { Sparkline } from "@/components/charts";
import { Icon } from "@/components/icons";
import { Badge, Dot, Meter, type Tone } from "@/components/ui";
import { type ServerStatus, type ServerSummary, useServerMetrics } from "@/lib/api/servers";
import { formatBytes, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const statusTone: Record<ServerStatus, Tone> = {
  online: "ok",
  offline: "err",
  pending: "blue",
  revoked: "neutral",
};

export const statusLabel: Record<ServerStatus, string> = {
  online: "Online",
  offline: "Offline",
  pending: "Waiting for agent",
  revoked: "Revoked",
};

export function StatusPill({ status, className }: { status: ServerStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted", className)}>
      <Dot tone={statusTone[status]} pulse={status === "online" || status === "pending"} />
      {statusLabel[status]}
    </span>
  );
}

export function osLabel(s: Pick<ServerSummary, "os_name" | "os_version">) {
  if (!s.os_name) return "Unknown OS";
  const version = s.os_version?.replace(/\s*\(.*\)\s*$/, "") ?? "";
  return `${s.os_name} ${version}`.trim();
}

/** Grid card for one live server, with a CPU sparkline from the last hour. */
export function LiveServerCard({ server }: { server: ServerSummary }) {
  const metrics = useServerMetrics(server.status === "pending" ? undefined : server.id, "1h");
  const latest = server.latest;
  const live = server.status === "online";
  const cpu = metrics.data?.map((p) => p.cpu_percent) ?? [];

  return (
    <Link
      href={`/dashboard/servers/${server.id}`}
      className="group flex flex-col rounded-xl border border-line bg-bg-100 p-4 transition-colors hover:border-line-strong"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-bg text-muted">
          <Icon name="server" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{server.name}</span>
            {server.is_control_plane && <Badge tone="blue">Control plane</Badge>}
          </div>
          <div className="truncate font-mono text-xs text-subtle">{server.ip_addresses[0] ?? server.hostname ?? "not enrolled yet"}</div>
        </div>
        <StatusPill status={server.status} />
      </div>

      {server.status === "pending" ? (
        <div className="mt-4 flex flex-1 items-center gap-3 rounded-lg border border-dashed border-line-strong p-3 text-xs text-muted">
          <Icon name="terminal" size={14} className="shrink-0" />
          Run the install command on the server to connect it.
        </div>
      ) : (
        <>
          <div className="mt-4 h-9">
            {cpu.length > 1 ? (
              <Sparkline data={cpu} color={!live ? "gray" : (latest?.cpu_percent ?? 0) > 70 ? "warn" : "blue"} height={36} />
            ) : (
              <div className="flex h-full items-center text-xs text-subtle">Collecting metrics…</div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-[11px] text-subtle">
            {(
              [
                ["CPU", latest?.cpu_percent],
                ["Memory", latest?.memory_percent],
                ["Disk", latest?.disk_percent],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <div className="mb-1.5 flex justify-between">
                  <span>{label}</span>
                  <span className="font-mono text-muted">{value == null || !live ? "—" : `${Math.round(value)}%`}</span>
                </div>
                <Meter value={live ? (value ?? 0) : 0} />
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-subtle">
        <span className="truncate">{osLabel(server)}</span>
        {server.memory_total != null && (
          <>
            <span>·</span>
            <span className="shrink-0">
              {server.cpu_count} vCPU · {formatBytes(server.memory_total, 0)}
            </span>
          </>
        )}
        <span className="ml-auto shrink-0">{server.status === "pending" ? `added ${timeAgo(server.created_at)}` : timeAgo(server.last_heartbeat_at)}</span>
      </div>
    </Link>
  );
}
