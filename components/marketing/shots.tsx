// Product shots for the landing page: small, quiet replicas of real screens,
// set on a soft gray panel.
import type { ReactNode } from "react";
import { BrandChip, type Brand } from "@/components/brand-chip";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

export function ShotPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-reveal data-motion="scale" className={cn("relative overflow-hidden rounded-[28px] bg-[#f4f4f5] p-6 sm:p-10", className)}>
      {children}
    </div>
  );
}

function Window({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(0_0_0/0.12)]", className)}>
      {children}
    </div>
  );
}

function Bar({ value, tone = "bg-accent" }: { value: number; tone?: string }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
      <span className={cn("block h-full rounded-full", tone)} style={{ width: `${value}%` }} />
    </span>
  );
}

function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "accent" }) {
  const tones = {
    neutral: "border-line text-muted",
    ok: "border-ok/20 bg-ok/[0.07] text-ok",
    accent: "border-accent/20 bg-accent/[0.06] text-accent",
  };
  return <span className={cn("inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[10px] font-medium", tones[tone])}>{children}</span>;
}

const servers = [
  { name: "web-1", os: "Ubuntu 24.04", cpu: 22, mem: 48, up: true },
  { name: "web-2", os: "Debian 12", cpu: 64, mem: 71, up: true },
  { name: "db-1", os: "Ubuntu 22.04", cpu: 9, mem: 36, up: true },
];

