"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Icon } from "@/components/icons";
import { JobPanel } from "@/components/servers/job-panel";
import { Badge, Button, Card, Dot, Input, Label, Mono, SectionTitle, Select, type Tone } from "@/components/ui";
import type { App } from "@/lib/api/apps";
import { type CronJob, SCHEDULE_PRESETS, useCronJobs, useDeleteCronJob, useRunCommand, useRunCronJob, useSaveCronJob } from "@/lib/api/crons";
import { timeAgo } from "@/lib/format";

const statusTone: Record<NonNullable<CronJob["last_status"]>, Tone> = { running: "warn", succeeded: "ok", failed: "err", skipped: "neutral" };

function browserZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Run a one-off command inside the app, such as a seed or an admin user. */
export function RunCommandSection({ app }: { app: App }) {
  const run = useRunCommand(app.id);
  const [command, setCommand] = useState("");
  const [openJob, setOpenJob] = useState<string | null>(null);
  const where = app.runtime === "systemd" ? `as vp-${app.name} in the live release` : "inside the app's container";
  const go = () => command.trim() && run.mutate({ command: command.trim() }, { onSuccess: (r) => setOpenJob(r.job_id) });

  return (
    <section>
      <SectionTitle>Run a Command</SectionTitle>
      <Card className="space-y-3 p-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            go();
          }}
        >
          <Input aria-label="Command" className="font-mono" placeholder="npm run seed" value={command} onChange={(e) => setCommand(e.target.value)} />
          <Button type="submit" variant="primary" size="md" icon="terminal" disabled={!command.trim() || run.isPending}>
            Run
          </Button>
        </form>
        <p className="text-xs text-subtle">
          Runs {where}, with its environment, and stops after 30 minutes. The output streams in and stays in the server&apos;s activity.
        </p>
        {run.error && <p className="text-xs text-err">{run.error.message}</p>}
      </Card>
      <JobPanel jobId={openJob} onClose={() => setOpenJob(null)} />
    </section>
  );
}

