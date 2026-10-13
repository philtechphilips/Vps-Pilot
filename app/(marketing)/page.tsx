import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { BrandChip, type Brand } from "@/components/brand-chip";
import { CodeTexture } from "@/components/code-texture";
import { CommandPill } from "@/components/copy-button";
import { Icon, type IconName } from "@/components/icons";
import { FleetIllustration, HeroWordmark, PipelineIllustration, TopologyIllustration } from "@/components/marketing/illustrations";
import { TerminalMock } from "@/components/marketing/mocks";
import { ProductTour } from "@/components/marketing/product-tour";
import { Logotype } from "@/components/logo";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/utils";

const INSTALL = "curl -fsSL https://get.vpspilot.dev | sh";

/** Stagger delay for reveal / keyframe animations. */
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Everything below the hero lives in an inset panel, like the dashboard's content area. */}
      <div className="px-2 sm:px-3">
        <div
          data-reveal
          data-motion="scale"
          className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[28px] border border-white/[0.06] bg-panel pb-24 sm:pb-32"
        >
          <Features />
          <RunsOn />
          <ProductTour />
          <Foundation />
          <Security />
          <RecentlyShipped />
          <GetStarted />
        </div>
      </div>
      <FinalCta />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function IconTile({ icon, className, size = 16 }: { icon: IconName; className?: string; size?: number }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-[#111] text-muted shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] transition-colors group-hover:text-accent-fg",
        className,
      )}
    >
      <Icon name={icon} size={size} />
    </span>
  );
}

function SectionHead({ eyebrow, icon, title, desc, center }: { eyebrow: string; icon: IconName; title: ReactNode; desc?: ReactNode; center?: boolean }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <span data-reveal className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#232323] py-1 pr-3 pl-1 text-xs text-accent-fg">
        <span className="flex size-5 items-center justify-center rounded-full bg-accent/25">
          <Icon name={icon} size={11} />
        </span>
        {eyebrow}
      </span>
      <h2 data-reveal style={d(80)} className="mt-4 text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[40px]">
        {title}
      </h2>
      {desc && (
        <p data-reveal style={d(160)} className={cn("mt-3 max-w-lg text-[15px] leading-relaxed text-muted", center && "mx-auto")}>
          {desc}
        </p>
      )}
    </div>
  );
}

const card = "rounded-2xl border border-white/[0.06] bg-[#232323]";
const inset = "relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#060606]";

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Announcement() {
  return (
    <div className="relative flex justify-center px-4 pt-6">
      <span className="word-in" style={d(100)}>
      <Link
        href="#changelog"
        className="border-spin inline-flex items-center gap-3 rounded-full py-1 pr-3 pl-1 text-[13px] text-muted transition-colors hover:text-fg"
      >
        <span className="btn-primary rounded-full px-2 py-0.5 text-xs font-medium">New</span>
        VPSPilot 1.1 — Database Management Center
        <Icon name="arrow-right" size={14} />
      </Link>
      </span>
    </div>
  );
}

