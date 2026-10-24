"use client";

import { useParams } from "next/navigation";
import { Icon } from "@/components/icons";
import { usePublicStatus } from "@/lib/api/status";
import { cn } from "@/lib/utils";

const OVERALL = {
  up: { text: "All systems operational", tone: "border-ok/40 bg-ok/10 text-ok", icon: "check-circle" },
  degraded: { text: "Some systems are down", tone: "border-warn/40 bg-warn/10 text-warn", icon: "alert" },
  down: { text: "Major outage", tone: "border-err/40 bg-err/10 text-err", icon: "x-circle" },
} as const;

function barTone(uptime: number | null) {
  if (uptime === null) return "bg-white/10";
  if (uptime >= 99.5) return "bg-ok";
  if (uptime >= 95) return "bg-warn";
  return "bg-err";
}

function when(value: string) {
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function StatusView() {
  const { slug } = useParams<{ slug: string }>();
  const status = usePublicStatus(slug);
  const data = status.data;

  return (
    <main className="theme-console min-h-dvh bg-black px-4 py-12 text-fg">
      <div className="mx-auto max-w-3xl space-y-8">
        {status.isLoading ? (
          <div className="skeleton h-40 rounded-xl" />
        ) : !data ? (
          <p className="text-center text-muted">This status page doesn&apos;t exist.</p>
        ) : (
          <>
            <header className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">{data.title}</h1>
              {data.description && <p className="text-muted">{data.description}</p>}
            </header>
            <div className={cn("flex items-center gap-3 rounded-xl border px-5 py-4 text-lg font-medium", OVERALL[data.overall].tone)}>
              <Icon name={OVERALL[data.overall].icon} size={20} />
              {OVERALL[data.overall].text}
            </div>
            <section className="divide-y divide-line rounded-xl border border-line">
              {data.components.map((c) => (
                <div key={c.label} className="space-y-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{c.label}</span>
                    <span className={cn("ml-auto text-sm", c.status === "up" ? "text-ok" : c.status === "down" ? "text-err" : "text-subtle")}>
                      {c.status === "up" ? "Operational" : c.status === "down" ? "Down" : "No data"}
                    </span>
                  </div>
                  <div className="flex h-8 gap-[3px]" aria-label={`${c.label}: daily uptime for 30 days`}>
                    {c.days.map((d) => (
                      <span
                        key={d.day}
                        title={`${d.day}: ${d.uptime === null ? "no data" : `${d.uptime}% up`}`}
                        className={cn("flex-1 rounded-sm", barTone(d.uptime))}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-subtle">
                    <span>30 days ago</span>
                    <span>{c.uptime !== null ? `${c.uptime}% uptime` : ""}</span>
                    <span>Today</span>
                  </div>
                </div>
              ))}
            </section>
            {data.incidents.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Recent incidents</h2>
                <div className="divide-y divide-line rounded-xl border border-line">
                  {data.incidents.map((i) => (
                    <div key={`${i.component}-${i.started_at}`} className="flex flex-wrap items-center gap-2 px-5 py-3 text-sm">
                      <span className="font-medium">{i.component ?? "A service"} was down</span>
                      <span className="text-subtle">
                        {when(i.started_at)}
                        {i.resolved_at ? ` to ${when(i.resolved_at)}` : ": ongoing"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <footer className="text-center text-xs text-subtle">
              Checked every minute · updated {when(data.updated_at)} · powered by VPSPilot
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
