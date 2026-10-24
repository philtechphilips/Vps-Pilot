import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { BrandChip, type Brand } from "@/components/brand-chip";
import { CommandPill } from "@/components/copy-button";
import { Icon, type IconName } from "@/components/icons";
import { TerminalMock } from "@/components/marketing/mocks";
import { DatabaseShot, DeployShot, HeroShot, MonitorShot, SecurityShot, ShotPanel } from "@/components/marketing/shots";
import { cn } from "@/lib/utils";

// Installs the control plane (dashboard, API, database, HTTPS) on Ubuntu/Debian.
const INSTALL =
  "curl -fsSL https://raw.githubusercontent.com/philtechphilips/VPS-PIlot-BE/main/deploy/install.sh | sudo bash -s -- --domain pilot.example.com";

/** Stagger delay for reveal animations. */
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="mx-auto max-w-[1080px] space-y-28 px-4 py-24 sm:space-y-40 sm:px-6 sm:py-32">
        <Feature
          id="deploy"
          title="Deploy from Git, without touching SSH"
          desc="Connect a repository and VPSPilot builds, health-checks and switches traffic for you. Docker, Compose, Node.js or Python, on servers you already own."
          points={[
            { icon: "refresh", lead: "Zero downtime:", text: "the new release takes traffic only after it passes its health check." },
            { icon: "git-branch", lead: "Previews per pull request,", text: "each on its own address, removed when the PR closes." },
            { icon: "rollback", lead: "Roll back in one click", text: "to any earlier release that is still on the server." },
          ]}
          cta={{ label: "Deploy your first app", href: "/docs/getting-started/install" }}
          shot={<DeployShot />}
        />
        <Feature
          id="monitor"
          flip
          title="Know when something breaks, before your users do"
          desc="Every server reports CPU, memory, disk and app health. Set a rule once and get told on Telegram, Slack or email the moment it trips."
          points={[
            { icon: "activity", lead: "Live metrics", text: "for every server and app, kept for 30 days." },
            { icon: "bell", lead: "Alerts where you are:", text: "Telegram, Slack, Discord, email or a webhook." },
            { icon: "calendar", lead: "A weekly report", text: "with uptime, deploys, errors and disk growth." },
          ]}
          cta={{ label: "See monitoring", href: "/dashboard/monitoring" }}
          shot={<MonitorShot />}
        />
        <Feature
          id="databases"
          title="Your databases, managed from the browser"
          desc="Create and register PostgreSQL, MySQL, MariaDB and Redis. Run queries, manage users and keep encrypted backups that are restored to prove they work."
          points={[
            { icon: "database", lead: "Query and browse", text: "with read-only roles for the people who only need to look." },
            { icon: "archive", lead: "Encrypted backups", text: "to S3, R2 or Backblaze, on the schedule you set." },
            { icon: "check-circle", lead: "Restore-verified:", text: "a backup counts only once it has been restored." },
          ]}
          cta={{ label: "Explore databases", href: "/dashboard/databases" }}
          shot={<DatabaseShot />}
        />
        <Feature
          id="security"
          flip
          title="Safe by default, with a record of every change"
          desc="Agents only dial out, so your servers expose nothing new. Every action is a typed job, never a raw shell, and lands in the audit log."
          points={[
            { icon: "network", lead: "Outbound-only agents:", text: "no inbound port, no Docker socket on the web." },
            { icon: "fingerprint", lead: "MFA and roles", text: "for the owner, admins and read-only viewers." },
            { icon: "file-text", lead: "Full audit trail:", text: "who did what, to which target, and how it went." },
          ]}
          cta={{ label: "Read the security model", href: "/docs/concepts/security" }}
          shot={<SecurityShot />}
        />
        <GetStarted />
        <Stack />
        <Faq />
      </div>
      <FinalCta />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function Pill({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("btn-primary group inline-flex h-10 items-center gap-1.5 rounded-full pr-3.5 pl-5 text-[14px] font-medium", className)}>
      {children}
      <Icon name="chevron-right" size={15} className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function Heading({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("text-[30px] leading-[1.15] font-medium tracking-[-0.025em] text-balance sm:text-[36px]", className)}>{children}</h2>;
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="px-4 pt-16 sm:px-6 sm:pt-24">
      <div className="mx-auto max-w-[720px] text-center">
        <Link
          href="/docs"
          className="rise-in inline-flex items-center gap-2 rounded-full border border-line py-1 pr-3 pl-1 text-[13px] text-muted transition-colors hover:text-fg"
          style={d(0)}
        >
          <span className="rounded-full bg-accent/[0.08] px-2 py-0.5 text-xs font-medium text-accent">New</span>
          Previews, app moves and status pages
          <Icon name="chevron-right" size={13} />
        </Link>
        <h1 className="rise-in mt-7 text-[42px] leading-[1.06] font-medium tracking-[-0.035em] text-balance sm:text-[60px]" style={d(100)}>
          The control plane for your own servers
        </h1>
        <p className="rise-in mx-auto mt-5 max-w-[520px] text-[16px] leading-relaxed text-muted sm:text-[17px]" style={d(200)}>
          Deploy apps, watch your servers and run your databases from one dashboard you host yourself. No SSH sessions, no surprise bills.
        </p>
        <div className="rise-in mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5" style={d(300)}>
          <Pill href="/docs/getting-started/install">Get started</Pill>
          <Link href="/dashboard" className="inline-flex h-10 items-center gap-1 text-[14px] font-medium text-fg transition-colors hover:text-accent">
            Open the demo <Icon name="chevron-right" size={15} />
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-16 max-w-[1180px] sm:mt-20">
        <ShotPanel className="px-4 pt-10 pb-0 sm:px-12 sm:pt-14">
          <HeroShot className="rounded-b-none border-b-0" />
        </ShotPanel>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Feature rows                                                        */
/* ------------------------------------------------------------------ */

type Point = { icon: IconName; lead: string; text: string };

function Feature({
  id,
  title,
  desc,
  points,
  cta,
  shot,
  flip,
}: {
  id: string;
  title: string;
  desc: string;
  points: Point[];
  cta: { label: string; href: string };
  shot: ReactNode;
  flip?: boolean;
}) {
  return (
    <section id={id} className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={cn(flip && "lg:order-2")}>
        <ShotPanel className="flex min-h-[380px] items-center justify-center sm:min-h-[440px]">{shot}</ShotPanel>
      </div>
      <div data-reveal style={d(100)} className={cn("max-w-[440px]", flip && "lg:order-1")}>
        <Heading>{title}</Heading>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">{desc}</p>
        <ul className="mt-6 space-y-3.5">
          {points.map((p) => (
            <li key={p.lead} className="flex gap-3 text-[14px] leading-relaxed text-muted">
              <Icon name={p.icon} size={16} className="mt-[3px] shrink-0 text-accent" />
              <span>
                <span className="font-medium text-fg">{p.lead}</span> {p.text}
              </span>
            </li>
          ))}
        </ul>
        <Pill href={cta.href} className="mt-8">
          {cta.label}
        </Pill>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Getting started                                                     */
/* ------------------------------------------------------------------ */

function GetStarted() {
  const steps = [
    { title: "Install", desc: "One command on a fresh Ubuntu or Debian VPS." },
    { title: "Secure", desc: "Create the owner account and turn on MFA." },
    { title: "Enroll", desc: "Add each server with a single-use token." },
  ];
  return (
    <section id="get-started" className="scroll-mt-24">
      <div data-reveal className="mx-auto max-w-[560px] text-center">
        <Heading>Up and running in five minutes</Heading>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          VPSPilot installs on your own server with one command, then adds your other servers with a single-use token each.
        </p>
        <div className="mt-7 flex justify-center">
          <CommandPill command={INSTALL} className="w-full max-w-[520px] rounded-full border-line bg-white pl-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]" />
        </div>
      </div>
      <ShotPanel className="mt-12">
        <div className="mx-auto grid max-w-[880px] items-center gap-8 lg:grid-cols-[1fr_260px]">
          <TerminalMock />
          <ol className="space-y-5">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-3.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-semibold text-accent shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_0_0_1px_rgb(0_0_0/0.06)]">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[14px] font-medium">{s.title}</p>
                  <p className="mt-0.5 text-[13px] text-muted">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </ShotPanel>
    </section>
  );
}

const stack: Brand[] = ["Ubuntu", "Debian", "Docker", "Node.js", "Next.js", "Python", "FastAPI", "Go", "Bun", "PostgreSQL", "MySQL", "Redis"];

function Stack() {
  return (
    <section data-reveal className="text-center">
      <p className="text-[14px] text-muted">Works with the stack you already run</p>
      <div className="mx-auto mt-6 flex max-w-[760px] flex-wrap justify-center gap-x-6 gap-y-4">
        {stack.map((b) => (
          <span key={b} className="inline-flex items-center gap-2 text-[13px] text-muted">
            <BrandChip name={b} size={22} className="rounded-md" />
            {b}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ and closing                                                     */
/* ------------------------------------------------------------------ */

const faqs = [
  {
    q: "Where does VPSPilot run?",
    a: "On a server you own. The installer sets up the dashboard, API, database and HTTPS on one Ubuntu or Debian machine, and that machine can host apps too.",
  },
  {
    q: "Do I need to open any ports on my servers?",
    a: "No. The agent on each server makes outbound HTTPS requests to your control plane and never listens for connections.",
  },
  {
    q: "What can I deploy?",
    a: "Anything with a Dockerfile or a Compose file, plus Node.js and Python apps that run natively under systemd. Static sites work too.",
  },
  {
    q: "What happens if the control plane goes down?",
    a: "Your apps keep running. Agents retry quietly and catch up when the control plane is back, and each job is checked against the server's real state.",
  },
  {
    q: "Is it free?",
    a: "Yes. VPSPilot is open source and self-hosted, so you only pay for the servers you already rent.",
  },
];

function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-[720px] scroll-mt-24">
      <Heading className="text-center">Questions, answered</Heading>
      <div className="mt-10 divide-y divide-line border-y border-line">
        {faqs.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
              {f.q}
              <Icon name="plus" size={16} className="shrink-0 text-subtle transition-transform group-open:rotate-45" />
            </summary>
            <p className="mt-3 max-w-[600px] text-[14px] leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 pb-24 sm:px-6 sm:pb-32">
      <div data-reveal className="mx-auto max-w-[1080px] rounded-[28px] bg-[#f4f4f5] px-6 py-20 text-center sm:py-24">
        <Heading>Your servers. Your control plane.</Heading>
        <p className="mx-auto mt-4 max-w-md text-[15px] text-muted">Open source and self-hosted. Nothing leaves your infrastructure unless you send it.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
          <Pill href="/docs/getting-started/install">Install VPSPilot</Pill>
          <Link href="/docs" className="inline-flex h-10 items-center gap-1 text-[14px] font-medium text-fg transition-colors hover:text-accent">
            Read the docs <Icon name="chevron-right" size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