function Words({ text, start, step = 70 }: { text: string; start: number; step?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className="word-in" style={d(start + i * step)}>
          {w}
          {i < words.length - 1 && " "}
        </span>
      ))}
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-x-clip pb-24 sm:pb-32">
      <div
        className="pointer-events-none absolute top-[-220px] left-1/2 h-[640px] w-[1000px] -translate-x-1/2 animate-[breathe_9s_ease-in-out_infinite] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgb(165 76 162 / 0.28), transparent)" }}
        aria-hidden="true"
      />
      <CodeTexture seed={11} drift className="opacity-60 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_35%,black,transparent)]" />
      <Announcement />
      <div className="relative mx-auto max-w-[1180px] px-4 pt-10 sm:px-6 sm:pt-14">
        <div className="mx-auto max-w-[760px]">
          <HeroWordmark />
        </div>
        <div className="relative -mt-[2%] text-center">
          <h1 className="text-[40px] leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-6xl md:text-[64px]">
            <Words text="The Control Plane" start={500} />
            <br />
            <Words text="for your VPS" start={710} />
          </h1>
          <p className="word-in mx-auto mt-6 max-w-[540px] text-base text-muted sm:text-lg" style={d(950)}>
            Self-hosted on your own server. VPSPilot lets you{" "}
            <span className="font-medium text-fg">deploy apps, monitor servers and administer databases</span> from one secure dashboard —
            without routinely using SSH.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <span className="word-in w-full sm:w-auto" style={d(1080)}>
              <ButtonLink href="/setup" variant="primary" size="lg" className="w-full rounded-xl sm:w-auto" iconRight="arrow-right">
                Get started
              </ButtonLink>
            </span>
            <span className="word-in w-full sm:w-auto" style={d(1160)}>
              <ButtonLink href="/dashboard" variant="secondary" size="lg" className="w-full rounded-xl border-white/10 bg-[#141414] sm:w-auto">
                Open the demo
              </ButtonLink>
            </span>
          </div>
          <div className="word-in mt-6 flex justify-center" style={d(1260)}>
            <CommandPill command={INSTALL} className="rounded-xl border-white/10 bg-[#0d0d0d]" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

const featureLinks: { icon: IconName; title: string; desc: string }[] = [
  { icon: "server", title: "Server Inventory", desc: "OS, agent version, heartbeat, CPU, RAM, disk, network and service health." },
  { icon: "key", title: "Secure Enrollment", desc: "Single-use, short-lived tokens with per-agent identity and revocation." },
  { icon: "layers", title: "Durable Jobs", desc: "Typed, expiring jobs that reconcile against real host state after restarts." },
  { icon: "terminal", title: "Native Runtimes", desc: "Node.js and Python as versioned releases under systemd, optional PM2." },
  { icon: "globe", title: "Domains & TLS", desc: "Validated proxy config before reload, with certificate expiry tracking." },
  { icon: "file-text", title: "Logs", desc: "Bounded, redacted journald and container logs by server, app and level." },
  { icon: "archive", title: "Backups & Restore", desc: "Encrypted off-host backups with checksums and restore verification." },
  { icon: "shield", title: "Audit Trail", desc: "Actor, target, result and correlation ID for every privileged action." },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-[1180px] scroll-mt-24 px-4 pt-20 sm:px-8 sm:pt-28">
      <SectionHead
        eyebrow="Platform"
        icon="grid"
        title="Everything you need to run servers without SSH"
        desc="One dashboard on your own VPS for the whole lifecycle: enroll, deploy, observe, back up and audit."
      />
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <IllustratedCard i={0} title="Server Fleet" icon="server" desc="Enroll the control-plane host and any Ubuntu or Debian VPS. See every machine’s health at a glance." illo={<FleetIllustration />} seed={1} />
        <IllustratedCard i={1} title="Deploy Pipeline" icon="rocket" desc="Build pinned sources in isolation, health-check the candidate, then promote — or keep the last good release." illo={<PipelineIllustration />} seed={2} />
        <IllustratedCard i={2} title="Agent Topology" icon="network" desc="Agents dial out over HTTPS. No inbound listener, no Docker socket or database port exposed to the browser." illo={<TopologyIllustration />} seed={4} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featureLinks.map((f, i) => (
          <a
            key={f.title}
            href="#product"
            data-reveal
            data-spot
            style={d((i % 3) * 90)}
            className={cn(card, "group overflow-hidden p-5 transition-colors hover:border-white/12")}
          >
            <Icon
              name={f.icon}
              size={84}
              strokeWidth={0.8}
              className="pointer-events-none absolute -right-4 -bottom-6 text-white/[0.04] transition-all duration-500 group-hover:-translate-y-1 group-hover:text-accent/15"
            />
            <IconTile icon={f.icon} />
            <h3 className="mt-4 flex items-center gap-1.5 text-sm font-medium">
              {f.title}
              <Icon name="arrow-right" size={13} className="text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{f.desc}</p>
          </a>
        ))}
        <Link
          href="#product"
          data-reveal
          style={d(180)}
          className="btn-primary group relative flex min-h-44 flex-col justify-between overflow-hidden rounded-2xl p-5 text-white"
        >
          <span
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-[sweep_4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent"
            aria-hidden="true"
          />
          <Icon name="database" size={130} strokeWidth={0.7} className="pointer-events-none absolute -right-6 -bottom-8 text-white/15 transition-transform duration-700 group-hover:-rotate-6" />
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/15">
            <Icon name="sparkles" className="animate-[blink_2.4s_ease-in-out_infinite]" />
          </span>
          <span className="relative">
            <span className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              Database Center <Icon name="arrow-right" size={18} className="transition-transform group-hover:translate-x-1" />
            </span>
            <span className="mt-1 block text-[13px] text-white/80">PostgreSQL, MySQL, MariaDB and Redis — new in 1.1.</span>
          </span>
        </Link>
      </div>
    </section>
  );
}

