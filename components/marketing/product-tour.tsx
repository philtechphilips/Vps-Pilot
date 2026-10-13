"use client";

import { useEffect, useState } from "react";
import { BrandChip } from "@/components/brand-chip";
import { AreaChart, Sparkline } from "@/components/charts";
import { Icon, type IconName } from "@/components/icons";
import { Logotype } from "@/components/logo";
import { Badge, Dot } from "@/components/ui";
import { buildLog, queryResult, serverHistory, services, timeLabels } from "@/lib/data";
import { cn } from "@/lib/utils";

type TabId = "monitor" | "deploy" | "databases";

const tabs: {
  id: TabId;
  label: string;
  icon: IconName;
  title: string;
  url: string;
  nav: string;
  features: { icon: IconName; title: string; desc: string }[];
}[] = [
  {
    id: "monitor",
    label: "Monitor",
    icon: "activity",
    title: "Every server, one heartbeat away.",
    url: "pilot.example.com/dashboard/servers/web-prod-01",
    nav: "Servers",
    features: [
      { icon: "network", title: "Outbound-only agent", desc: "No inbound ports. Agents dial home over HTTPS." },
      { icon: "cpu", title: "Host & container metrics", desc: "CPU, memory, swap, disk, inodes and network." },
      { icon: "bell", title: "Deduplicated alerts", desc: "Offline agents, pressure, failing checks, expiring TLS." },
      { icon: "file-text", title: "Bounded logs", desc: "journald and container logs, redacted at the source." },
    ],
  },
  {
    id: "deploy",
    label: "Deploy",
    icon: "rocket",
    title: "Ship from Git without replacing what works.",
    url: "pilot.example.com/dashboard/deployments/dpl_4xLm0aQe",
    nav: "Deployments",
    features: [
      { icon: "git-commit", title: "Pinned sources", desc: "Builds from an exact commit or image digest." },
      { icon: "container", title: "Isolated builds", desc: "Rootless BuildKit with CPU, memory and time quotas." },
      { icon: "check-circle", title: "Health-checked", desc: "Candidates must pass before they take traffic." },
      { icon: "rollback", title: "Instant rollback", desc: "The last healthy release is always kept ready." },
    ],
  },
  {
    id: "databases",
    label: "Databases",
    icon: "database",
    title: "Administer databases without opening ports.",
    url: "pilot.example.com/dashboard/databases/pg-main",
    nav: "Databases",
    features: [
      { icon: "table", title: "Object explorer", desc: "Databases, schemas, tables, indexes and constraints." },
      { icon: "lock", title: "Read-only by default", desc: "Timeouts, row limits and least-privileged roles." },
      { icon: "key", title: "Type-aware Redis", desc: "SCAN-based key browser with confirmed deletes." },
      { icon: "archive", title: "Verified restores", desc: "Encrypted backups restored into a separate target." },
    ],
  },
];

const sideNav: { label: string; icon: IconName }[] = [
  { label: "Overview", icon: "grid" },
  { label: "Servers", icon: "server" },
  { label: "Applications", icon: "box" },
  { label: "Deployments", icon: "rocket" },
  { label: "Databases", icon: "database" },
  { label: "Domains", icon: "globe" },
  { label: "Monitoring", icon: "activity" },
  { label: "Logs", icon: "file-text" },
  { label: "Backups", icon: "archive" },
];

