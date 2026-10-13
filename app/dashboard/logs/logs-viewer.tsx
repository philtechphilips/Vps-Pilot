"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Button, Input, Mono } from "@/components/ui";
import { type LogLine, logs } from "@/lib/data";
import { cn } from "@/lib/utils";

const levels: LogLine["level"][] = ["error", "warn", "info", "debug"];
const levelStyle: Record<LogLine["level"], { bar: string; text: string; label: string }> = {
  error: { bar: "bg-err", text: "text-err", label: "Error" },
  warn: { bar: "bg-warn", text: "text-warn", label: "Warning" },
  info: { bar: "bg-blue-fg", text: "text-muted", label: "Info" },
  debug: { bar: "bg-subtle", text: "text-subtle", label: "Debug" },
};

export function LogsViewer() {
  const [q, setQ] = useState("");
  const [lv, setLv] = useState<Set<string>>(new Set(levels));
  const [sources, setSources] = useState<Set<string>>(new Set());
  const [live, setLive] = useState(true);
  const [open, setOpen] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const allSources = useMemo(() => [...new Set(logs.map((l) => l.source))].sort(), []);
  const list = logs.filter(
    (l) => lv.has(l.level) && (sources.size === 0 || sources.has(l.source)) && `${l.message} ${l.source} ${l.server}`.toLowerCase().includes(q.toLowerCase()),
  );
  const selected = logs.find((l) => l.id === open);

  const toggle = (set: Set<string>, v: string, apply: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    apply(next);
  };

  return (
    <div className="flex min-h-[calc(100dvh-110px)] flex-col lg:flex-row">
      <aside className={cn("shrink-0 border-line bg-bg lg:block lg:w-64 lg:border-r", showFilters ? "block border-b" : "hidden")}>
        <div className="space-y-6 p-4">
          <div>
            <h3 className="mb-2 text-xs font-medium text-subtle">Level</h3>
            {levels.map((l) => (
              <label key={l} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-white/[0.04]">
                <input type="checkbox" checked={lv.has(l)} onChange={() => toggle(lv, l, setLv)} className="size-3.5 accent-white" />
                <span className={cn("h-3 w-1 rounded-full", levelStyle[l].bar)} />
                <span className="flex-1">{levelStyle[l].label}</span>
                <span className="text-xs text-subtle tabular-nums">{logs.filter((x) => x.level === l).length}</span>
              </label>
            ))}
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium text-subtle">Source</h3>
            {allSources.map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-white/[0.04]">
                <input type="checkbox" checked={sources.has(s)} onChange={() => toggle(sources, s, setSources)} className="size-3.5 accent-white" />
                <span className="flex-1 truncate font-mono text-[12.5px]">{s}</span>
                <span className="text-xs text-subtle tabular-nums">{logs.filter((x) => x.source === s).length}</span>
              </label>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-subtle">Logs are bounded per source and secrets are redacted by the agent before upload.</p>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-bg px-4 py-3">
          <Button variant="secondary" size="md" icon="filter" className="lg:hidden" onClick={() => setShowFilters((s) => !s)}>
            Filters
          </Button>
          <Input icon="search" placeholder="Search log messages…" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-48 flex-1" />
          <span className="hidden h-10 items-center rounded-md border border-line-strong px-3 text-sm text-muted sm:flex">
            <Icon name="calendar" size={14} className="mr-2" /> Last 30 minutes
          </span>
          <button
            type="button"
            onClick={() => setLive((l) => !l)}
            aria-pressed={live}
            className={cn("flex h-10 items-center gap-2 rounded-md border px-3 text-sm", live ? "border-ok/30 bg-ok/10 text-ok" : "border-line-strong text-muted")}
          >
            <Icon name={live ? "pause" : "play"} size={14} />
            {live ? "Live" : "Paused"}
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="thin-scrollbar min-w-0 flex-1 overflow-auto bg-bg-100">
            <div className="sticky top-0 z-10 grid grid-cols-[120px_90px_1fr] gap-4 border-b border-line bg-bg-200 px-4 py-2 text-xs text-subtle sm:grid-cols-[130px_120px_130px_1fr]">
              <span>Time</span>
              <span className="hidden sm:block">Server</span>
              <span>Source</span>
              <span>Message</span>
            </div>
            {live && (
              <div className="flex items-center gap-2 border-b border-line px-4 py-2 text-xs text-ok">
                <span className="size-1.5 animate-pulse rounded-full bg-ok" /> Streaming new entries…
              </div>
            )}
            {list.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setOpen(open === l.id ? null : l.id)}
                className={cn(
                  "relative grid w-full grid-cols-[120px_90px_1fr] gap-4 border-b border-line px-4 py-1.5 text-left font-mono text-[12.5px] sm:grid-cols-[130px_120px_130px_1fr]",
                  open === l.id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
                  l.level === "error" && "bg-err/[0.05]",
                )}
              >
                <span className={cn("absolute top-0 bottom-0 left-0 w-0.5", levelStyle[l.level].bar)} />
                <span className="text-subtle">{l.time}</span>
                <span className="hidden truncate text-muted sm:block">{l.server}</span>
                <span className="truncate text-muted">{l.source}</span>
                <span className={cn("truncate", l.level === "error" ? "text-err" : l.level === "warn" ? "text-warn" : "text-fg")}>{l.message}</span>
              </button>
            ))}
            {list.length === 0 && <p className="p-10 text-center text-sm text-muted">No logs match your filters.</p>}
          </div>

          {selected && (
            <aside className="hidden w-[360px] shrink-0 border-l border-line bg-bg xl:block">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className={cn("text-sm font-medium", levelStyle[selected.level].text)}>{levelStyle[selected.level].label}</span>
                <button type="button" onClick={() => setOpen(null)} aria-label="Close details" className="text-subtle hover:text-fg">
                  <Icon name="x" />
                </button>
              </div>
              <div className="space-y-4 p-4 text-sm">
                {[
                  ["Time", `2026-10-13 ${selected.time} UTC`],
                  ["Server", selected.server],
                  ["Source", selected.source],
                  ["Stream", selected.source.includes("agent") || selected.source === "nginx" ? "journald" : "container stdout"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-xs text-subtle">{k}</div>
                    <Mono className="mt-0.5 block text-fg">{v}</Mono>
                  </div>
                ))}
                <div>
                  <div className="text-xs text-subtle">Message</div>
                  <pre className="mt-1 rounded-md border border-line bg-bg-100 p-3 font-mono text-xs break-all whitespace-pre-wrap text-fg">{selected.message}</pre>
                </div>
              </div>
            </aside>
          )}
        </div>
      </section>
    </div>
  );
}
