"use client";

import Link from "next/link";
import { DeploymentRow, deployLabel, deployTone, sourceLabel } from "@/components/apps/app-ui";
import { Icon } from "@/components/icons";
import { Card, Dot } from "@/components/ui";
import { useApps, useDeployments } from "@/lib/api/apps";
import { useBackupSummary } from "@/lib/api/backups";
import { useDatabases } from "@/lib/api/databases";
import { Gauge } from "@/components/dashboard/fleet-map";
import { formatBytes } from "@/lib/format";
import { useServers } from "@/lib/api/servers";
import { timeAgo } from "@/lib/format";

export function DatabaseCount() {
  const { data } = useDatabases();
  return <>{data ? data.length : "–"}</>;
}

export function AppCount() {
  const { data } = useApps();
  return <>{data ? data.length : "–"}</>;
}

export function OverviewApps() {
  const { data, isLoading } = useApps();
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-[60px] rounded-xl" />
        ))}
      </div>
    );
  }
  if (!data?.length) {
    return (
      <Link
        href="/dashboard/applications/new"
        className="flex items-center gap-3 rounded-xl border border-dashed border-ink/15 bg-bg-100/90 p-4 text-sm text-muted transition-colors hover:border-black/25 hover:text-fg"
      >
        <Icon name="plus" /> Deploy your first application from Git or a container image
      </Link>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {data.slice(0, 6).map((a) => {
        const latest = a.latest_deployment;
        return (
          <Link
            key={a.id}
            href={`/dashboard/applications/${a.id}`}
            className="flex items-center gap-3 rounded-xl border border-ink/[0.07] bg-bg-100/90 p-3 backdrop-blur transition-colors hover:border-ink/15"
          >
            <span className="flex size-[34px] shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-ink/[0.04] text-sm font-semibold uppercase">
              {a.name[0]}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm">{a.name}</span>
                {latest && <Dot tone={deployTone[latest.status]} pulse={latest.status === "running" || latest.status === "queued"} />}
              </div>
              <div className="truncate text-xs text-subtle">
                {latest ? `${deployLabel[latest.status]} · ${timeAgo(latest.created_at)}` : "Never deployed"} · {a.server_name}
              </div>
            </div>
            <span className="hidden max-w-[40%] truncate text-xs text-subtle sm:block">{sourceLabel(a)}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function RecentDeployments() {
  const { data, isLoading } = useDeployments(5);
  const { data: servers } = useServers();
  return (
    <Card className="overflow-hidden">
      {isLoading ? (
        <div className="skeleton m-4 h-24 rounded" />
      ) : data?.length ? (
        data.map((d) => <DeploymentRow key={d.id} d={d} serverName={servers?.find((s) => s.id === d.server_id)?.name} />)
      ) : (
        <p className="p-4 text-sm text-subtle">No deployments yet.</p>
      )}
    </Card>
  );
}

export function BackupSize() {
  const { data } = useBackupSummary();
  return <>{data ? formatBytes(data.size) : "–"}</>;
}

/** Overview card: how much is backed up and how much of it is proven. */
export function BackupsCard() {
  const { data } = useBackupSummary();
  const verified = data && data.count ? Math.round((data.verified / data.count) * 1000) / 10 : 0;
  return (
    <Card className="flex flex-col p-5">
      <h2 className="text-[11px] text-muted">Backups</h2>
      <div className="flex flex-1 items-center justify-center py-6">
        <Gauge value={verified} label="Backups restore-verified" sub={data ? `${data.verified} of ${data.count} verified · ${formatBytes(data.size)}` : "…"} />
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-line pt-4 text-[11px]">
        <div>
          <div className="text-subtle">Kept</div>
          <div className="mt-0.5 text-fg">{data?.count ?? "–"}</div>
        </div>
        <div>
          <div className="text-subtle">Failed</div>
          <div className={data?.failed_24h ? "mt-0.5 text-err" : "mt-0.5 text-fg"}>{data ? `${data.failed_24h} in 24 h` : "–"}</div>
        </div>
        <div>
          <div className="text-subtle">Encrypted</div>
          <div className="mt-0.5 text-fg">{data ? "All" : "–"}</div>
        </div>
      </div>
    </Card>
  );
}