function IllustratedCard({ title, desc, illo, icon, seed, i }: { title: string; desc: string; illo: ReactNode; icon: IconName; seed: number; i: number }) {
  return (
    <a href="#product" data-reveal data-spot style={d(i * 120)} className={cn(card, "group block p-2 transition-colors hover:border-white/12")}>
      <div className={cn(inset, "aspect-[16/10]")}>
        <CodeTexture seed={seed} drift className="opacity-70" />
        <div className="relative h-full transition-transform duration-700 group-hover:scale-[1.04]">{illo}</div>
      </div>
      <div className="flex gap-3 p-3 pt-4">
        <IconTile icon={icon} />
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-medium">
            {title}
            <Icon name="arrow-right" size={13} className="text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{desc}</p>
        </div>
      </div>
    </a>
  );
}

const runsOn: Brand[] = ["Ubuntu", "Debian", "Docker", "systemd", "PM2", "Nginx", "Caddy", "PostgreSQL", "MySQL", "MariaDB", "Redis"];

function RunsOn() {
  return (
    <section className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-8">
      <div data-reveal className={cn(card, "flex flex-col gap-5 overflow-hidden p-5 lg:flex-row lg:items-center")}>
        <p className="flex shrink-0 items-center gap-3 text-sm text-muted">
          <IconTile icon="layers" />
          Works with the stack you already run
        </p>
        <div className="marquee-mask group min-w-0 flex-1 overflow-hidden">
          <div className="flex w-max animate-[marquee_36s_linear_infinite] gap-2 group-hover:[animation-play-state:paused]">
            {[...runsOn, ...runsOn].map((b, i) => (
              <span
                key={i}
                aria-hidden={i >= runsOn.length}
                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#111] py-1 pr-3 pl-1 text-[13px] text-muted transition-colors hover:text-fg"
              >
                <BrandChip name={b} size={20} className="rounded-md" />
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Foundation & security                                               */
/* ------------------------------------------------------------------ */

function Foundation() {
  const items: { icon: IconName; title: string; desc: string; tag: string }[] = [
    { icon: "zap", title: "FastAPI", tag: "API", desc: "Typed, validated control API with Pydantic. Long-running actions return 202 Accepted and a job ID." },
    { icon: "database", title: "PostgreSQL + Alembic", tag: "Metadata", desc: "Durable metadata, jobs and audit history with versioned migrations and UUID identities." },
    { icon: "terminal", title: "Python Agent", tag: "Agent", desc: "A lightweight systemd service with fixed, typed operations and a narrow privileged helper." },
  ];
  return (
    <section className="mx-auto max-w-[1180px] px-4 pt-24 sm:px-8 sm:pt-36">
      <SectionHead eyebrow="Foundation" icon="layers" title="Built on boring, proven tooling" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {items.map((it, i) => (
          <a
            key={it.title}
            href="#docs"
            data-reveal
            data-spot
            style={d(i * 120)}
            className={cn(card, "group overflow-hidden p-6 transition-colors hover:border-white/12")}
          >
            <Icon
              name={it.icon}
              size={120}
              strokeWidth={0.7}
              className="pointer-events-none absolute -right-6 -bottom-8 text-white/[0.04] transition-all duration-700 group-hover:-translate-y-2 group-hover:rotate-6 group-hover:text-accent/15"
            />
            <div className="flex items-center justify-between">
              <IconTile icon={it.icon} className="size-11 text-fg" size={18} />
              <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-subtle">{it.tag}</span>
            </div>
            <h3 className="mt-10 flex items-center gap-1.5 text-[15px] font-medium">
              {it.title} <Icon name="arrow-right" size={14} className="text-subtle transition-transform group-hover:translate-x-0.5" />
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{it.desc}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function Security() {
  const items: { icon: IconName; title: string; desc: string }[] = [
    { icon: "network", title: "Outbound-only agents", desc: "No public inbound listener. Agents poll the control plane over authenticated HTTPS." },
    { icon: "lock", title: "Encrypted secrets", desc: "Credentials encrypted with key material stored separately. Masked after entry." },
    { icon: "terminal", title: "No root shell", desc: "Every change is a typed, validated job — never an arbitrary command." },
    { icon: "shield-check", title: "Private by default", desc: "Database ports stay private. Remote targets need trusted registration and TLS." },
    { icon: "alert", title: "Confirm the destructive", desc: "Drops, flushes, overwrites and restores need typed confirmation." },
    { icon: "fingerprint", title: "MFA & session control", desc: "Owner MFA, login throttling and session revocation." },
  ];
  const audit = [
    { ok: true, text: "database.query.execute · 50 rows · 38ms" },
    { ok: false, text: "rejected · write on read-only role" },
    { ok: true, text: "backup.restore.verify · pg-restore-test" },
  ];
  return (
    <section id="security" className="mx-auto max-w-[1180px] scroll-mt-24 px-4 pt-24 sm:px-8 sm:pt-36">
      <SectionHead eyebrow="Security" icon="shield" title="Safe by default. Auditable by design." />
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <div data-reveal className={cn(inset, "flex min-h-72 flex-col justify-end p-6 lg:row-span-3")}>
          <CodeTexture seed={21} drift />
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-28 animate-[scan_6s_linear_infinite] bg-gradient-to-b from-transparent via-accent/[0.12] to-transparent"
            aria-hidden="true"
          />
          <Icon name="shield-check" size={220} strokeWidth={0.4} className="pointer-events-none absolute -top-6 -right-10 animate-[breathe_6s_ease-in-out_infinite] text-accent/25" />
          <div className="relative">
            <IconTile icon="shield" className="size-12 text-accent-fg" size={20} />
            <p className="mt-6 text-xl font-semibold tracking-tight">The browser never touches your hosts.</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              No Docker socket, no database port, no shell. Every change goes through the authorized API and a typed agent operation — and lands in the
              audit log.
            </p>
            <div className="mt-5 space-y-1.5 rounded-lg border border-white/[0.06] bg-[#111] p-3 font-mono text-[11px] text-muted">
              {audit.map((a, i) => (
                <div key={a.text} data-reveal style={d(400 + i * 220)}>
                  <span className={a.ok ? "text-ok" : "text-err"}>{a.ok ? "✓" : "✗"}</span> {a.text}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:row-span-3">
          {items.map((it, i) => (
            <div key={it.title} data-reveal data-spot style={d((i % 2) * 100 + Math.floor(i / 2) * 80)} className={cn(card, "group p-5")}>
              <IconTile icon={it.icon} />
              <h3 className="mt-4 text-sm font-medium">{it.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Changelog & getting started                                         */
/* ------------------------------------------------------------------ */

function RecentlyShipped() {
  return (
    <section id="changelog" className="mx-auto max-w-[1180px] scroll-mt-24 px-4 pt-24 sm:px-8 sm:pt-36">
      <SectionHead eyebrow="Changelog" icon="sparkles" title="Recently shipped" />
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <a href="#product" data-reveal data-spot className={cn(card, "group flex flex-col p-2 transition-colors hover:border-white/12")}>
          <div className={cn(inset, "grid flex-1 grid-cols-2 content-center gap-2 p-6 sm:grid-cols-3")}>
            <CodeTexture seed={31} drift />
            {(["PostgreSQL", "MySQL", "Redis", "MariaDB", "MongoDB", "SQLite"] as Brand[]).map((b, i) => (
              <div
                key={b}
                data-reveal
                data-motion="scale"
                style={d(200 + i * 90)}
                className={cn("relative flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#141414] p-3 text-xs", i > 3 && "opacity-40")}
              >
                <BrandChip name={b} size={24} className="rounded-lg" />
                <span className="truncate text-muted">{b}</span>
                {i < 4 && <span className="ml-auto size-1.5 animate-pulse rounded-full bg-ok" style={{ animationDelay: `${i * 300}ms` }} />}
              </div>
            ))}
          </div>
          <div className="p-4">
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] text-accent-fg">v1.1</span>
            <h3 className="mt-3 text-lg font-medium">Database Management Center</h3>
            <p className="mt-1 max-w-md text-[13px] text-muted">Register local, Dockerized or remote databases. Explore, query, manage users and verify restores.</p>
          </div>
        </a>
        <div className="grid gap-4">
          <ShippedCard title="Redis key browser" desc="SCAN-based, type-aware views. Flushes require explicit confirmation." seed={41} delay={120}>
            {[
              ["hash", "cart:user:1042", "text-[#f472b6]"],
              ["string", "rate:ip:203.0…", "text-[#60a5fa]"],
              ["zset", "leaderboard:weekly", "text-[#a78bfa]"],
              ["list", "queue:emails", "text-[#34d399]"],
            ].map(([t, k, c], i) => (
              <div key={k} data-reveal style={d(350 + i * 140)}>
                <span className={c}>{t}</span> {k}
              </div>
            ))}
          </ShippedCard>
          <ShippedCard title="Restore verification" desc="A backup isn’t done until it’s restored into a separate target." seed={51} delay={240}>
            {[
              ["▲ vpspilot backup verify pg-main", "text-subtle"],
              ["✓ checksum sha256:9c1e…f04a", ""],
              ["✓ restored → pg-restore-test", ""],
              ["✓ 128 tables · row counts match", "text-ok"],
            ].map(([t, c], i) => (
              <div key={t} data-reveal className={c} style={d(450 + i * 160)}>
                {t}
              </div>
            ))}
          </ShippedCard>
        </div>
      </div>
    </section>
  );
}

function ShippedCard({ title, desc, seed, delay, children }: { title: string; desc: string; seed: number; delay: number; children: ReactNode }) {
  return (
    <a href="#product" data-reveal data-spot style={d(delay)} className={cn(card, "group flex flex-col gap-4 p-2 transition-colors hover:border-white/12 sm:flex-row")}>
      <div className="flex flex-col justify-end p-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="mt-1 max-w-60 text-[13px] text-muted">{desc}</p>
      </div>
      <div className={cn(inset, "w-full p-4 font-mono text-[11px] leading-5 text-muted sm:ml-auto sm:max-w-72")}>
        <CodeTexture seed={seed} drift className="opacity-50" />
        <div className="relative">{children}</div>
      </div>
    </a>
  );
}

function GetStarted() {
  const steps = [
    { title: "Install the control plane", desc: "One command on a fresh Ubuntu or Debian VPS.", icon: "download" as const },
    { title: "Create the owner account", desc: "Strong password and MFA before production.", icon: "user" as const },
    { title: "Enroll your servers", desc: "Single-use token, one installer per host.", icon: "server" as const },
    { title: "Register databases", desc: "Point at existing PostgreSQL, MySQL or Redis.", icon: "database" as const },
  ];
  return (
    <section id="docs" className="mx-auto max-w-[1180px] scroll-mt-24 px-4 pt-24 sm:px-8 sm:pt-36">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:items-center">
        <div>
          <SectionHead eyebrow="Get started" icon="zap" title="Enroll a server in seconds" desc="Start with the host the control plane runs on, then add every other VPS you own." />
          <div data-reveal style={d(240)} className="mt-6 flex gap-2">
            <ButtonLink href="/setup" variant="primary" size="md" className="rounded-xl" iconRight="arrow-right">
              Get started
            </ButtonLink>
            <ButtonLink href="/dashboard/servers/new" variant="secondary" size="md" className="rounded-xl border-white/10 bg-[#141414]">
              See the enrollment flow
            </ButtonLink>
          </div>
        </div>
        <div data-reveal data-motion="scale" className={cn(card, "space-y-2 p-2")}>
          <TerminalMock />
          <div className="grid gap-2 sm:grid-cols-2">
            {steps.map((s, i) => (
              <div key={s.title} data-reveal style={d(300 + i * 120)} className="group flex gap-3 rounded-xl border border-white/[0.06] bg-panel p-4">
                <span className="relative">
                  <IconTile icon={s.icon} />
                  <span className="btn-primary absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full text-[9px] font-semibold">{i + 1}</span>
                </span>
                <div>
                  <h3 className="text-[13px] font-medium">{s.title}</h3>
                  <p className="mt-0.5 text-xs text-muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 size-[620px] -translate-x-1/2 -translate-y-1/2 animate-[breathe_8s_ease-in-out_infinite] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgb(165 76 162 / 0.22), transparent)" }}
        aria-hidden="true"
      />
      {/* Slowly counter-rotating orbit rings behind the logotype. */}
      <div className="pointer-events-none absolute top-[40%] left-1/2 size-[440px] -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
        <div className="absolute inset-0 animate-[spin_60s_linear_infinite] rounded-full border border-dashed border-white/[0.08]">
          <span className="absolute top-1/2 -left-1 size-2 rounded-full bg-accent-fg shadow-[0_0_12px_#e3a6e0]" />
        </div>
        <div className="absolute inset-12 animate-[spin_40s_linear_infinite_reverse] rounded-full border border-white/[0.05]">
          <span className="absolute -top-[3px] left-1/2 size-1.5 rounded-full bg-white/70" />
        </div>
        <div className="absolute inset-28 animate-[spin_25s_linear_infinite] rounded-full border border-dashed border-accent/25" />
      </div>
      <div className="relative mx-auto flex max-w-[1080px] flex-col items-center px-4 py-28 text-center sm:px-6 sm:py-40">
        <div data-reveal data-motion="scale">
          <Logotype className="animate-[shine-text_5s_linear_infinite] bg-[linear-gradient(110deg,#fff_35%,#e3a6e0_50%,#fff_65%)] bg-[length:250%_100%] bg-clip-text text-[44px] text-transparent sm:text-[64px]" />
        </div>
        <h2 data-reveal style={d(120)} className="mt-8 text-[28px] leading-tight font-semibold tracking-[-0.03em] sm:text-[40px]">
          Your servers. Your control plane.
        </h2>
        <p data-reveal style={d(220)} className="mt-4 max-w-md text-muted">
          Open source and self-hosted. Nothing leaves your infrastructure unless you send it.
        </p>
        <div data-reveal style={d(320)} className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <ButtonLink href="/setup" variant="primary" size="md" className="h-11 rounded-xl px-5" iconRight="arrow-right">
            Deploy VPSPilot
          </ButtonLink>
          <CommandPill command={INSTALL} className="rounded-xl border-white/10 bg-[#0d0d0d]" />
        </div>
      </div>
    </section>
  );
}
