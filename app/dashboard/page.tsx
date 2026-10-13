import Link from "next/link";
import { BrandChip } from "@/components/brand-chip";
import { Sparkline } from "@/components/charts";
import { CodeTexture } from "@/components/code-texture";
import { AlertList, DeploymentRow } from "@/components/dashboard/cards";
import { FleetMap, Gauge } from "@/components/dashboard/fleet-map";
import { Greeting } from "@/components/dashboard/greeting";
import { AddNewMenu } from "@/components/dashboard/nav";
import { Icon, type IconName } from "@/components/icons";
import { Badge, Card, Container, Dot, SectionTitle } from "@/components/ui";
import { alerts, apps, databases, deployLabel, deployments, deployTone, getServer, servers } from "@/lib/data";

export default function OverviewPage() {
  const online = servers.filter((s) => s.status !== "offline").length;
  const firing = alerts.filter((a) => a.state === "firing").length;

  const stats: { label: string; value: string; of: string; icon: IconName; href: string }[] = [
    { label: "My Servers", value: String(servers.length), of: "/ 25", icon: "server", href: "/dashboard/servers" },
    { label: "Applications", value: String(apps.length), of: "/ 200", icon: "box", href: "/dashboard/applications" },
    { label: "My Databases", value: String(databases.length), of: "registered", icon: "database", href: "/dashboard/databases" },
    { label: "Backups", value: "184 GB", of: "/ 500 GB", icon: "archive", href: "/dashboard/backups" },
  ];

  return (
    <Container className="space-y-4 pt-6">
      {/* Greeting + agents */}
      <div className="grid gap-4 xl:grid-cols-[1fr_minmax(360px,0.55fr)]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4">
            <Greeting />
            <span className="flex items-center gap-3">
              <Icon name="check-circle" className="text-accent-fg" aria-label="Verified owner" />
              <AddNewMenu />
            </span>
          </div>
          <div className="grid grid-cols-2 border-t border-line bg-white/[0.025] md:grid-cols-4">
            {stats.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="group relative overflow-hidden border-line px-5 py-4 transition-colors hover:bg-white/[0.03] [&:not(:last-child)]:border-r max-md:[&:nth-child(2)]:border-r-0 max-md:[&:nth-child(-n+2)]:border-b"
              >
                <div className="text-[11px] text-muted">{s.label}</div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-xl font-semibold tabular-nums">{s.value}</span>
                  <span className="text-[11px] text-subtle">{s.of}</span>
                </div>
                <Icon
                  name={s.icon}
                  size={64}
                  strokeWidth={1}
                  className="pointer-events-none absolute -right-3 -bottom-5 text-white/[0.05] transition-colors group-hover:text-white/[0.09]"
                />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col p-3">
          <div className="flex items-center justify-between rounded-xl bg-[#141414] px-3 py-2.5">
            <span className="text-xs text-muted">
              Agents <span className="text-subtle">·</span> <span className="text-fg">{online} of {servers.length} online</span>
            </span>
            <Link href="/dashboard/servers/new" className="flex size-7 items-center justify-center rounded-full border border-line-strong text-muted hover:text-fg" aria-label="Enroll server">
              <Icon name="plus" size={14} />
            </Link>
          </div>
          <div className="grid flex-1 grid-cols-6 items-center gap-2 px-1 pt-4 pb-2">
            {servers.map((s) => {
              const off = s.status === "offline";
              return (
                <Link key={s.id} href={`/dashboard/servers/${s.id}`} title={`${s.name} · ${s.status}`} className="group flex flex-col items-center gap-2">
                  <span
                    className={`relative flex size-12 items-center justify-center rounded-full border-2 bg-[#141414] transition-transform group-hover:scale-105 ${
                      off ? "border-white/10 text-subtle" : s.status === "degraded" ? "border-warn/70 text-warn" : "border-accent/80 text-accent-fg"
                    }`}
                  >
                    <Icon name={off ? "lock" : s.controlPlane ? "shield" : "server"} size={18} />
                    {!off && <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-bg-100 bg-ok" />}
                  </span>
                  <span className="w-full truncate text-center text-[10px] text-subtle">{s.name}</span>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Applications on texture */}
      <section className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#060606] p-5">
        <CodeTexture seed={3} />
        <Icon name="box" size={180} strokeWidth={0.5} className="pointer-events-none absolute -right-8 -bottom-12 text-white/[0.05]" />
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Applications</h2>
            <Link href="/dashboard/applications" className="text-xs text-muted hover:text-fg">
              View all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {apps.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/applications/${a.id}`}
                className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#141414]/90 p-3 backdrop-blur transition-colors hover:border-white/15"
              >
                <BrandChip name={a.framework} size={34} className="rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm">{a.name}</span>
                    <Dot tone={deployTone[a.status]} pulse={a.status === "building"} />
                  </div>
                  <div className="truncate text-xs text-subtle">
                    {deployLabel[a.status]} · {a.updated} · {getServer(a.serverId)?.name}
                  </div>
                </div>
                <div className="hidden w-20 sm:block">
                  <Sparkline data={a.requests} height={24} color={a.status === "error" ? "err" : "violet"} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Map + gauge */}
      <div className="grid gap-4 xl:grid-cols-[1fr_minmax(360px,0.48fr)]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] text-muted">Server Regions</h2>
            <span className="text-[11px] text-subtle">{servers.length} servers · 3 regions</span>
          </div>
          <FleetMap />
        </Card>
        <Card className="flex flex-col p-5">
          <h2 className="text-[11px] text-muted">Backup Storage</h2>
          <div className="flex flex-1 items-center justify-center py-6">
            <Gauge value={36.8} label="Backup storage used" sub="184.0 GB / 500.00 GB" />
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-line pt-4 text-[11px]">
            <div>
              <div className="text-subtle">Verified</div>
              <div className="mt-0.5 text-fg">3 restores</div>
            </div>
            <div>
              <div className="text-subtle">Failed</div>
              <div className="mt-0.5 text-err">1 today</div>
            </div>
            <div>
              <div className="text-subtle">Encrypted</div>
              <div className="mt-0.5 text-fg">7 of 8</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity */}
      <div className="grid gap-4 pt-2 xl:grid-cols-[1fr_380px]">
        <section className="min-w-0">
          <SectionTitle
            action={
              <Link href="/dashboard/deployments" className="text-xs text-muted hover:text-fg">
                View all
              </Link>
            }
          >
            Recent Deployments
          </SectionTitle>
          <Card className="overflow-hidden">
            {deployments.slice(0, 5).map((d) => (
              <DeploymentRow key={d.id} d={d} />
            ))}
          </Card>
        </section>
        <section>
          <SectionTitle action={<Badge tone="err">{firing} firing</Badge>}>Alerts</SectionTitle>
          <AlertList limit={5} compact />
        </section>
      </div>
    </Container>
  );
}
