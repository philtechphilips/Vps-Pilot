"use client";

import { useState } from "react";
import { Button, Card, Meter, SectionTitle } from "@/components/ui";
import { isActive, useJob, useRunAction } from "@/lib/api/jobs";
import { formatBytes } from "@/lib/format";

type DiskReport = {
  total: number;
  used: number;
  free: number;
  parts: { name: string; bytes: number; reclaimable: number }[];
  dangling_images: number;
};

const TARGETS = [
  { value: "build_cache", label: "Docker build cache" },
  { value: "dangling_images", label: "Untagged Docker images" },
  { value: "journal", label: "System logs over 200 MB" },
  { value: "apt_cache", label: "apt package cache" },
];

function parse(output: string | null | undefined): DiskReport | null {
  try {
    return output ? (JSON.parse(output) as DiskReport) : null;
  } catch {
    return null;
  }
}

/** Where the disk went, and a cleanup that only removes what nothing needs. */
export function DiskSection({ serverId, live }: { serverId: string; live: boolean }) {
  const run = useRunAction(serverId);
  const [reportJob, setReportJob] = useState<string | null>(null);
  const [cleanJob, setCleanJob] = useState<string | null>(null);
  const [targets, setTargets] = useState<string[]>(["build_cache", "dangling_images", "journal", "apt_cache"]);
  const report = useJob(reportJob);
  const clean = useJob(cleanJob);
  const data = parse(report.data?.output);
  const checking = !!reportJob && (!report.data || isActive(report.data.status));
  const cleaning = !!cleanJob && (!clean.data || isActive(clean.data.status));
  const check = () => run.mutate({ type: "disk.usage", payload: {} }, { onSuccess: (job) => setReportJob(job.id) });
  const freed = clean.data?.status === "succeeded" ? (parse(clean.data.output) as unknown as { freed?: number } | null)?.freed : undefined;

  return (
    <section>
      <SectionTitle
        action={
          <Button variant="secondary" size="xs" icon="hard-drive" disabled={!live || checking} onClick={check}>
            {checking ? "Checking…" : data ? "Check again" : "Check disk usage"}
          </Button>
        }
      >
        Disk
      </SectionTitle>
      <Card className="space-y-4 p-4">
        {!data ? (
          <p className="text-sm text-muted">
            {report.data?.status === "failed" ? report.data.error : "See what takes up space (images, build cache, volumes, backups, logs) and clean up what nothing needs."}
          </p>
        ) : (
          <>
            <div>
              <div className="mb-1.5 flex justify-between text-sm">
                <span>
                  {formatBytes(data.used)} used of {formatBytes(data.total)}
                </span>
                <span className="text-muted">{formatBytes(data.free)} free</span>
              </div>
              <Meter value={(100 * data.used) / data.total} />
            </div>
            <div className="divide-y divide-line rounded-md border border-line">
              {[...data.parts]
                .sort((a, b) => b.bytes - a.bytes)
                .map((p) => (
                  <div key={p.name} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    {p.reclaimable > 0 && <span className="text-xs text-ok">{formatBytes(p.reclaimable)} can go</span>}
                    <span className="w-20 text-right font-mono text-[13px] text-muted">{formatBytes(p.bytes)}</span>
                  </div>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {TARGETS.map((t) => (
                <label key={t.value} className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={targets.includes(t.value)}
                    onChange={(e) => setTargets((v) => (e.target.checked ? [...v, t.value] : v.filter((x) => x !== t.value)))}
                    className="accent-[var(--color-accent)]"
                  />
                  {t.label}
                </label>
              ))}
              <Button
                variant="primary"
                size="sm"
                className="ml-auto"
                disabled={!live || cleaning || !targets.length}
                onClick={() => run.mutate({ type: "disk.cleanup", payload: { targets } }, { onSuccess: (job) => setCleanJob(job.id) })}
              >
                {cleaning ? "Cleaning…" : "Clean up"}
              </Button>
            </div>
            <p className="text-xs text-subtle">
              Never removes containers, volumes (app and database data) or the images kept for rollbacks.
              {freed !== undefined && ` Freed ${formatBytes(freed)}.`}
            </p>
          </>
        )}
        {run.error && <p className="text-xs text-err">{run.error.message}</p>}
      </Card>
    </section>
  );
}
