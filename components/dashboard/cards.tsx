import Link from "next/link";
import { BrandChip } from "@/components/brand-chip";
import { Sparkline } from "@/components/charts";
import { Icon } from "@/components/icons";
import { Avatar, Badge, Card, Dot, Meter, Mono } from "@/components/ui";
import {
  type Deployment,
  type Server,
  alerts,
  deployLabel,
  deployTone,
  getApp,
  getServer,
  serverHistory,
  serverTone,
} from "@/lib/data";

export function ServerCard({ s }: { s: Server }) {
  const h = serverHistory(s.id);
  const off = s.status === "offline";
  return (
    <Link
      href={`/dashboard/servers/${s.id}`}
      className="group flex flex-col rounded-xl border border-line bg-bg-100 p-4 transition-colors hover:border-line-strong"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-bg text-muted">
          <Icon name="server" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{s.name}</span>
            {s.controlPlane && <Badge tone="blue">Control plane</Badge>}
          </div>
          <div className="truncate font-mono text-xs text-subtle">{s.ip}</div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted capitalize">
          <Dot tone={serverTone[s.status]} pulse={s.status === "online"} />
          {s.status}
        </span>
      </div>
      <div className="mt-4">
        <Sparkline data={h.cpu} color={off ? "gray" : s.cpu > 60 ? "warn" : "blue"} height={36} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-[11px] text-subtle">
        {(
          [
            ["CPU", s.cpu],
            ["Memory", s.memory],
            ["Disk", s.disk],
          ] as const
        ).map(([k, v]) => (
          <div key={k}>
            <div className="mb-1.5 flex justify-between">
              <span>{k}</span>
              <span className="font-mono text-muted">{off && k !== "Disk" ? "—" : `${v}%`}</span>
            </div>
            <Meter value={off && k !== "Disk" ? 0 : v} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-subtle">
        <BrandChip name={s.os} size={16} />
        <span className="truncate">
          {s.os} {s.osVersion}
        </span>
        <span>·</span>
        <span className="truncate">
          {s.provider} {s.region}
        </span>
        <span className="ml-auto shrink-0">{s.heartbeat}</span>
      </div>
    </Link>
  );
}

export function DeploymentRow({ d, showApp = true }: { d: Deployment; showApp?: boolean }) {
  const app = getApp(d.appId);
  const server = getServer(d.serverId);
  return (
    <Link
      href={`/dashboard/deployments/${d.id}`}
      className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3.5 transition-colors last:border-0 hover:bg-white/[0.02] md:grid-cols-[minmax(160px,1.1fr)_minmax(120px,0.8fr)_minmax(200px,1.6fr)_auto]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Mono className="truncate text-fg">{d.id}</Mono>
          {d.current && <Badge tone="blue">Current</Badge>}
        </div>
        <div className="mt-0.5 text-xs text-subtle">
          {d.env}
          {showApp && app && <span> · {app.name}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end md:items-start">
        <span className="flex items-center gap-2 text-sm">
          <Dot tone={deployTone[d.status]} pulse={d.status === "building"} />
          {deployLabel[d.status]}
        </span>
        <span className="mt-0.5 text-xs text-subtle">{d.duration}</span>
      </div>
      <div className="col-span-2 min-w-0 md:col-span-1">
        <div className="flex items-center gap-1.5 text-[13px] text-fg">
          <Icon name="git-branch" size={14} className="shrink-0 text-subtle" />
          <span className="truncate">{d.branch}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-subtle">
          <Icon name="git-commit" size={14} className="shrink-0" />
          <Mono className="text-[11.5px]">{d.commit}</Mono>
          <span className="truncate">{d.message}</span>
        </div>
      </div>
      <div className="col-span-2 flex items-center gap-2 text-xs text-subtle md:col-span-1 md:justify-end">
        <span className="whitespace-nowrap">
          {d.created} by {d.author}
        </span>
        <Avatar name={d.author} size={20} />
        <span className="hidden md:inline">·</span>
        <span className="hidden whitespace-nowrap md:inline">{server?.name}</span>
      </div>
    </Link>
  );
}

const sevTone = { critical: "err", warning: "warn", info: "blue" } as const;

export function AlertList({ limit, compact }: { limit?: number; compact?: boolean }) {
  const list = alerts.filter((a) => a.state !== "resolved").slice(0, limit);
  return (
    <Card className="overflow-hidden">
      {list.map((a) => (
        <Link
          key={a.id}
          href="/dashboard/monitoring"
          className="flex items-start gap-3 border-b border-line px-4 py-3 transition-colors last:border-0 hover:bg-white/[0.02]"
        >
          <Icon name="alert" className={a.severity === "critical" ? "mt-0.5 shrink-0 text-err" : "mt-0.5 shrink-0 text-warn"} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm">{a.title}</span>
              {a.state === "acknowledged" && <Badge>Ack</Badge>}
            </div>
            <div className="truncate text-xs text-subtle">
              {a.target}
              {!compact && <> · {a.rule}</>}
            </div>
          </div>
          <Badge tone={sevTone[a.severity]}>{a.since}</Badge>
        </Link>
      ))}
    </Card>
  );
}