export function ProductTour() {
  const [active, setActive] = useState<TabId>("monitor");
  const [auto, setAuto] = useState(true);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      setActive((cur) => tabs[(tabs.findIndex((x) => x.id === cur) + 1) % tabs.length].id);
    }, 7000);
    return () => clearInterval(t);
  }, [auto]);

  return (
    <section id="product" className="mx-auto max-w-[1180px] scroll-mt-24 px-4 pt-24 sm:px-8 sm:pt-36">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#232323] py-1 pr-3 pl-1 text-xs text-accent-fg">
          <span className="flex size-5 items-center justify-center rounded-full bg-accent/25">
            <Icon name="monitor" size={11} />
          </span>
          The dashboard
        </span>
        <h2 className="mt-4 text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[40px]">
          Everything about your servers, in one calm place.
        </h2>
      </div>

      <div role="tablist" aria-label="Product tour" className="mx-auto mt-10 flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#111] p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            onClick={() => {
              setActive(t.id);
              setAuto(false);
            }}
            className={cn(
              "relative flex h-9 shrink-0 items-center gap-2 overflow-hidden rounded-xl px-4 text-sm transition-colors",
              active === t.id ? "btn-primary" : "text-muted hover:text-fg",
            )}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
            {active === t.id && auto && (
              <span key={t.id} className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-white/50 [animation:tour-progress_7s_linear]" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>

      <p key={tab.id + "-title"} className="mt-6 animate-fade-up text-center text-[15px] text-muted">
        {tab.title}
      </p>

      <div className="relative mt-8" data-reveal data-motion="tilt">
        <div
          className="pointer-events-none absolute -inset-x-10 -top-16 h-72 opacity-70"
          style={{ background: "radial-gradient(50% 60% at 50% 40%, rgb(165 76 162 / 0.25), transparent)" }}
          aria-hidden="true"
        />
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black p-0 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9),0_0_0_1px_rgb(0_0_0)]">
          <div className="flex h-10 items-center gap-3 border-b border-white/[0.06] bg-[#0a0a0a] px-4">
            <span className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
              <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
              <span className="size-2.5 rounded-full bg-[#28c840]/80" />
            </span>
            <span className="mx-auto flex max-w-[60%] items-center gap-1.5 truncate rounded-md bg-white/[0.05] px-3 py-1 font-mono text-[11px] text-subtle">
              <Icon name="lock" size={11} /> {tab.url}
            </span>
            <span className="w-12" />
          </div>

          <div className="theme-console flex h-[520px] bg-black sm:h-[580px]">
            <aside className="hidden w-[184px] shrink-0 flex-col md:flex">
              <div className="px-4 pt-4 pb-5">
                <Logotype className="text-[14px]" />
              </div>
              <nav className="flex flex-col gap-0.5 px-2" aria-hidden="true">
                {sideNav.map((n) => (
                  <span
                    key={n.label}
                    className={cn("flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[12px]", n.label === tab.nav ? "bg-panel text-fg" : "text-muted")}
                  >
                    <Icon name={n.icon} size={14} className={n.label === tab.nav ? "" : "text-subtle"} />
                    {n.label}
                  </span>
                ))}
              </nav>
            </aside>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex h-11 shrink-0 items-center gap-2 px-3 text-[12px]">
                <span className="size-4 rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-700" />
                <span>Pelumi’s Servers</span>
                <span className="rounded-full bg-accent px-1.5 text-[9px] font-semibold text-white">Owner</span>
                <span className="text-[#3a3a3a]">/</span>
                <span className="text-muted">Production</span>
                <span className="text-[#3a3a3a]">/</span>
                <span>{tab.nav}</span>
              </div>
              <div key={tab.id} className="relative min-h-0 flex-1 animate-fade-up overflow-hidden rounded-tl-xl border-t border-l border-white/[0.06] bg-panel p-4 sm:p-5">
                {tab.id === "monitor" && <MonitorScreen />}
                {tab.id === "deploy" && <DeployScreen />}
                {tab.id === "databases" && <DatabaseScreen />}
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-panel to-transparent" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tab.features.map((f) => (
          <div key={tab.id + f.title} className="animate-fade-up rounded-2xl border border-white/[0.06] bg-[#232323] p-5">
            <span className="flex size-9 items-center justify-center rounded-xl border border-white/[0.06] bg-[#111] text-accent-fg">
              <Icon name={f.icon} />
            </span>
            <h3 className="mt-4 text-sm font-medium">{f.title}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Screens                                                             */
/* ------------------------------------------------------------------ */

function ScreenHeader({ title, meta, action }: { title: React.ReactNode; meta: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">{title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">{meta}</div>
      </div>
      {action}
    </div>
  );
}

