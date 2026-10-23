"use client";

import { useState } from "react";
import { RunsTable } from "@/app/dashboard/backups/backups-view";
import { LoadMore } from "@/components/dashboard/load-more";
import { Button, Card, Select, SectionTitle } from "@/components/ui";
import type { App } from "@/lib/api/apps";
import { useAppBackupPolicy, useBackupRuns, useRunAppBackup, useSetAppBackupPolicy } from "@/lib/api/backups";
import { timeAgo } from "@/lib/format";

const WHAT: Record<App["runtime"], string> = {
  docker: "the data folder",
  systemd: "the shared folder ($VPSPILOT_SHARED_DIR)",
  compose: "the Compose project's named volumes",
};

/** Scheduled, encrypted backups of what the app keeps between deploys. */
export function AppBackupsSection({ app }: { app: App }) {
  const policy = useAppBackupPolicy(app.id);
  const save = useSetAppBackupPolicy(app.id);
  const run = useRunAppBackup(app.id);
  const runs = useBackupRuns(undefined, app.id);
  const list = runs.data?.pages.flat() ?? [];
  const [every, setEvery] = useState<number | null>(null);
  const p = policy.data;
  const ready = p?.ready ?? true;
  const hours = every ?? p?.every_hours ?? 24;

  return (
    <section>
      <SectionTitle>File Backups</SectionTitle>
      <Card className="space-y-4 p-5">
        <p className="text-sm text-muted">
          Backs up {WHAT[app.runtime]}, encrypted with AES-256, to the server and your off-server storage. Databases have their own backups.
        </p>
        {!ready ? (
          <p className="text-sm text-warn">Set a data folder under Build &amp; Runtime (for example /app/uploads) and redeploy: that folder is what gets backed up.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!p?.enabled}
                disabled={!p || save.isPending}
                onChange={(e) => save.mutate({ enabled: e.target.checked, every_hours: hours })}
                className="accent-[var(--color-accent)]"
              />
              Back up automatically every
            </label>
            <Select
              aria-label="Interval"
              className="w-32"
              value={String(hours)}
              onChange={(e) => {
                const next = Number(e.target.value);
                setEvery(next);
                if (p?.enabled) save.mutate({ every_hours: next });
              }}
            >
              {[6, 12, 24, 72, 168].map((h) => (
                <option key={h} value={h}>
                  {h < 24 ? `${h} hours` : h === 24 ? "day" : h === 168 ? "week" : `${h / 24} days`}
                </option>
              ))}
            </Select>
            <span className="text-sm text-subtle">keeping the last {p?.keep ?? 7}</span>
            <Button variant="secondary" size="sm" icon="archive" className="ml-auto" disabled={run.isPending} onClick={() => run.mutate()}>
              {run.isPending ? "Starting…" : "Back up now"}
            </Button>
          </div>
        )}
        {p?.enabled && p.next_run_at && <p className="text-xs text-subtle">Next backup {timeAgo(p.next_run_at)}</p>}
        {(run.error || save.error) && <p className="text-xs text-err">{(run.error ?? save.error)?.message}</p>}
      </Card>
      {list.length > 0 && (
        <div className="mt-3">
          <RunsTable runs={list} />
          <LoadMore hasMore={!!runs.hasNextPage} loading={runs.isFetchingNextPage} onLoad={() => runs.fetchNextPage()} label="backups" />
        </div>
      )}
    </section>
  );
}