/** Commands run inside the app on a schedule. */
export function CronSection({ app }: { app: App }) {
  const jobs = useCronJobs(app.id);
  const save = useSaveCronJob(app.id);
  const run = useRunCronJob(app.id);
  const remove = useDeleteCronJob(app.id);
  const [editing, setEditing] = useState<CronJob | "new" | null>(null);
  const [deleting, setDeleting] = useState<CronJob | null>(null);
  const [openJob, setOpenJob] = useState<string | null>(null);
  const list = jobs.data ?? [];
  const where = app.runtime === "systemd" ? `as vp-${app.name} in the live release` : "inside the app's container";

  return (
    <section>
      <SectionTitle
        action={
          <Button variant="secondary" size="xs" icon="plus" onClick={() => setEditing("new")}>
            New job
          </Button>
        }
      >
        Scheduled Jobs
      </SectionTitle>
      {list.length === 0 ? (
        <Card className="p-5 text-sm text-muted">
          Run a command {where} on a schedule, such as <Mono>npm run cleanup</Mono> every night. You&apos;re told in the inbox and your alert channels when a run
          fails.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {list.map((j) => (
            <div key={j.id} className="flex flex-col gap-2 border-b border-line px-4 py-3 last:border-0 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{j.name}</span>
                  <Mono className="text-xs text-muted">{j.schedule}</Mono>
                  {j.timezone !== "UTC" && <span className="text-xs text-subtle">{j.timezone}</span>}
                  {!j.enabled && <Badge>Paused</Badge>}
                </div>
                <Mono className="block truncate text-xs text-subtle">{j.command}</Mono>
                {j.last_status === "failed" && j.last_error && <p className="truncate text-xs text-err">{j.last_error}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs text-muted">
                {j.last_status && (
                  <button
                    type="button"
                    className="flex items-center gap-1.5 hover:text-fg disabled:cursor-default"
                    disabled={!j.last_job_id}
                    onClick={() => j.last_job_id && setOpenJob(j.last_job_id)}
                    title="Show the output"
                  >
                    <Dot tone={statusTone[j.last_status]} pulse={j.last_status === "running"} />
                    {j.last_status === "running" ? "Running" : `${j.last_status[0].toUpperCase()}${j.last_status.slice(1)} ${timeAgo(j.last_run_at)}`}
                  </button>
                )}
                {j.enabled && j.next_run_at && <span className="text-subtle">next {timeAgo(j.next_run_at)}</span>}
                <Button variant="secondary" size="xs" icon="play" disabled={run.isPending || j.last_status === "running"} onClick={() => run.mutate(j.id, { onSuccess: (r) => setOpenJob(r.job_id) })}>
                  Run now
                </Button>
                <button type="button" aria-label={`Edit ${j.name}`} onClick={() => setEditing(j)} className="rounded p-1.5 text-subtle hover:bg-black/10 hover:text-fg">
                  <Icon name="settings" size={14} />
                </button>
                <button type="button" aria-label={`Delete ${j.name}`} onClick={() => setDeleting(j)} className="rounded p-1.5 text-subtle hover:bg-black/10 hover:text-err">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}
      {run.error && <p className="mt-2 text-xs text-err">{run.error.message}</p>}
      {editing && <CronDialog job={editing === "new" ? null : editing} where={where} onClose={() => setEditing(null)} save={save} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete scheduled job"
        confirmText={deleting?.name ?? ""}
        action="Delete"
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      >
        It stops running. A run that already started finishes.
      </ConfirmDialog>
      <JobPanel jobId={openJob} onClose={() => setOpenJob(null)} />
    </section>
  );
}

function CronDialog({ job, where, onClose, save }: { job: CronJob | null; where: string; onClose: () => void; save: ReturnType<typeof useSaveCronJob> }) {
  const [name, setName] = useState(job?.name ?? "");
  const [schedule, setSchedule] = useState(job?.schedule ?? "0 2 * * *");
  const [timezone, setTimezone] = useState(job?.timezone ?? browserZone());
  const [command, setCommand] = useState(job?.command ?? "");
  const [timeout, setTimeoutMinutes] = useState(String(job?.timeout_minutes ?? 60));
  const [enabled, setEnabled] = useState(job?.enabled ?? true);
  const preset = SCHEDULE_PRESETS.find((p) => p.value === schedule)?.value ?? "custom";
  const valid = name.trim() && schedule.trim().length >= 5 && command.trim() && Number(timeout) >= 1 && Number(timeout) <= 360;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/25 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={job ? "Edit scheduled job" : "New scheduled job"}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-[500px] animate-fade-up overflow-hidden rounded-t-xl border border-line-strong bg-bg-100 shadow-2xl sm:rounded-xl"
      >
        <div className="space-y-4 p-6">
          <h2 className="text-xl font-semibold tracking-tight">{job ? "Edit scheduled job" : "New scheduled job"}</h2>
          <div>
            <Label htmlFor="cname">Name</Label>
            <Input id="cname" placeholder="Nightly cleanup" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ccmd" hint={`runs ${where}`}>
              Command
            </Label>
            <Input id="ccmd" className="font-mono" placeholder="npm run cleanup" value={command} onChange={(e) => setCommand(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cpreset">Schedule</Label>
              <Select id="cpreset" value={preset} onChange={(e) => e.target.value !== "custom" && setSchedule(e.target.value)}>
                {SCHEDULE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
                <option value="custom">Custom (cron)</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="ccron" hint="minute hour day month weekday">
                Cron
              </Label>
              <Input id="ccron" className="font-mono" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ctz">Timezone</Label>
              <Input id="ctz" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="UTC" />
            </div>
            <div>
              <Label htmlFor="cto" hint="minutes">
                Stop after
              </Label>
              <Input id="cto" inputMode="numeric" value={timeout} onChange={(e) => setTimeoutMinutes(e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="accent-[var(--color-accent)]" />
            Enabled
          </label>
          {save.error && <p className="text-sm text-err">{save.error.message}</p>}
        </div>
        <div className="flex justify-between gap-2 border-t border-line bg-bg-200 px-6 py-4">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!valid || save.isPending}
            onClick={() =>
              save.mutate(
                { id: job?.id, name: name.trim(), schedule: schedule.trim(), timezone: timezone.trim() || "UTC", command: command.trim(), enabled, timeout_minutes: Number(timeout) },
                { onSuccess: onClose },
              )
            }
          >
            {job ? "Save" : "Create job"}
          </Button>
        </div>
      </div>
    </div>
  );
}