export function HeroShot({ className }: { className?: string }) {
  const nav: [IconName, string][] = [
    ["grid", "Overview"],
    ["server", "Servers"],
    ["rocket", "Applications"],
    ["database", "Databases"],
    ["activity", "Monitoring"],
    ["archive", "Backups"],
  ];
  return (
    <Window className={cn("mx-auto max-w-[980px] overflow-hidden text-left", className)}>
      <div className="flex h-10 items-center gap-1.5 border-b border-line px-4">
        <span className="size-2.5 rounded-full bg-black/10" />
        <span className="size-2.5 rounded-full bg-black/10" />
        <span className="size-2.5 rounded-full bg-black/10" />
        <span className="mx-auto flex items-center gap-1.5 rounded-md bg-black/[0.04] px-3 py-1 text-[11px] text-subtle">
          <Icon name="lock" size={11} /> pilot.example.com
        </span>
      </div>
      <div className="flex">
        <aside className="hidden w-48 shrink-0 border-r border-line bg-[#fafafa] p-3 sm:block">
          {nav.map(([icon, label], i) => (
            <div key={label} className={cn("flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[12px]", i === 1 ? "bg-white text-fg shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_0_0_1px_rgb(0_0_0/0.06)]" : "text-muted")}>
              <Icon name={icon} size={14} className={i === 1 ? "text-fg" : "text-subtle"} />
              {label}
            </div>
          ))}
        </aside>
        <div className="min-w-0 flex-1 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold tracking-tight">Servers</p>
              <p className="text-[11px] text-subtle">3 online · agent 1.1.5</p>
            </div>
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-accent px-3 text-[11px] font-medium text-white">
              <Icon name="plus" size={12} /> Add server
            </span>
          </div>
          <div className="mt-4 divide-y divide-line rounded-xl border border-line">
            {servers.map((s) => (
              <div key={s.name} className="grid grid-cols-[1fr_80px] items-center gap-4 px-4 py-3 sm:grid-cols-[1fr_110px_110px]">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="size-2 shrink-0 rounded-full bg-ok" />
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium">{s.name}</p>
                    <p className="text-[11px] text-subtle">{s.os}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-subtle">CPU {s.cpu}%</p>
                  <Bar value={s.cpu} />
                </div>
                <div className="hidden space-y-1 sm:block">
                  <p className="text-[10px] text-subtle">Memory {s.mem}%</p>
                  <Bar value={s.mem} tone="bg-black/30" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Window>
  );
}

export function DeployShot() {
  const steps = [
    ["Cloned main @ a1c9f2e", "3s"],
    ["Built image with Dockerfile", "38s"],
    ["Ran release command: migrate", "4s"],
    ["Health check passed on :3001", "2s"],
  ];
  return (
    <div className="relative mx-auto max-w-[420px]">
      <Window className="p-5 sm:pb-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandChip name="Next.js" size={28} className="rounded-lg" />
            <div>
              <p className="text-[13px] font-semibold">storefront</p>
              <p className="text-[11px] text-subtle">Deploying from GitHub</p>
            </div>
          </div>
          <Chip tone="ok">Live</Chip>
        </div>
        <ol className="mt-5 space-y-3">
          {steps.map(([label, time]) => (
            <li key={label} className="flex items-center gap-2.5 text-[12px]">
              <span className="flex size-4 items-center justify-center rounded-full bg-ok/10 text-ok">
                <Icon name="check" size={10} strokeWidth={3} />
              </span>
              <span className="flex-1 text-fg">{label}</span>
              <span className="text-[11px] text-subtle tabular-nums">{time}</span>
            </li>
          ))}
          <li className="flex items-center gap-2.5 text-[12px]">
            <span className="flex size-4 items-center justify-center rounded-full bg-accent/10">
              <span className="size-1.5 rounded-full bg-accent" />
            </span>
            <span className="flex-1 font-medium text-fg">Switched traffic, no downtime</span>
          </li>
        </ol>
      </Window>
      <Window className="mt-3 flex items-center gap-3 px-4 py-3 sm:absolute sm:-right-8 sm:-bottom-7 sm:mt-0 sm:w-72">
        <Icon name="git-branch" size={16} className="text-accent" />
        <div className="min-w-0">
          <p className="text-[12px] font-medium">Preview for PR #42</p>
          <p className="truncate text-[11px] text-subtle">pr-42.storefront.example.com</p>
        </div>
      </Window>
    </div>
  );
}

export function MonitorShot() {
  const points = [30, 34, 31, 42, 38, 46, 44, 58, 52, 61, 57, 66, 62, 70, 64];
  const path = points.map((v, i) => `${i ? "L" : "M"}${(i * 300) / (points.length - 1)},${80 - v}`).join(" ");
  return (
    <div className="relative mx-auto max-w-[440px]">
      <Window className="p-5 sm:pb-16">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold">web-2 · CPU</p>
          <span className="text-[11px] text-subtle">Last hour</span>
        </div>
        <svg viewBox="0 0 300 80" className="mt-4 h-28 w-full" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="shot-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#4338ca" stopOpacity="0.14" />
              <stop offset="1" stopColor="#4338ca" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L300,80 L0,80 Z`} fill="url(#shot-fill)" />
          <path d={path} fill="none" stroke="#4338ca" strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-[11px]">
          {[
            ["CPU", "64%"],
            ["Memory", "71%"],
            ["Disk", "86%"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-subtle">{k}</p>
              <p className={cn("mt-0.5 text-[14px] font-semibold tabular-nums", k === "Disk" && "text-warn")}>{v}</p>
            </div>
          ))}
        </div>
      </Window>
      <Window className="mt-3 flex items-start gap-3 px-4 py-3 sm:absolute sm:-bottom-7 sm:-left-8 sm:mt-0 sm:w-72">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-warn/10 text-warn">
          <Icon name="bell" size={12} />
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-medium">Disk above 85% on web-2</p>
          <p className="text-[11px] text-subtle">Sent to Telegram and email</p>
        </div>
      </Window>
    </div>
  );
}

export function DatabaseShot() {
  const dbs: [Brand, string, string][] = [
    ["PostgreSQL", "orders", "2.4 GB"],
    ["MySQL", "wordpress", "640 MB"],
    ["Redis", "sessions", "38 MB"],
  ];
  return (
    <Window className="mx-auto max-w-[440px] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold">Databases</p>
        <span className="text-[11px] text-subtle">3 engines</span>
      </div>
      <div className="mt-4 space-y-2">
        {dbs.map(([brand, name, size]) => (
          <div key={name} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
            <BrandChip name={brand} size={28} className="rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium">{name}</p>
              <p className="text-[11px] text-subtle">
                {brand} · {size}
              </p>
            </div>
            <Chip tone="ok">
              <Icon name="check" size={9} strokeWidth={3} /> Backup verified
            </Chip>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-[#fafafa] p-3 font-mono text-[11px] leading-5 text-muted">
        <span className="text-accent">select</span> count(*) <span className="text-accent">from</span> orders;
        <p className="text-fg">→ 128,406 rows · 12 ms</p>
      </div>
    </Window>
  );
}

export function SecurityShot() {
  const rows: [boolean, string, string, string][] = [
    [true, "app.deploy", "storefront", "2m ago"],
    [true, "database.user.create", "orders · reporting", "14m ago"],
    [false, "database.query", "rejected · read-only role", "1h ago"],
    [true, "backup.restore.verify", "orders", "3h ago"],
  ];
  return (
    <Window className="mx-auto max-w-[460px] overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <p className="text-[13px] font-semibold">Audit log</p>
        <Chip tone="accent">
          <Icon name="shield-check" size={10} /> MFA on
        </Chip>
      </div>
      <div className="divide-y divide-line">
        {rows.map(([ok, action, target, when]) => (
          <div key={action} className="flex items-center gap-3 px-5 py-3">
            <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", ok ? "bg-ok/10 text-ok" : "bg-err/10 text-err")}>
              <Icon name={ok ? "check" : "x"} size={10} strokeWidth={3} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11.5px] text-fg">{action}</p>
              <p className="truncate text-[11px] text-subtle">{target}</p>
            </div>
            <span className="text-[11px] text-subtle">{when}</span>
          </div>
        ))}
      </div>
    </Window>
  );
}