function MonitorScreen() {
  const h = serverHistory("web-prod-01");
  const stats = [
    { k: "CPU", v: "64%", data: h.cpu, color: "warn" as const },
    { k: "Memory", v: "72%", data: h.memory, color: "violet" as const },
    { k: "Disk", v: "51%", data: h.disk, color: "blue" as const },
    { k: "Network out", v: "21.7 MB/s", data: h.netOut, color: "teal" as const },
  ];
  return (
    <>
      <ScreenHeader
        title={
          <>
            web-prod-01 <Badge tone="ok">Online</Badge>
          </>
        }
        meta={
          <>
            <span className="font-mono">167.99.42.118</span>
            <span>Ubuntu 22.04 LTS</span>
            <span>DigitalOcean · Amsterdam</span>
            <span>heartbeat 5s ago</span>
          </>
        }
        action={<span className="btn-primary hidden h-7 items-center rounded-md px-3 text-[11px] font-medium sm:inline-flex">Run Action</span>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="rounded-xl border border-line bg-bg-100 p-3">
            <div className="text-[11px] text-muted">{s.k}</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums">{s.v}</div>
            <Sparkline data={s.data} color={s.color} height={28} className="mt-2" />
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-line bg-bg-100 p-4">
          <div className="mb-3 text-[11px] text-muted">CPU · last hour</div>
          <AreaChart series={[{ name: "CPU", data: h.cpu, color: "warn" }]} labels={timeLabels} height={150} />
        </div>
        <div className="overflow-hidden rounded-xl border border-line bg-bg-100">
          <div className="border-b border-line px-4 py-2.5 text-[11px] text-muted">Services & containers</div>
          {services["web-prod-01"].slice(0, 5).map((s) => (
            <div key={s.name} className="flex items-center gap-2.5 border-b border-line px-4 py-2 text-[12px] last:border-0">
              <Dot tone={s.status === "running" ? "ok" : "warn"} />
              <span className="min-w-0 flex-1 truncate">{s.name}</span>
              <span className="font-mono text-[11px] text-subtle">{s.cpu}</span>
              <span className="w-14 text-right font-mono text-[11px] text-subtle">{s.memory}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function DeployScreen() {
  const steps = [
    { l: "Queued", t: "0s" },
    { l: "Build", t: "1m 42s" },
    { l: "Health check", t: "4s" },
    { l: "Promote", t: "1s" },
  ];
  return (
    <>
      <ScreenHeader
        title={
          <>
            <BrandChip name="Next.js" size={22} className="rounded-full" /> storefront <Badge tone="ok">Ready</Badge>
          </>
        }
        meta={
          <>
            <span className="font-mono">dpl_4xLm0aQe</span>
            <span className="flex items-center gap-1">
              <Icon name="git-branch" size={11} /> main · 4c1e9a2
            </span>
            <span>Docker on web-prod-01</span>
            <span>1m 54s</span>
          </>
        }
        action={
          <span className="hidden gap-2 sm:flex">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line-strong bg-bg-100 px-3 text-[11px]">
              <Icon name="rollback" size={12} /> Rollback
            </span>
            <span className="btn-primary inline-flex h-7 items-center rounded-md px-3 text-[11px] font-medium">Redeploy</span>
          </span>
        }
      />
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-bg-100 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.l} className="flex items-center gap-2.5 border-line px-4 py-3 [&:not(:last-child)]:border-r">
            <span className="flex size-5 items-center justify-center rounded-full border border-ok/40 bg-ok/15 text-ok">
              <Icon name="check" size={11} strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-[12px]">{s.l}</span>
              <span className="block text-[10px] text-subtle">{s.t}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-[#0d0d0d]">
        <div className="flex items-center gap-3 border-b border-line px-4 py-2 text-[11px] text-muted">
          Build logs
          <span className="ml-auto flex items-center gap-1 text-subtle">
            <Icon name="lock" size={11} /> secrets redacted
          </span>
        </div>
        <div className="py-2 font-mono text-[11.5px] leading-[21px]">
          {buildLog.slice(9).map((l, i) => (
            <div key={i} className="flex gap-3 px-4">
              <span className="w-5 shrink-0 text-right text-subtle">{i + 10}</span>
              <span className="hidden shrink-0 text-subtle sm:inline">{l.t}</span>
              <span
                className={cn(
                  "truncate",
                  l.level === "ok" ? "text-ok" : l.level === "warn" ? "text-warn" : l.level === "muted" ? "text-subtle" : "text-fg",
                )}
              >
                {l.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function DatabaseScreen() {
  return (
    <>
      <ScreenHeader
        title={
          <>
            <BrandChip name="PostgreSQL" size={22} /> pg-main <Badge>Local</Badge>
          </>
        }
        meta={
          <>
            <span className="flex items-center gap-1.5">
              <Dot tone="ok" /> Healthy
            </span>
            <span>PostgreSQL 16.4</span>
            <span>db-primary</span>
            <span className="font-mono">127.0.0.1:5432</span>
          </>
        }
      />
      <div className="mb-3 flex gap-4 border-b border-line text-[12px]">
        {["Overview", "Explorer", "Query", "Users & Roles", "Backups"].map((t) => (
          <span key={t} className={cn("-mb-px pb-2", t === "Query" ? "border-b-2 border-fg text-fg" : "text-muted")}>
            {t}
          </span>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[170px_1fr]">
        <div className="hidden rounded-xl border border-line bg-bg-100 p-2 font-mono text-[11.5px] lg:block">
          {[
            ["database", "storefront", 0],
            ["folder", "public", 1],
            ["table", "orders", 2],
            ["table", "customers", 2],
            ["table", "products", 2],
            ["table", "inventory", 2],
            ["folder", "billing", 1],
            ["database", "analytics", 0],
          ].map(([icon, label, depth]) => (
            <div
              key={String(label)}
              className={cn("flex items-center gap-1.5 rounded-md py-1 pr-2", label === "orders" ? "bg-blue/15 text-blue-fg" : "text-muted")}
              style={{ paddingLeft: 6 + Number(depth) * 12 }}
            >
              <Icon name={icon as IconName} size={12} />
              {label}
            </div>
          ))}
        </div>
        <div className="min-w-0 space-y-3">
          <div className="overflow-hidden rounded-xl border border-line bg-[#0d0d0d]">
            <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 text-ok">
                <Icon name="lock" size={10} /> read-only
              </span>
              <span className="text-subtle">timeout 30s · max 1,000 rows</span>
              <span className="btn-primary ml-auto inline-flex h-6 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium">
                <Icon name="play" size={10} /> Run
              </span>
            </div>
            <div className="p-3 font-mono text-[12px] leading-[21px]">
              <div>
                <span className="text-[#ff7ab2]">SELECT</span> id, customer_email, status, total, created_at
              </div>
              <div>
                <span className="text-[#ff7ab2]">FROM</span> public.orders
              </div>
              <div>
                <span className="text-[#ff7ab2]">WHERE</span> created_at {">"} now() - <span className="text-[#5be3a0]">interval &apos;24 hours&apos;</span>
              </div>
              <div>
                <span className="text-[#ff7ab2]">ORDER BY</span> created_at <span className="text-[#ff7ab2]">DESC LIMIT</span> <span className="text-[#67b7ff]">50</span>;
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-line bg-bg-100">
            <div className="flex items-center gap-3 border-b border-line px-3 py-2 text-[11px] text-muted">
              <span className="flex items-center gap-1 text-ok">
                <Icon name="check-circle" size={12} /> 50 rows
              </span>
              <span>{queryResult.duration}</span>
              <span className="text-subtle">PII masked</span>
            </div>
            <table className="w-full font-mono text-[11.5px]">
              <thead>
                <tr>
                  {queryResult.columns.map((c) => (
                    <th key={c} className="border-b border-line bg-bg-200 px-3 py-1.5 text-left font-medium text-muted">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queryResult.rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j} className={cn("border-b border-line px-3 py-1.5 whitespace-nowrap", j === 3 ? "text-blue-fg" : "text-fg")}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
