"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/icons";
import { Badge, Button, Dot, type Tone } from "@/components/ui";
import { isActive, type Job, type JobStatus, useCancelJob, useJob } from "@/lib/api/jobs";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const jobTone: Record<JobStatus, Tone> = {
  queued: "neutral",
  running: "warn",
  succeeded: "ok",
  failed: "err",
  expired: "neutral",
  canceled: "neutral",
};

export function jobTitle(job: Pick<Job, "type" | "payload">) {
  if (job.type === "app.deploy") return `Deploy ${String(job.payload.app)}`;
  if (job.type === "app.remove") return `Remove app ${String(job.payload.app)}`;
  if (job.type === "os.upgrade") return job.payload.mode === "security" ? "Install security updates" : "Install all updates";
  if (job.type === "os.reboot") return "Reboot";
  if (job.type === "disk.usage") return "Check disk usage";
  if (job.type === "disk.cleanup") return "Clean up disk";
  if (job.type === "security.check") return "Security check";
  if (job.type === "security.auto_updates") return "Turn on automatic security updates";
  if (job.type === "firewall.apply")
    return job.payload.action === "enable" ? "Turn on the firewall" : `${job.payload.action === "allow" ? "Open" : "Close"} port ${String(job.payload.port)}`;
  if (job.type === "app.exec") return `Run on ${String(job.payload.app)}: ${String(job.payload.command).slice(0, 60)}`;
  const target = String(job.payload.unit ?? job.payload.container ?? "").replace(/\.service$/, "");
  const [kind, verb] = job.type.split(".");
  const label = verb === "logs" ? "Logs" : verb[0].toUpperCase() + verb.slice(1);
  return `${label} ${kind === "container" ? "container " : ""}${target}`;
}

/** Slide-over showing a job's live progress and output. */
export function JobPanel({ jobId, onClose }: { jobId: string | null; onClose: () => void }) {
  const job = useJob(jobId);
  const cancel = useCancelJob();
  const outputRef = useRef<HTMLPreElement>(null);
  const data = job.data;

  useEffect(() => {
    if (!jobId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jobId, onClose]);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [data?.output]);

  if (!jobId) return null;

  return (
    <div className="fixed inset-0 z-[95] flex justify-end bg-black/50" onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Job details"
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-[640px] animate-fade-up flex-col border-l border-white/10 bg-[#141414] shadow-2xl"
      >
        <div className="flex items-start gap-3 border-b border-line p-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-subtle">Job</p>
            <h2 className="mt-0.5 truncate text-lg font-semibold">{data ? jobTitle(data) : "Loading…"}</h2>
            {data && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <Dot tone={jobTone[data.status]} pulse={isActive(data.status)} /> {data.status}
                </span>
                <span>·</span>
                <span>queued {timeAgo(data.created_at)}</span>
                {data.exit_code != null && <Badge tone={data.exit_code === 0 ? "ok" : "err"}>exit {data.exit_code}</Badge>}
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-muted hover:bg-white/10 hover:text-fg">
            <Icon name="x" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
          {data && (
            <ol className="space-y-1.5 text-[13px]">
              <Step done label="Queued" />
              <Step done={!!data.claimed_at} active={data.status === "queued"} label={data.claimed_at ? "Picked up by the agent" : "Waiting for the agent"} />
              <Step
                done={!isActive(data.status)}
                active={data.status === "running"}
                failed={data.status === "failed" || data.status === "expired"}
                label={data.status === "running" ? "Running on the server" : data.status === "succeeded" ? "Finished" : data.status === "queued" ? "Run" : data.status[0].toUpperCase() + data.status.slice(1)}
              />
            </ol>
          )}
          {data?.error && <p className="rounded-lg border border-err/30 bg-err/10 p-3 text-sm text-err">{data.error}</p>}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#0d0d0d]">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2 text-xs text-subtle">
              <Icon name="terminal" size={13} /> Output
              {data && isActive(data.status) && <span className="ml-auto animate-pulse text-warn">live</span>}
            </div>
            <pre ref={outputRef} className="thin-scrollbar min-h-0 flex-1 overflow-auto p-3 font-mono text-[12px] leading-5 whitespace-pre-wrap text-fg">
              {data?.output || (data && isActive(data.status) ? "Waiting for output…" : "No output.")}
            </pre>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line p-4 text-xs text-subtle">
          <span className="truncate">Correlation {data?.correlation_id ?? "…"}</span>
          {data?.status === "queued" && (
            <Button variant="secondary" size="sm" disabled={cancel.isPending} onClick={() => cancel.mutate(data.id)}>
              Cancel
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}

function Step({ label, done, active, failed }: { label: string; done?: boolean; active?: boolean; failed?: boolean }) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full border",
          failed ? "border-err/40 bg-err/15 text-err" : done ? "border-ok/40 bg-ok/15 text-ok" : active ? "border-warn/40 bg-warn/15 text-warn" : "border-line-strong text-subtle",
        )}
      >
        <Icon name={failed ? "x" : done ? "check" : active ? "clock" : "minus"} size={11} strokeWidth={2.5} />
      </span>
      <span className={done || active ? "text-fg" : "text-subtle"}>{label}</span>
    </li>
  );
}
