"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { Badge, Card } from "@/components/ui";
import { useAlerts } from "@/lib/api/monitoring";
import { formatDuration } from "@/lib/format";

const sevTone = { critical: "err", warning: "warn", info: "blue" } as const;

/** Open incidents, newest first. */
export function AlertList({ limit, compact }: { limit?: number; compact?: boolean }) {
  const { data, isLoading } = useAlerts("open");
  if (isLoading) return <div className="skeleton h-40 rounded-xl" />;
  const list = (data ?? []).slice(0, limit);
  if (!list.length) {
    return (
      <Card className="flex items-center gap-3 p-4 text-sm text-muted">
        <Icon name="check-circle" className="text-ok" /> All clear. Nothing is firing.
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      {list.map((a) => (
        <Link
          key={a.id}
          href="/dashboard/monitoring"
          className="flex items-start gap-3 border-b border-line px-4 py-3 transition-colors last:border-0 hover:bg-black/[0.02]"
        >
          <Icon name="alert" className={a.severity === "critical" ? "mt-0.5 shrink-0 text-err" : "mt-0.5 shrink-0 text-warn"} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm">{a.title}</span>
              {a.state === "acknowledged" && <Badge>Ack</Badge>}
            </div>
            <div className="truncate text-xs text-subtle">
              {a.target_label}
              {!compact && a.detail && <> · {a.detail}</>}
            </div>
          </div>
          <Badge tone={sevTone[a.severity]}>{formatDuration(a.fired_at ?? a.started_at)}</Badge>
        </Link>
      ))}
    </Card>
  );
}

/** "3 firing" badge for section headers. */
export function FiringBadge() {
  const { data } = useAlerts("open");
  const firing = (data ?? []).filter((a) => a.state === "firing").length;
  return <Badge tone={firing ? "err" : "ok"}>{firing ? `${firing} firing` : "All clear"}</Badge>;
}
