"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { appUrl, DeploymentStatusLabel, repoName, shortSha, triggerLabel } from "@/components/apps/app-ui";
import { DetailHeader, InfoGrid } from "@/components/dashboard/detail";
import { Icon } from "@/components/icons";
import { Avatar, Badge, Button, buttonClass, Callout, Card, Container, EmptyState, Mono, SectionTitle } from "@/components/ui";
import { type DeploymentDetail, isDeploying, runtimeLabel, useApp, useDeploy, useDeployment, useRollback } from "@/lib/api/apps";
import { useCancelJob } from "@/lib/api/jobs";
import { useServers } from "@/lib/api/servers";
import { formatDate, formatDuration, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type StepState = "done" | "failed" | "active" | "pending" | "skipped";
type Line = { text: string; kind: "step" | "error" | "warn" | "ok" | "out"; at: string };

const STEPS = [
  { label: "Queued", match: [] as string[] },
  { label: "Build", match: ["Fetching", "Building", "Pulling", "Checked out"] },
  { label: "Health check", match: ["Starting a candidate", "Health check"] },
  { label: "Release", match: ["Releasing", "Live on port", "Restoring"] },
];

/** Flatten events into log lines, tagging step headers and outcomes. */
function toLines(d: DeploymentDetail): Line[] {
  const lines: Line[] = [];
  for (const e of d.events) {
    for (const text of e.message.split("\n")) {
      const step = text.startsWith("==> ");
      const body = step ? text.slice(4) : text;
      const kind: Line["kind"] =
        e.level === "error" ? "error" : e.level === "warn" ? "warn" : /Health check passed|^Live on port/.test(body) ? "ok" : step ? "step" : "out";
      lines.push({ text: body, kind, at: e.created_at });
    }
  }
  return lines;
}

function pipeline(d: DeploymentDetail, lines: Line[]): StepState[] {
  if (d.status === "succeeded") return STEPS.map(() => "done");
  let reached = d.status === "queued" ? 0 : 1;
  for (const l of lines) {
    if (l.kind === "out") continue;
    STEPS.forEach((s, i) => {
      if (s.match.some((m) => l.text.startsWith(m))) reached = Math.max(reached, i);
    });
  }
  return STEPS.map((_, i) => {
    if (i < reached) return "done";
    if (i > reached) return d.status === "failed" || d.status === "canceled" ? "skipped" : "pending";
    if (d.status === "failed") return "failed";
    if (d.status === "canceled") return "skipped";
    return i === 0 && d.status !== "queued" ? "done" : "active";
  });
}

const lineClass: Record<Line["kind"], string> = {
  step: "font-medium text-accent-fg",
  error: "text-err",
  warn: "text-warn",
  ok: "text-ok",
  out: "text-muted",
};

export function DeploymentView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const deployment = useDeployment(id);
  const d = deployment.data;
  const app = useApp(d?.application_id);
  const { data: servers } = useServers();
  const deploy = useDeploy(d?.application_id ?? "");
  const rollback = useRollback();
  const cancel = useCancelJob();
  const lines = useMemo(() => (d ? toLines(d) : []), [d]);
  const logRef = useRef<HTMLDivElement>(null);
  const [follow, setFollow] = useState(true);

  useEffect(() => {
    if (follow) logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines.length, follow]);

  if (deployment.isLoading) {
    return (
      <Container className="space-y-4 pt-6">
        <div className="skeleton h-10 w-64 rounded" />
        <div className="skeleton h-40 rounded-xl" />
        <div className="skeleton h-80 rounded-xl" />
      </Container>
    );
  }
  if (deployment.error || !d) {
    return (
      <Container className="pt-6">
        <EmptyState
          icon="rocket"
          title={deployment.error?.status === 404 ? "Deployment not found" : "Couldn't load this deployment"}
          action={
            <Link href="/dashboard/deployments" className="text-sm text-accent-fg hover:underline">
              Back to deployments
            </Link>
          }
        />
      </Container>
    );
  }

  const a = app.data;
  const steps = pipeline(d, lines);
  const running = isDeploying(d.status);
  const url = a ? appUrl(a, servers) : null;
  const canPromote = d.status === "succeeded" && !d.is_current && !!d.image_ref;
  const errors = lines.filter((l) => l.kind === "error").length;
  const warnings = lines.filter((l) => l.kind === "warn").length;
  const goTo = (next: string) => router.push(`/dashboard/deployments/${next}`);

  const download = () => {
    const blob = new Blob([lines.map((l) => (l.kind === "out" ? l.text : `==> ${l.text}`)).join("\n") + "\n"], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${d.app_name ?? "deployment"}-${d.id.slice(0, 10)}.log`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <DetailHeader
        back={`/dashboard/applications/${d.application_id}`}
        backLabel={d.app_name ?? "Application"}
        title={
          <>
            Deployment Details
            {d.is_current && <Badge tone="blue">Current</Badge>}
          </>
        }
        actions={
          <>
            {d.status === "queued" && d.job_id && (
              <Button variant="secondary" size="md" icon="stop" disabled={cancel.isPending} onClick={() => cancel.mutate(d.job_id!)}>
                Cancel
              </Button>
            )}
            {canPromote && (
              <Button variant="secondary" size="md" icon="rollback" disabled={rollback.isPending} onClick={() => rollback.mutate(d.id, { onSuccess: (n) => goTo(n.id) })}>
                Promote to Production
              </Button>
            )}
            {a && (
              <Button variant="secondary" size="md" icon="refresh" disabled={deploy.isPending || running} onClick={() => deploy.mutate(undefined, { onSuccess: (n) => goTo(n.id) })}>
                Redeploy
              </Button>
            )}
            {d.is_current && url && (
              <a href={url} target="_blank" rel="noreferrer" className={buttonClass("primary", "md")}>
                <Icon name="external-link" size={16} />
                Visit
              </a>
            )}
          </>
        }
      />
      <Container className="space-y-8">
        {(deploy.error || rollback.error || cancel.error) && (
          <Callout tone="err" icon="x-circle">
            {(deploy.error ?? rollback.error ?? cancel.error)?.message}
          </Callout>
        )}
        {d.status === "failed" && d.error && (
          <Callout tone="err" icon="x-circle" title="Deployment failed">
            <span className="text-muted">{d.error}</span>
          </Callout>
        )}

        <Card className="p-5 sm:p-6">
          <InfoGrid
            className="lg:grid-cols-3"
            items={[
              { label: "Deployment", value: <Mono>{d.id}</Mono> },
              {
                label: "Status",
                value: (
                  <span className="flex items-center gap-2">
                    <DeploymentStatusLabel status={d.status} />
                    {d.finished_at && <span className="text-subtle">{timeAgo(d.finished_at)}</span>}
                  </span>
                ),
              },
              {
                label: "Application",
                value: (
                  <Link href={`/dashboard/applications/${d.application_id}`} className="hover:underline">
                    {d.app_name}
                  </Link>
                ),
              },
              {
                label: "Target",
                value: a ? (
                  <Link href={`/dashboard/servers/${d.server_id}`} className="hover:underline">
                    {a.server_name} · {runtimeLabel[a.runtime] ?? a.runtime} · port {a.host_port}
                  </Link>
                ) : (
                  "—"
                ),
              },
              { label: "Duration", value: `${d.status === "queued" ? "waiting" : formatDuration(d.created_at, d.finished_at)} · ${formatDate(d.created_at)}` },
              {
                label: "Source",
                value: (
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {d.trigger === "rollback" ? (
                      <>
                        <Icon name="rollback" size={14} className="text-subtle" />
                        <span>Rollback to</span>
                        <Link href={`/dashboard/deployments/${d.rollback_of}`} className="font-mono text-[13px] hover:underline">
                          {d.rollback_of?.slice(0, 10)}
                        </Link>
                      </>
                    ) : a?.source_type === "git" ? (
                      <>
                        <Icon name="git-branch" size={14} className="text-subtle" /> {d.requested_ref}
                        {d.commit_sha && (
                          <>
                            <Icon name="git-commit" size={14} className="ml-2 text-subtle" /> <Mono>{shortSha(d.commit_sha)}</Mono>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <Icon name="container" size={14} className="text-subtle" /> <Mono className="truncate">{d.requested_ref}</Mono>
                      </>
                    )}
                  </span>
                ),
              },
              a?.source_type === "git"
                ? { label: "Commit message", value: <span className="text-muted">{d.commit_message ?? repoName(a.repo_url)}</span> }
                : { label: "Health check", value: <Mono className="text-muted">GET {String(d.spec.health_path ?? "/")}</Mono> },
              {
                label: "Built with",
                value: d.spec.build_plan ? (
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span>{String(d.spec.build_plan)}</span>
                    {d.image_ref && <Mono className="truncate text-[12px] text-subtle">{d.image_ref}</Mono>}
                  </span>
                ) : d.image_ref ? (
                  <Mono className="text-muted">{d.image_ref}</Mono>
                ) : (
                  <span className="text-subtle">{running ? "Building…" : "Not built"}</span>
                ),
              },
              {
                label: "Created by",
                value: (
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar name={d.created_by} size={18} /> <span className="truncate">{d.created_by}</span> · {triggerLabel[d.trigger]}
                  </span>
                ),
              },
            ]}
          />
        </Card>

        <section>
          <SectionTitle>Pipeline</SectionTitle>
          <Card className="grid overflow-hidden sm:grid-cols-4">
            {STEPS.map((s, i) => {
              const state = steps[i];
              return (
                <div key={s.label} className="flex items-center gap-3 border-b border-line p-4 last:border-0 sm:border-r sm:border-b-0">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border",
                      state === "done" && "border-ok/40 bg-ok/15 text-ok",
                      state === "failed" && "border-err/40 bg-err/15 text-err",
                      state === "active" && "border-warn/40 bg-warn/15 text-warn",
                      (state === "pending" || state === "skipped") && "border-line-strong text-subtle",
                    )}
                  >
                    <Icon name={state === "done" ? "check" : state === "failed" ? "x" : state === "active" ? "clock" : "minus"} size={12} strokeWidth={2.5} />
                  </span>
                  <div>
                    <div className={cn("text-sm", state === "pending" || state === "skipped" ? "text-subtle" : "text-fg")}>{s.label}</div>
                    <div className="text-xs text-subtle">
                      {state === "skipped" ? "Skipped" : state === "active" ? (i === 0 ? "Waiting for the agent" : "In progress") : state === "failed" ? "Failed" : state === "done" ? "Done" : "—"}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </section>

        <section>
          <SectionTitle
            action={
              <span className="flex items-center gap-2 text-xs text-subtle">
                <Icon name="lock" size={12} /> Secrets redacted · {lines.length} lines
              </span>
            }
          >
            Build Logs
          </SectionTitle>
          <div className="overflow-hidden rounded-lg border border-line bg-bg">
            <div className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-xs">
              <span className={cn("flex items-center gap-1.5", errors ? "text-err" : "text-muted")}>
                <Icon name={errors ? "x-circle" : "check-circle"} size={14} className={errors ? "" : "text-ok"} />
                {errors} {errors === 1 ? "error" : "errors"}
              </span>
              <span className="flex items-center gap-1.5 text-muted">
                <Icon name="alert" size={14} className="text-warn" />
                {warnings} {warnings === 1 ? "warning" : "warnings"}
              </span>
              {running && <span className="animate-pulse text-warn">live</span>}
              <span className="ml-auto flex items-center gap-3">
                {running && (
                  <label className="flex cursor-pointer items-center gap-1.5 text-muted">
                    <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} className="accent-[var(--color-accent)]" /> Follow
                  </label>
                )}
                <button type="button" onClick={download} disabled={!lines.length} className="inline-flex items-center gap-1 text-muted hover:text-fg disabled:opacity-40">
                  <Icon name="download" size={14} /> Download
                </button>
              </span>
            </div>
            <div ref={logRef} className="thin-scrollbar max-h-[560px] overflow-auto py-2 font-mono text-[12.5px] leading-[22px]">
              {lines.length === 0 && (
                <div className="px-4 text-subtle">{d.status === "queued" ? "Waiting for the agent to pick this up…" : "No log output."}</div>
              )}
              {lines.map((l, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-4 px-4 hover:bg-white/[0.03]",
                    l.kind === "error" && "bg-err/[0.07]",
                    l.kind === "warn" && "bg-warn/[0.05]",
                    l.kind === "step" && i > 0 && "mt-1",
                  )}
                >
                  <span className="w-8 shrink-0 text-right text-subtle select-none">{i + 1}</span>
                  <span className="hidden w-16 shrink-0 text-subtle sm:inline">{new Date(l.at).toLocaleTimeString(undefined, { hour12: false })}</span>
                  <span className={cn("min-w-0 break-all whitespace-pre-wrap", lineClass[l.kind])}>{l.text || " "}</span>
                </div>
              ))}
              {running && (
                <div className="flex gap-4 px-4">
                  <span className="w-8 shrink-0" />
                  <span className="inline-block h-4 w-2 translate-y-1 animate-caret bg-fg" />
                </div>
              )}
            </div>
          </div>
        </section>
      </Container>
    </>
  );
}
