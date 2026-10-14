import Link from "next/link";
import { Icon } from "@/components/icons";
import { Avatar, Badge, Card, Dot, Mono } from "@/components/ui";
import { type Deployment, alerts, deployLabel, deployTone, getApp, getServer } from "@/lib/data";

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
