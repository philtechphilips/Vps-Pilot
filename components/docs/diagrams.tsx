// Diagrams for the docs, drawn with the same cards and icons as the rest of
// the site (no diagram library). They stack vertically on narrow screens.

import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "ok" | "err" | "blue" | "warn";

const toneRing: Record<Tone, string> = {
  neutral: "border-black/[0.1] bg-black/[0.03]",
  accent: "border-accent/40 bg-accent/[0.08]",
  ok: "border-ok/35 bg-ok/[0.07]",
  err: "border-err/35 bg-err/[0.07]",
  blue: "border-blue/35 bg-blue/[0.07]",
  warn: "border-warn/35 bg-warn/[0.07]",
};

const toneIcon: Record<Tone, string> = {
  neutral: "text-muted",
  accent: "text-accent-fg",
  ok: "text-ok",
  err: "text-err",
  blue: "text-blue-fg",
  warn: "text-warn",
};

function Frame({ title, children, caption }: { title: string; children: ReactNode; caption?: ReactNode }) {
  return (
    <figure className="my-6 overflow-hidden rounded-xl border border-black/[0.08] bg-inset">
      <div className="flex h-10 items-center border-b border-black/[0.06] bg-black/[0.02] px-4">
        <span className="font-mono text-xs text-subtle">{title}</span>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
      {caption && <figcaption className="border-t border-black/[0.06] px-4 py-3 text-xs leading-5 text-subtle sm:px-6">{caption}</figcaption>}
    </figure>
  );
}

function Node({
  icon,
  title,
  sub,
  tone = "neutral",
  compact,
  className,
}: {
  icon?: IconName;
  title: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  compact?: boolean; // icon only on narrow screens, where the row stacks
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2.5", compact && "sm:justify-center sm:px-2 sm:text-center", toneRing[tone], className)}>
      {icon && (
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md border border-black/10 bg-black/[0.04]", compact && "sm:hidden")}>
          <Icon name={icon} size={14} className={toneIcon[tone]} />
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-fg">{title}</span>
        {sub && <span className="block font-mono text-[11px] leading-4 break-words text-subtle">{sub}</span>}
      </span>
    </div>
  );
}

/** A connector that runs right on wide screens and down on narrow ones. */
function Flow({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn("relative flex shrink-0 items-center justify-center text-subtle", "h-9 flex-col sm:h-auto sm:w-14 sm:flex-row", className)}>
      <span className="h-full w-px bg-black/20 sm:h-px sm:w-auto sm:flex-1" />
      <Icon name="chevron-right" size={12} className="-mt-1.5 rotate-90 sm:mt-0 sm:-ml-1.5 sm:rotate-0" />
      {label && (
        <span className="absolute top-1/2 left-1/2 ml-2 -translate-y-1/2 bg-inset font-mono text-[10px] whitespace-nowrap text-subtle sm:top-auto sm:bottom-full sm:left-1/2 sm:mb-1 sm:ml-0 sm:-translate-x-1/2 sm:translate-y-0 sm:bg-transparent">
          {label}
        </span>
      )}
    </div>
  );
}

function Server({ name, apps }: { name: string; apps: { icon: IconName; title: string; sub: string }[] }) {
  return (
    <div className="rounded-xl border border-black/[0.08] bg-black/[0.015] p-3">
      <div className="mb-3 flex items-center gap-2 px-1 text-[12px] text-muted">
        <Icon name="server" size={13} />
        <span className="font-mono">{name}</span>
        <span className="ml-auto text-[11px] text-subtle">Ubuntu / Debian</span>
      </div>
      <div className="grid gap-2">
        <Node icon="activity" title="vpspilot-agent" sub="user vpspilot · outbound only" tone="accent" />
        <div className="flex items-center gap-2 pl-6 font-mono text-[10px] text-subtle">
          <span className="h-4 w-px bg-black/20" />
          Unix socket · allowlisted operations
        </div>
        <Node icon="shield" title="vpspilot-helper" sub="root · no shell" tone="warn" />
        <div className="grid grid-cols-2 gap-2 pt-1">
          {apps.map((a) => (
            <Node key={a.title} icon={a.icon} title={a.title} sub={a.sub} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** How the control plane, agents and servers fit together. */
export function TopologyDiagram() {
  return (
    <Frame
      title="architecture"
      caption="Agents only connect out to the control plane, so servers need no inbound port for VPSPilot. The helper does privileged work for the agent, from a fixed list of operations."
    >
      <div className="rounded-xl border border-dashed border-black/[0.12] p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-2 text-[12px] text-muted">
          <Icon name="layers" size={13} />
          Control plane
          <span className="ml-auto font-mono text-[11px] text-subtle">pilot.example.com</span>
        </div>
        <div className="flex flex-col items-stretch sm:flex-row sm:items-center">
          <Node icon="monitor" title="Browser" sub="you" compact className="sm:min-w-0 sm:flex-1" />
          <Flow label="HTTPS" />
          <Node icon="grid" title="Dashboard" sub="Next.js" compact className="sm:min-w-0 sm:flex-1" />
          <Flow label="/api/*" />
          <Node icon="zap" title="API" sub="FastAPI" tone="accent" compact className="sm:min-w-0 sm:flex-1" />
          <Flow />
          <Node icon="database" title="PostgreSQL" sub="state" compact className="sm:min-w-0 sm:flex-1" />
        </div>
      </div>

      <div className="my-2 flex flex-col items-center text-subtle">
        <Icon name="chevron-right" size={12} className="-rotate-90" />
        <span className="h-5 w-px bg-black/20" />
        <span className="rounded-full border border-black/10 bg-bg px-3 py-1 font-mono text-[10px] text-muted">
          outbound HTTPS · heartbeat · metrics · jobs
        </span>
        <span className="h-5 w-px bg-black/20" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Server
          name="server-1"
          apps={[
            { icon: "container", title: "Your apps", sub: "Docker · systemd" },
            { icon: "globe", title: "Caddy", sub: "domains · TLS" },
          ]}
        />
        <Server
          name="server-2"
          apps={[
            { icon: "database", title: "Databases", sub: "vpdb-*" },
            { icon: "archive", title: "Backups", sub: "encrypted" },
          ]}
        />
      </div>
    </Frame>
  );
}

function State({ name, tone, note }: { name: string; tone: Tone; note?: string }) {
  return (
    <div className={cn("rounded-lg border px-3 py-2 text-center", toneRing[tone])}>
      <span className={cn("block font-mono text-[13px]", toneIcon[tone])}>{name}</span>
      {note && <span className="mt-0.5 block text-[11px] leading-4 text-subtle">{note}</span>}
    </div>
  );
}

/** queued → running → succeeded | failed, and the ways a job ends early. */
export function JobStatesDiagram() {
  return (
    <Frame title="job states">
      <div className="flex flex-col items-stretch gap-0 sm:flex-row sm:items-center">
        <State name="queued" tone="blue" note="waiting for the agent" />
        <Flow label="claimed" />
        <State name="running" tone="accent" note="events stream in" />
        <Flow label="done" />
        <div className="grid gap-2 sm:w-44">
          <State name="succeeded" tone="ok" />
          <State name="failed" tone="err" note="error kept on the job" />
        </div>
      </div>
      <div className="mt-5 grid gap-2 border-t border-black/[0.06] pt-4 sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] whitespace-nowrap text-subtle">queued →</span>
          <State name="canceled" tone="neutral" note="canceled before it started" />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] whitespace-nowrap text-subtle">queued →</span>
          <State name="expired" tone="neutral" note="never claimed in time" />
        </div>
      </div>
    </Frame>
  );
}
