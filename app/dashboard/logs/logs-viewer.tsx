"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Button, Callout, Input, Mono, Select } from "@/components/ui";
import { type Entry, type Level, type LogSource, useLogFeed, useLogSources } from "@/lib/api/logs";
import { useServers } from "@/lib/api/servers";
import { cn } from "@/lib/utils";

const LEVELS: Level[] = ["error", "warn", "info", "debug"];
const levelStyle: Record<Level, { bar: string; text: string; label: string }> = {
  error: { bar: "bg-err", text: "text-err", label: "Error" },
  warn: { bar: "bg-warn", text: "text-warn", label: "Warning" },
  info: { bar: "bg-blue-fg", text: "text-fg", label: "Info" },
  debug: { bar: "bg-subtle", text: "text-subtle", label: "Debug" },
};
const KIND_LABEL = { app: "Applications", database: "Databases", container: "Other containers" } as const;

export function LogsViewer() {
  const { data: servers } = useServers();
  const usable = (servers ?? []).filter((s) => s.enrolled_at && s.status !== "revoked");
  const [serverId, setServerId] = useState("");
  const server = serverId || usable.find((s) => s.status === "online")?.id || usable[0]?.id;
  const sources = useLogSources(server);
  const [source, setSource] = useState<LogSource>({ kind: "journal", unit: null });
  const [lines, setLines] = useState(300);
  const [follow, setFollow] = useState(true);
  const [q, setQ] = useState("");
  const [levels, setLevels] = useState<Set<Level>>(new Set(LEVELS));
  const [open, setOpen] = useState<Entry | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const feed = useLogFeed(server, source, lines, follow);
  const box = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);

  const counts = useMemo(() => {
    const c: Record<Level, number> = { error: 0, warn: 0, info: 0, debug: 0 };
    for (const e of feed.entries) c[e.level]++;
    return c;
  }, [feed.entries]);
  const term = q.trim().toLowerCase();
  const list = feed.entries.filter((e) => levels.has(e.level) && (!term || `${e.message} ${e.origin}`.toLowerCase().includes(term)));

  useEffect(() => {
    if (atBottom.current) box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [list.length]);

  const toggleLevel = (l: Level) =>
    setLevels((s) => {
      const next = new Set(s);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });

  const containers = sources.data?.containers;
  const containersByKind = useMemo(() => {
    const groups: Record<string, NonNullable<typeof containers>> = {};
    for (const c of containers ?? []) (groups[c.kind] ??= []).push(c);
    return groups;
  }, [containers]);

  const sourceLabel =
    source.kind === "journal"
      ? source.unit
        ? source.unit
        : "System journal (all units)"
      : (sources.data?.containers.find((c) => c.name === source.container)?.label ?? source.container);

  const download = () => {
    const text = list.map((e) => `${new Date(e.time).toISOString()} ${e.level.toUpperCase()} ${e.origin} ${e.message}`).join("\n") + "\n";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    link.download = `${sourceLabel.replace(/[^a-z0-9.-]+/gi, "-")}.log`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const pick = (s: LogSource) => {
    setSource(s);
    setOpen(null);
    atBottom.current = true;
  };

  return (
    <div className="flex min-h-[calc(100dvh-110px)] flex-col lg:flex-row">
      <aside className={cn("shrink-0 border-line bg-bg lg:block lg:w-72 lg:border-r", showFilters ? "block border-b" : "hidden")}>
        <div className="space-y-6 p-4">
          <div>
            <h3 className="mb-2 text-xs font-medium text-subtle">Server</h3>
            <Select
              value={server ?? ""}
              onChange={(e) => {
                setServerId(e.target.value);
                pick({ kind: "journal", unit: null });
              }}
              aria-label="Server"
            >
              {usable.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.status === "online" ? "" : `(${s.status})`}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-medium text-subtle">System</h3>
            <button
              type="button"
              onClick={() => pick({ kind: "journal", unit: null })}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-white/[0.04]",
                source.kind === "journal" && !source.unit && "bg-white/[0.06] text-fg",
              )}
            >
              <Icon name="terminal" size={14} className="text-subtle" /> Journal, all units
            </button>
            {!!sources.data?.units.length && (
              <Select
                value={source.kind === "journal" ? (source.unit ?? "") : ""}
                onChange={(e) => pick({ kind: "journal", unit: e.target.value || null })}
                className="mt-2"
                aria-label="Service"
              >
                <option value="">One service…</option>
                {sources.data.units.map((u) => (
                  <option key={u} value={u}>
                    {u.replace(/\.service$/, "")}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {(["app", "database", "container"] as const).map((kind) =>
            containersByKind[kind]?.length ? (
              <div key={kind}>
                <h3 className="mb-2 text-xs font-medium text-subtle">{KIND_LABEL[kind]}</h3>
                {containersByKind[kind].map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => pick({ kind: "container", container: c.name })}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-white/[0.04]",
                      source.kind === "container" && source.container === c.name && "bg-white/[0.06] text-fg",
                    )}
                  >
                    <span className={cn("size-1.5 shrink-0 rounded-full", c.state === "running" ? "bg-ok" : "bg-subtle")} />
                    <span className="min-w-0 flex-1 truncate">{c.label}</span>
                  </button>
                ))}
              </div>
            ) : null,
          )}

          <div>
            <h3 className="mb-2 text-xs font-medium text-subtle">Level</h3>
            {LEVELS.map((l) => (
              <label key={l} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-white/[0.04]">
                <input type="checkbox" checked={levels.has(l)} onChange={() => toggleLevel(l)} className="size-3.5 accent-white" />
                <span className={cn("h-3 w-1 rounded-full", levelStyle[l].bar)} />
                <span className="flex-1">{levelStyle[l].label}</span>
                <span className="text-xs text-subtle tabular-nums">{counts[l]}</span>
              </label>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-subtle">
            Read on demand by the agent, kept encrypted for an hour. Journal levels come from systemd; container levels are guessed from the text.
          </p>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-bg px-4 py-3">
          <Button variant="secondary" size="md" icon="filter" className="lg:hidden" onClick={() => setShowFilters((s) => !s)}>
            Sources
          </Button>
          <Input icon="search" placeholder="Search log messages…" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-48 flex-1" />
          <Select value={String(lines)} onChange={(e) => setLines(Number(e.target.value))} className="w-36" aria-label="Lines">
            {[100, 300, 500, 1000].map((n) => (
              <option key={n} value={n}>
                Last {n} lines
              </option>
            ))}
          </Select>
          <button
            type="button"
            onClick={() => setFollow((f) => !f)}
            aria-pressed={follow}
            className={cn("flex h-10 items-center gap-2 rounded-md border px-3 text-sm", follow ? "border-ok/30 bg-ok/10 text-ok" : "border-line-strong text-muted")}
          >
            <span className={cn("size-1.5 rounded-full", follow ? "animate-pulse bg-ok" : "bg-subtle")} />
            {follow ? "Live" : "Paused"}
          </button>
          <Button variant="secondary" size="md" icon="download" disabled={!list.length} onClick={download}>
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 border-b border-line px-4 py-2 text-xs text-muted">
          <Icon name={source.kind === "journal" ? "terminal" : "container"} size={13} />
          <span className="text-fg">{sourceLabel}</span>
          <span>·</span>
          <span>
            {list.length} of {feed.entries.length} lines
          </span>
        </div>

        {feed.error && (
          <div className="p-4">
            <Callout tone="err" icon="x-circle" title="Couldn't read the logs">
              <span className="flex flex-wrap items-center gap-3 text-muted">
                {feed.error}
                <Button variant="secondary" size="xs" icon="refresh" onClick={feed.refresh}>
                  Retry
                </Button>
              </span>
            </Callout>
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <div
            ref={box}
            onScroll={(e) => {
              const el = e.currentTarget;
              atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
            }}
            className="thin-scrollbar h-[calc(100dvh-230px)] min-w-0 flex-1 overflow-auto bg-bg py-1 font-mono text-[12.5px] leading-[21px]"
          >
            {!usable.length ? (
              <p className="p-4 font-sans text-sm text-subtle">Enroll a server to read its logs.</p>
            ) : feed.loading && !feed.entries.length ? (
              <div className="flex items-center gap-2 p-4 font-sans text-sm text-subtle">
                <Icon name="refresh" size={13} className="animate-spin" /> Asking the agent for logs…
              </div>
            ) : !list.length ? (
              <p className="p-4 font-sans text-sm text-subtle">{feed.entries.length ? "No lines match." : "Nothing logged yet."}</p>
            ) : (
              list.map((e) => (
                <button
                  key={e.key}
                  type="button"
                  onClick={() => setOpen(e)}
                  className={cn("flex w-full gap-3 px-4 text-left hover:bg-white/[0.03]", open?.key === e.key && "bg-white/[0.06]", e.level === "error" && "bg-err/[0.05]")}
                >
                  <span className={cn("my-1 w-1 shrink-0 self-stretch rounded-full", levelStyle[e.level].bar)} />
                  <span className="hidden w-[74px] shrink-0 text-subtle sm:inline">{new Date(e.time).toLocaleTimeString(undefined, { hour12: false })}</span>
                  {source.kind === "journal" && !source.unit && <span className="hidden w-40 shrink-0 truncate text-muted md:inline">{e.origin.replace(/\.service$/, "")}</span>}
                  <span className={cn("min-w-0 truncate", levelStyle[e.level].text)}>{e.message || " "}</span>
                </button>
              ))
            )}
          </div>

          {open && (
            <aside className="hidden w-[380px] shrink-0 border-l border-line bg-bg-100 xl:block">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-sm font-medium">Log line</span>
                <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="rounded p-1 text-muted hover:bg-white/10 hover:text-fg">
                  <Icon name="x" size={14} />
                </button>
              </div>
              <div className="space-y-4 p-4 text-sm">
                <dl className="grid grid-cols-[80px_1fr] gap-y-2 text-[13px]">
                  <dt className="text-subtle">Time</dt>
                  <dd>{new Date(open.time).toLocaleString()}</dd>
                  <dt className="text-subtle">Level</dt>
                  <dd className={levelStyle[open.level].text}>{levelStyle[open.level].label}</dd>
                  <dt className="text-subtle">{source.kind === "journal" ? "Unit" : "Container"}</dt>
                  <dd>
                    <Mono>{open.origin}</Mono>
                  </dd>
                  {open.stream && (
                    <>
                      <dt className="text-subtle">Stream</dt>
                      <dd>{open.stream === "err" ? "stderr" : "stdout"}</dd>
                    </>
                  )}
                </dl>
                <pre className="thin-scrollbar max-h-[60vh] overflow-auto rounded-md border border-line bg-bg p-3 font-mono text-[12px] leading-relaxed break-all whitespace-pre-wrap">
                  {open.message}
                </pre>
              </div>
            </aside>
          )}
        </div>
      </section>
    </div>
  );
}
