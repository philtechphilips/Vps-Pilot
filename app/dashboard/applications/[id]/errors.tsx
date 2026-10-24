"use client";

import { useState } from "react";
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import { type ErrorGroup, useErrorGroups, useIgnoreError } from "@/lib/api/apps";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

function Spark({ days }: { days: number[] }) {
  const max = Math.max(1, ...days);
  return (
    <span className="flex h-6 items-end gap-[2px]" aria-label="errors per day, last 14 days">
      {days.map((n, i) => (
        <span key={i} className={cn("w-1.5 rounded-sm", n ? "bg-err/70" : "bg-white/10")} style={{ height: `${Math.max(8, (100 * n) / max)}%` }} />
      ))}
    </span>
  );
}

/** Errors from the app's logs, grouped by cause (same bug, one row). */
export function ErrorsSection({ appId }: { appId: string }) {
  const groups = useErrorGroups(appId);
  const ignore = useIgnoreError(appId);
  const [showIgnored, setShowIgnored] = useState(false);
  const list = (groups.data ?? []).filter((g) => showIgnored || !g.ignored);
  const ignoredCount = (groups.data ?? []).filter((g) => g.ignored).length;

  return (
    <section>
      <SectionTitle
        action={
          ignoredCount > 0 && (
            <button type="button" className="text-[13px] text-muted hover:text-fg" onClick={() => setShowIgnored((v) => !v)}>
              {showIgnored ? "Hide ignored" : `Show ${ignoredCount} ignored`}
            </button>
          )
        }
      >
        Errors
      </SectionTitle>
      {groups.isLoading ? (
        <div className="skeleton h-24 rounded-xl" />
      ) : list.length === 0 ? (
        <Card className="p-5 text-sm text-muted">No errors in the app&apos;s logs. Each new kind of error shows up here, grouped with its repeats.</Card>
      ) : (
        <Card className="overflow-hidden">
          {list.map((g: ErrorGroup) => (
            <div key={g.id} className={cn("flex flex-col gap-2 border-b border-line px-4 py-3 last:border-0 sm:flex-row sm:items-center", g.ignored && "opacity-60")}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[12px] text-fg" title={g.sample}>
                  {g.sample || "(no text)"}
                </p>
                <p className="text-xs text-subtle">
                  {g.total.toLocaleString()} times · first {timeAgo(g.first_seen)} · last {timeAgo(g.last_seen)}
                  {g.today > 0 && <span className="text-err"> · {g.today} today</span>}
                </p>
              </div>
              <Spark days={g.days} />
              {g.ignored && <Badge>Ignored</Badge>}
              <Button variant="secondary" size="xs" disabled={ignore.isPending} onClick={() => ignore.mutate({ id: g.id, ignored: !g.ignored })}>
                {g.ignored ? "Count again" : "Ignore"}
              </Button>
            </div>
          ))}
        </Card>
      )}
      <p className="mt-2 text-xs text-subtle">Ignored errors aren&apos;t counted for the App logging errors alert. Secrets in error lines are masked on the server.</p>
    </section>
  );
}
