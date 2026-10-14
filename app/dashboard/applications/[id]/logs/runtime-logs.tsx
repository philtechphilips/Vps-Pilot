"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DetailHeader } from "@/components/dashboard/detail";
import { FilterTabs } from "@/components/dashboard/filter-tabs";
import { Icon } from "@/components/icons";
import { Badge, Button, Callout, Container, Input, Select, type Tone } from "@/components/ui";
import { useRuntimeLogs } from "@/lib/api/app-logs";
import { useApp } from "@/lib/api/apps";
import { formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type Stream = "all" | "out" | "err";

const stateTone: Record<string, Tone> = { running: "ok", restarting: "warn", exited: "err", dead: "err", missing: "neutral", paused: "warn", created: "neutral" };
const stateLabel: Record<string, string> = { running: "Running", restarting: "Restarting", exited: "Stopped", dead: "Dead", missing: "Not deployed", paused: "Paused", created: "Created" };

// Colour lines that look like errors or warnings, whatever stream they used.
const ERROR_RE = /\b(error|exception|fatal|panic|traceback|critical|uncaught)\b|\bERR\b|\s5\d\d\s/i;
const WARN_RE = /\b(warn|warning|deprecated)\b/i;

export function RuntimeLogsView() {
  const { id } = useParams<{ id: string }>();
  const app = useApp(id);
  const [lines, setLines] = useState(200);
  const [follow, setFollow] = useState(true);
  const [stream, setStream] = useState<Stream>("all");
  const [q, setQ] = useState("");
  const [wrap, setWrap] = useState(true);
  const logs = useRuntimeLogs(id, lines, follow);
  const box = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return logs.lines.filter((l) => (stream === "all" || l.s === stream) && (!term || l.m.toLowerCase().includes(term)));
  }, [logs.lines, stream, q]);

  // Stick to the bottom while following, unless the user scrolled up.
  useEffect(() => {
    if (atBottom.current) box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [shown.length]);

  const download = () => {
    const text = shown.map((l) => `${l.t} ${l.s === "err" ? "stderr" : "stdout"} ${l.m}`).join("\n") + "\n";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    link.download = `${app.data?.name ?? "app"}-runtime.log`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const state = logs.state ?? undefined;
  const errors = shown.filter((l) => ERROR_RE.test(l.m)).length;

  return (
    <>
      <DetailHeader
        back={`/dashboard/applications/${id}`}
        backLabel={app.data?.name ?? "Application"}
        title={
          <>
            Runtime Logs
            {state && (
              <Badge tone={stateTone[state] ?? "neutral"}>
                {stateLabel[state] ?? state}
                {logs.restarts > 0 && ` · ${logs.restarts} restart${logs.restarts === 1 ? "" : "s"}`}
              </Badge>
            )}
          </>
        }
        actions={
          <>
            <Button variant="secondary" size="md" icon="download" disabled={!shown.length} onClick={download}>
              Download
            </Button>
            <Button variant={follow ? "primary" : "secondary"} size="md" icon={follow ? "pause" : "play"} onClick={() => setFollow((f) => !f)}>
              {follow ? "Pause" : "Follow"}
            </Button>
          </>
        }
      />
      <Container className="space-y-4">
        {logs.error && (
          <Callout tone="err" icon="x-circle" title="Couldn't read the logs">
            <span className="flex flex-wrap items-center gap-3 text-muted">
              {logs.error}
              <Button variant="secondary" size="xs" icon="refresh" onClick={logs.refresh}>
                Retry
              </Button>
            </span>
          </Callout>
        )}
        {state === "missing" && (
          <Callout icon="info" title="No running container yet">
            Deploy the application first; its output shows up here once it starts.
          </Callout>
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Input icon="search" placeholder="Filter lines…" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
          <div className="flex flex-wrap items-center gap-2">
            <FilterTabs<Stream>
              value={stream}
              onChange={setStream}
              options={[
                { value: "all", label: "All" },
                { value: "out", label: "stdout" },
                { value: "err", label: "stderr" },
              ]}
            />
            <Select value={String(lines)} onChange={(e) => setLines(Number(e.target.value))} className="w-36" aria-label="Lines">
              {[100, 200, 500, 1000].map((n) => (
                <option key={n} value={n}>
                  Last {n} lines
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-bg">
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              {follow ? (
                <>
                  <span className="size-1.5 animate-pulse rounded-full bg-ok" /> Live · refreshes every few seconds
                </>
              ) : (
                <>
                  <Icon name="pause" size={12} /> Paused
                </>
              )}
            </span>
            <span>·</span>
            <span>
              {shown.length} {shown.length === 1 ? "line" : "lines"}
              {errors > 0 && <span className="text-err"> · {errors} look like errors</span>}
            </span>
            {logs.startedAt && <span className="hidden sm:inline">· started {timeAgo(logs.startedAt)}</span>}
            <span className="ml-auto flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-1.5">
                <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} className="accent-[var(--color-accent)]" /> Wrap
              </label>
              <span className="flex items-center gap-1.5 text-subtle">
                <Icon name="lock" size={12} /> Encrypted at rest
              </span>
            </span>
          </div>
          <div
            ref={box}
            onScroll={(e) => {
              const el = e.currentTarget;
              atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
            }}
            className="thin-scrollbar h-[calc(100vh-330px)] min-h-[360px] overflow-auto py-2 font-mono text-[12.5px] leading-[21px]"
          >
            {logs.loading && logs.lines.length === 0 ? (
              <div className="flex items-center gap-2 px-4 text-subtle">
                <Icon name="clock" size={13} /> Asking the agent for the latest output…
              </div>
            ) : shown.length === 0 ? (
              <div className="px-4 text-subtle">{logs.lines.length ? "No lines match." : "The app hasn't written anything yet."}</div>
            ) : (
              shown.map((l, i) => {
                const level = ERROR_RE.test(l.m) ? "err" : WARN_RE.test(l.m) ? "warn" : null;
                return (
                  <div
                    key={`${l.t}-${i}`}
                    className={cn("flex gap-3 px-4 hover:bg-white/[0.03]", level === "err" && "bg-err/[0.07]", level === "warn" && "bg-warn/[0.05]")}
                  >
                    <span className="hidden w-[74px] shrink-0 text-subtle select-none sm:inline" title={formatDate(l.t)}>
                      {new Date(l.t).toLocaleTimeString(undefined, { hour12: false })}
                    </span>
                    <span className={cn("w-1 shrink-0 self-stretch rounded-full", l.s === "err" ? "bg-err/50" : "bg-transparent")} title={l.s === "err" ? "stderr" : "stdout"} />
                    <span
                      className={cn(
                        "min-w-0",
                        wrap ? "break-all whitespace-pre-wrap" : "whitespace-pre",
                        level === "err" ? "text-err" : level === "warn" ? "text-warn" : "text-fg",
                      )}
                    >
                      {l.m || " "}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <p className="text-xs text-subtle">
          {app.data?.runtime === "systemd"
            ? `What the app writes to stdout and stderr, read from the systemd journal (vp-${app.data.name}) on ${app.data.server_name ?? "the server"}.`
            : app.data?.runtime === "compose"
              ? `What the ${app.data.compose_service ?? "public"} service writes to stdout and stderr on ${app.data.server_name ?? "the server"}. Docker keeps the last 30 MB per container.`
              : `What the app writes to stdout and stderr, read from its container on ${app.data?.server_name ?? "the server"}. Docker keeps the last 30 MB per app.`}
        </p>
      </Container>
    </>
  );
}
