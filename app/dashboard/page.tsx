import Link from "next/link";
import { AppCount, OverviewApps, RecentDeployments } from "@/components/apps/overview-apps";
import { CodeTexture } from "@/components/code-texture";
import { AlertList, FiringBadge } from "@/components/dashboard/cards";
import { Gauge } from "@/components/dashboard/fleet-map";
import { AgentsCard, FleetCard, ServerCount } from "@/components/servers/overview-fleet";
import { Greeting } from "@/components/dashboard/greeting";
import { AddNewMenu } from "@/components/dashboard/nav";
import { Icon, type IconName } from "@/components/icons";
import { Card, Container, SectionTitle } from "@/components/ui";
import { databases } from "@/lib/data";

export default function OverviewPage() {

  const stats: { label: string; value: React.ReactNode; of: string; icon: IconName; href: string }[] = [
    { label: "My Servers", value: <ServerCount />, of: "/ 25", icon: "server", href: "/dashboard/servers" },
    { label: "Applications", value: <AppCount />, of: "/ 200", icon: "box", href: "/dashboard/applications" },
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

        <AgentsCard />
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
          <OverviewApps />
        </div>
      </section>

      {/* Map + gauge */}
      <div className="grid gap-4 xl:grid-cols-[1fr_minmax(360px,0.48fr)]">
        <FleetCard />
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
          <RecentDeployments />
        </section>
        <section>
          <SectionTitle action={<FiringBadge />}>Alerts</SectionTitle>
          <AlertList limit={5} compact />
        </section>
      </div>
    </Container>
  );
}
