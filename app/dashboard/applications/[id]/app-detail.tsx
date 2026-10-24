"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  appUrl,
  DeploymentRow,
  DeploymentStatusLabel,
  draftFrom,
  EnvEditor,
  type EnvDraft,
  envPayload,
  envProblem,
  repoName,
  shortSha,
} from "@/components/apps/app-ui";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DetailHeader, InfoGrid } from "@/components/dashboard/detail";
import { Icon } from "@/components/icons";
import { Badge, Button, ButtonLink, buttonClass, Callout, Card, Container, EmptyState, FormCard, Input, Label, Mono, SectionTitle } from "@/components/ui";
import { type App, isDeploying, runtimeLabel, useApp, useAppDeployments, useDeleteApp, useDeploy, useRollback, useUpdateApp } from "@/lib/api/apps";
import { domainUrl, useDomains } from "@/lib/api/domains";
import { useServers } from "@/lib/api/servers";
import { timeAgo } from "@/lib/format";
import { AppBackupsSection } from "./backups";
import { CronSection, RunCommandSection } from "./cron";
import { ErrorsSection } from "./errors";
import { MoveSection } from "./move";
import { PreviewsSection } from "./previews";
import { TrafficSection } from "./traffic";
import { UsageSection } from "./usage";
import { UptimeSection } from "./uptime";

export function AppDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const app = useApp(id);
  const deployments = useAppDeployments(id);
  const { data: servers } = useServers();
  const appDomains = useDomains(id);
  const deploy = useDeploy(id);
  const rollback = useRollback();
  const remove = useDeleteApp();
  const [confirm, setConfirm] = useState<"rollback" | "delete" | null>(null);

  if (app.isLoading) {
    return (
      <Container className="space-y-4 pt-6">
        <div className="skeleton h-10 w-64 rounded" />
        <div className="skeleton h-56 rounded-xl" />
      </Container>
    );
  }
  if (app.error || !app.data) {
    return (
      <Container className="pt-6">
        <EmptyState
          icon="box"
          title={app.error?.status === 404 ? "Application not found" : "Couldn't load this application"}
          action={
            <Link href="/dashboard/applications" className="text-sm text-accent-fg hover:underline">
              Back to applications
            </Link>
          }
        />
      </Container>
    );
  }

  const a = app.data;
  const current = a.current_deployment;
  const latest = a.latest_deployment;
  const direct = appUrl(a, servers);
  // Prefer the app's own domain once it's live on the proxy.
  const primary = appDomains.data?.find((dm) => !dm.redirect_to && dm.status === "active");
  const url = primary ? domainUrl(primary) : direct;
  const deploying = isDeploying(latest?.status);
  // The most recent successful release that isn't live: the rollback target.
  const previous = deployments.data?.find((d) => d.status === "succeeded" && !d.is_current && d.image_ref);
  const goTo = (deploymentId: string) => router.push(`/dashboard/deployments/${deploymentId}`);

  return (
    <>
      <DetailHeader
        back="/dashboard/applications"
        backLabel="Applications"
        title={
          <>
            <span className="flex size-8 items-center justify-center rounded-full border border-line bg-bg-200 text-sm font-semibold uppercase">{a.name[0]}</span>
            {a.name}
            {a.preview_of && (
              <Link href={`/dashboard/applications/${a.preview_of}`} className="rounded-full border border-line px-2 py-0.5 text-xs font-normal text-muted hover:text-fg">
                preview of PR #{a.preview_pr}
              </Link>
            )}
          </>
        }
        actions={
          <>
            <ButtonLink href={`/dashboard/applications/${a.id}/logs`} variant="secondary" size="md" icon="terminal">
              Logs
            </ButtonLink>
            {previous && (
              <Button variant="secondary" size="md" icon="rollback" disabled={rollback.isPending || deploying} onClick={() => setConfirm("rollback")}>
                Instant Rollback
              </Button>
            )}
            <Button variant="secondary" size="md" icon="rocket" disabled={deploy.isPending || deploying} onClick={() => deploy.mutate(undefined, { onSuccess: (d) => goTo(d.id) })}>
              {deploying ? "Deploying…" : "Redeploy"}
            </Button>
            {url && current && (
              <a href={url} target="_blank" rel="noreferrer" className={buttonClass("primary", "md")}>
                <Icon name="external-link" size={16} />
                Visit
              </a>
            )}
          </>
        }
      />

      <Container className="space-y-8">
        {(deploy.error || rollback.error) && (
          <Callout tone="err" icon="x-circle">
            {(deploy.error ?? rollback.error)?.message}
          </Callout>
        )}
        {latest && deploying && (
          <Callout tone="warn" icon="clock" title={latest.status === "queued" ? "Deployment queued" : "Deployment in progress"}>
            <span className="text-muted">
              {current ? "The current version keeps serving until the new one passes its health check. " : ""}
              <Link href={`/dashboard/deployments/${latest.id}`} className="text-fg underline underline-offset-2">
                Follow the build
              </Link>
              .
            </span>
          </Callout>
        )}
        {latest?.status === "failed" && (
          <Callout tone="err" icon="x-circle" title="The latest deployment failed">
            <span className="text-muted">
              {latest.error}. {current ? "The previous release is still live. " : ""}
              <Link href={`/dashboard/deployments/${latest.id}`} className="text-fg underline underline-offset-2">
                Inspect the logs
              </Link>
              .
            </span>
          </Callout>
        )}

        <section>
          <SectionTitle>Production Deployment</SectionTitle>
          <Card className="grid overflow-hidden lg:grid-cols-[380px_1fr]">
            <div className="border-b border-line bg-bg p-4 lg:border-r lg:border-b-0">
              <AppPreview name={a.name} url={url} live={!!current} />
            </div>
            <div className="p-5 sm:p-6">
              {current ? (
                <InfoGrid
                  className="lg:grid-cols-2"
                  items={[
                    {
                      label: "Deployment",
                      value: (
                        <Link href={`/dashboard/deployments/${current.id}`} className="font-mono text-[13px] hover:underline">
                          {current.id.slice(0, 10)}
                        </Link>
                      ),
                    },
                    {
                      label: "Status",
                      value: (
                        <span className="flex items-center gap-2">
                          <DeploymentStatusLabel status={current.status} />
                          <span className="text-subtle">{timeAgo(current.finished_at ?? current.created_at)}</span>
                        </span>
                      ),
                    },
                    {
                      label: "Address",
                      value: (
                        <span className="flex flex-col gap-0.5">
                          {(appDomains.data ?? [])
                            .filter((dm) => !dm.redirect_to)
                            .map((dm) => (
                              <a key={dm.id} href={domainUrl(dm)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                                {dm.hostname} <Icon name="external-link" size={12} className="text-subtle" />
                              </a>
                            ))}
                          {direct ? (
                            <a href={direct} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted hover:underline">
                              {direct.replace("http://", "")} <Icon name="external-link" size={12} className="text-subtle" />
                            </a>
                          ) : (
                            <span className="text-muted">port {a.host_port}</span>
                          )}
                          <Link href="/dashboard/domains" className="text-xs text-subtle hover:text-fg">
                            {appDomains.data?.length ? "Manage domains" : "Add a domain"}
                          </Link>
                        </span>
                      ),
                    },
                    {
                      label: "Runtime",
                      value: (
                        <span>
                          Docker on{" "}
                          <Link href={`/dashboard/servers/${a.server_id}`} className="hover:underline">
                            {a.server_name}
                          </Link>
                        </span>
                      ),
                    },
                    {
                      label: "Source",
                      value: (
                        <span className="flex flex-col gap-0.5 text-[13px]">
                          {a.source_type === "git" ? (
                            <>
                              <span className="flex min-w-0 items-center gap-1.5">
                                <Icon name="github" size={14} className="shrink-0 text-subtle" /> <span className="truncate">{repoName(a.repo_url)}</span>
                              </span>
                              {current.commit_sha && (
                                <span className="flex min-w-0 items-center gap-1.5">
                                  <Icon name="git-commit" size={14} className="shrink-0 text-subtle" /> <Mono>{shortSha(current.commit_sha)}</Mono>
                                  <span className="truncate text-muted">{current.commit_message}</span>
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="flex min-w-0 items-center gap-1.5">
                              <Icon name="container" size={14} className="shrink-0 text-subtle" /> <Mono className="truncate">{current.image_ref}</Mono>
                            </span>
                          )}
                        </span>
                      ),
                    },
                    { label: "Health check", value: <Mono className="text-muted">GET {a.health_path}</Mono> },
                  ]}
                />
              ) : (
                <div className="flex h-full flex-col justify-center gap-2 text-sm text-muted">
                  <span className="text-fg">Not live yet</span>
                  <span>Once a deployment passes its health check it will serve on port {a.host_port}.</span>
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
                {latest && (
                  <ButtonLink href={`/dashboard/deployments/${latest.id}`} variant="secondary" size="sm" icon="file-text">
                    Build Logs
                  </ButtonLink>
                )}
                <ButtonLink href={`/dashboard/applications/${a.id}/logs`} variant="secondary" size="sm" icon="terminal">
                  Runtime Logs
                </ButtonLink>
                <ButtonLink href={`/dashboard/servers/${a.server_id}`} variant="secondary" size="sm" icon="server">
                  Server
                </ButtonLink>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <SectionTitle
            action={
              <Link href="/dashboard/deployments" className="text-[13px] text-muted hover:text-fg">
                View all
              </Link>
            }
          >
            Deployments
          </SectionTitle>
          <Card className="overflow-hidden">
            {deployments.data?.length ? (
              deployments.data.slice(0, 8).map((d) => <DeploymentRow key={d.id} d={d} showApp={false} />)
            ) : (
              <p className="p-4 text-sm text-subtle">{deployments.isLoading ? "Loading…" : "No deployments yet."}</p>
            )}
          </Card>
        </section>

        <UptimeSection domains={appDomains.data ?? []} />
        <TrafficSection appId={a.id} />
        <UsageSection appId={a.id} />
        <ErrorsSection appId={a.id} />

        <EnvSection key={`env-${a.id}`} app={a} onRedeploy={() => deploy.mutate(undefined, { onSuccess: (d) => goTo(d.id) })} />
        <SettingsSection key={`settings-${a.id}`} app={a} />
        <PreviewsSection key={`previews-${a.id}`} app={a} />
        <RunCommandSection app={a} />
        <CronSection app={a} />
        <ErrorAlertsSection key={`errors-${a.id}`} app={a} />
        <AppBackupsSection app={a} />
        <MoveSection app={a} domains={appDomains.data ?? []} />

        <FormCard
          danger
          title="Delete Application"
          description="Stops and removes the container, its images and checkout on the server, and deletes the deployment history. Other apps are not affected."
          action={
            <Button variant="danger" size="sm" onClick={() => setConfirm("delete")}>
              Delete
            </Button>
          }
        />
      </Container>

      <ConfirmDialog
        open={confirm === "rollback"}
        onClose={() => setConfirm(null)}
        danger={false}
        title={`Roll back ${a.name}`}
        confirmText={a.name}
        action="Roll back"
        onConfirm={() => {
          setConfirm(null);
          if (previous) rollback.mutate(previous.id, { onSuccess: (d) => goTo(d.id) });
        }}
      >
        Release the image from deployment <Mono className="text-fg">{previous?.id.slice(0, 10)}</Mono>
        {previous?.commit_sha && <> ({shortSha(previous.commit_sha)})</>} again. Nothing is rebuilt, and it gets the same health check before it goes live. Current environment variables are used.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        title="Delete Application"
        confirmText={a.name}
        phrase="delete my application"
        action="Delete"
        onConfirm={() => {
          setConfirm(null);
          remove.mutate(a.id, { onSuccess: () => router.push("/dashboard/applications") });
        }}
      >
        {a.name} will be stopped and removed from {a.server_name}.
      </ConfirmDialog>
    </>
  );
}

function EnvSection({ app, onRedeploy }: { app: App; onRedeploy: () => void }) {
  const update = useUpdateApp(app.id);
  const [rows, setRows] = useState<EnvDraft[]>(() => draftFrom(app.env));
  const [saved, setSaved] = useState(false);
  const problem = envProblem(rows);
  const save = (thenDeploy: boolean) =>
    update.mutate(
      { env: envPayload(rows) },
      {
        onSuccess: (fresh) => {
          setRows(draftFrom(fresh.env));
          setSaved(true);
          if (thenDeploy) onRedeploy();
        },
      },
    );

  return (
    <FormCard
      title="Environment Variables"
      description="Encrypted at rest. Secret values are write-only: leave one blank to keep it. PORT is set from the container port."
      footer={update.error ? <span className="text-err">{update.error.message}</span> : problem && rows.length ? problem : saved ? "Saved. Changes apply on the next deployment." : "Changes apply on the next deployment."}
      action={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled={!!problem || update.isPending} onClick={() => save(false)}>
            Save
          </Button>
          <Button variant="primary" size="sm" disabled={!!problem || update.isPending} onClick={() => save(true)}>
            Save & Redeploy
          </Button>
        </div>
      }
    >
      <EnvEditor
        rows={rows}
        onChange={(next) => {
          setSaved(false);
          setRows(next);
        }}
      />
    </FormCard>
  );
}

function SettingsSection({ app }: { app: App }) {
  const update = useUpdateApp(app.id);
  const [form, setForm] = useState({
    branch: app.branch ?? "",
    image: app.image ?? "",
    dockerfile: app.dockerfile,
    build_context: app.build_context,
    build_command: app.build_command ?? "",
    start_command: app.start_command ?? "",
    compose_file: app.compose_file ?? "",
    compose_service: app.compose_service ?? "",
    container_port: String(app.container_port),
    host_port: String(app.host_port),
    health_path: app.health_path,
    health_timeout_seconds: String(app.health_timeout_seconds),
    cpu_limit: app.cpu_limit ?? "",
    memory_limit: app.memory_limit ?? "",
    data_path: app.data_path ?? "",
    release_command: app.release_command ?? "",
    auto_deploy: app.auto_deploy,
    private_port: app.private_port,
  });
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };
  const save = () =>
    update.mutate(
      {
        ...(app.source_type === "git"
          ? {
              branch: form.branch.trim(),
              dockerfile: form.dockerfile.trim(),
              build_context: form.build_context.trim(),
              build_command: form.build_command.trim() || null,
              start_command: form.start_command.trim() || null,
            }
          : { image: form.image.trim() }),
        ...(app.runtime === "compose" ? { compose_file: form.compose_file.trim() || null, compose_service: form.compose_service.trim() || null } : {}),
        container_port: Number(form.container_port),
        host_port: Number(form.host_port),
        health_path: form.health_path.trim(),
        health_timeout_seconds: Number(form.health_timeout_seconds),
        cpu_limit: form.cpu_limit.trim() || null,
        memory_limit: form.memory_limit.trim().toLowerCase() || null,
        ...(app.runtime === "docker" ? { data_path: form.data_path.trim() } : {}),
        release_command: form.release_command.trim() || null,
        ...(app.runtime !== "systemd" ? { private_port: form.private_port } : {}),
        ...(app.github_repo ? { auto_deploy: form.auto_deploy } : {}),
      },
      { onSuccess: () => setSaved(true) },
    );

  return (
    <FormCard
      title="Build & Runtime"
      description="How the next deployment is built and checked. A candidate must pass the health check before it replaces the live version."
      footer={
        update.error ? (
          <span className="text-err">{update.error.message}</span>
        ) : saved ? (
          "Saved. Changes apply on the next deployment."
        ) : app.runtime === "systemd" ? (
          `Runs as the systemd service vp-${app.name} and listens on port ${app.host_port} ($PORT) on ${app.server_name ?? "the server"}.`
        ) : app.runtime === "compose" ? (
          `Port ${app.host_port} on ${app.server_name ?? "the server"} forwards to port ${app.container_port} of the ${app.compose_service ?? "public"} service.`
        ) : (
          `Port ${app.host_port} on ${app.server_name ?? "the server"} forwards to port ${app.container_port} in the container.`
        )
      }
      action={
        <Button variant="primary" size="sm" disabled={update.isPending} onClick={save}>
          Save
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {app.source_type === "git" ? (
          <>
            <Field id="branch" label="Branch" value={form.branch} onChange={set("branch")} mono />
            {app.runtime === "docker" && <Field id="dockerfile" label="Dockerfile (if present)" value={form.dockerfile} onChange={set("dockerfile")} mono />}
            <Field id="context" label="Root directory" value={form.build_context} onChange={set("build_context")} mono />
            {app.runtime === "compose" ? (
              <>
                <Field id="composefile" label="Compose file" value={form.compose_file} onChange={set("compose_file")} placeholder="compose.yaml" mono />
                <Field id="composeservice" label="Public service" value={form.compose_service} onChange={set("compose_service")} placeholder="the only service" mono />
              </>
            ) : (
              <div className="sm:col-span-3 grid gap-4 sm:grid-cols-2">
                <Field id="buildcmd" label={app.runtime === "docker" ? "Build command (no Dockerfile)" : "Build command"} value={form.build_command} onChange={set("build_command")} placeholder="detected automatically" mono />
                <Field id="startcmd" label={app.runtime === "docker" ? "Start command (no Dockerfile)" : "Start command"} value={form.start_command} onChange={set("start_command")} placeholder="detected automatically" mono />
              </div>
            )}
          </>
        ) : (
          <div className="sm:col-span-3">
            <Field id="image" label="Image" value={form.image} onChange={set("image")} mono />
          </div>
        )}
        {app.runtime !== "systemd" && <Field id="port" label={app.runtime === "compose" ? "Service port" : "Container port"} value={form.container_port} onChange={set("container_port")} mono />}
        <Field id="hostport" label="Public port (on the server)" value={form.host_port} onChange={set("host_port")} mono />
        <Field id="hc" label="Health check path" value={form.health_path} onChange={set("health_path")} mono />
        <Field id="hct" label="Health timeout (s)" value={form.health_timeout_seconds} onChange={set("health_timeout_seconds")} />
        {app.runtime !== "compose" && (
          <>
            <Field id="cpu" label="CPUs" value={form.cpu_limit} onChange={set("cpu_limit")} placeholder="no limit" />
            <Field id="mem" label="Memory" value={form.memory_limit} onChange={set("memory_limit")} placeholder="e.g. 512m" />
          </>
        )}
        {app.runtime === "docker" && (
          <Field id="datapath" label="Data folder (kept across deploys)" value={form.data_path} onChange={set("data_path")} placeholder="e.g. /app/uploads" mono />
        )}
        <div className="sm:col-span-3">
          <Field
            id="releasecmd"
            label="Release command (runs before each new version goes live; a failure stops the deploy)"
            value={form.release_command}
            onChange={set("release_command")}
            placeholder="e.g. npx prisma migrate deploy"
            mono
          />
        </div>
        <div>
          <Label>Source</Label>
          <div className="flex h-10 items-center gap-2 truncate rounded-md border border-line bg-bg-200 px-3 text-[13px] text-muted">
            <Icon name={app.source_type === "git" ? "github" : "container"} size={14} />
            {app.github_repo ? (
              <a href={`https://github.com/${app.github_repo}`} target="_blank" rel="noreferrer" className="truncate hover:text-fg hover:underline">
                {app.github_repo}
              </a>
            ) : (
              <span className="truncate">{app.source_type === "git" ? repoName(app.repo_url) : "Container image"}</span>
            )}
            <Badge className="ml-auto">{runtimeLabel[app.runtime] ?? app.runtime}</Badge>
          </div>
        </div>
        {app.runtime !== "systemd" && (
          <label className="flex cursor-pointer items-center gap-3 sm:col-span-3">
            <input
              type="checkbox"
              checked={form.private_port}
              onChange={(e) => {
                setSaved(false);
                setForm((f) => ({ ...f, private_port: e.target.checked }));
              }}
              className="accent-[var(--color-accent)]"
            />
            <span className="text-sm">
              Private port: reachable only through the app&apos;s domains, not on port {app.host_port} from the internet (applies on the next deploy)
            </span>
          </label>
        )}
        {app.github_repo && (
          <label className="flex cursor-pointer items-center gap-3 sm:col-span-3">
            <input
              type="checkbox"
              checked={form.auto_deploy}
              onChange={(e) => {
                setSaved(false);
                setForm((f) => ({ ...f, auto_deploy: e.target.checked }));
              }}
              className="accent-[var(--color-accent)]"
            />
            <span className="text-sm">
              Deploy on every push to <span className="font-mono">{form.branch || app.branch}</span>
            </span>
          </label>
        )}
      </div>
    </FormCard>
  );
}

function ErrorAlertsSection({ app }: { app: App }) {
  const update = useUpdateApp(app.id);
  const [text, setText] = useState(app.error_ignore.join("\n"));
  const [saved, setSaved] = useState(false);
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const problem = lines.length > 20 ? "Up to 20 lines" : lines.some((l) => l.length < 2 || l.length > 200) ? "Each line needs 2 to 200 characters" : null;

  return (
    <FormCard
      title="Error Alerts"
      description="VPSPilot counts error lines in this app's logs and alerts you (App logging errors). Lines containing any of the text below are left out, for noise you already know about."
      footer={update.error ? <span className="text-err">{update.error.message}</span> : problem ? problem : saved ? "Saved. The agent picks it up within a minute." : "One per line, plain text, not case-sensitive."}
      action={
        <Button
          variant="primary"
          size="sm"
          disabled={!!problem || update.isPending}
          onClick={() => update.mutate({ error_ignore: lines }, { onSuccess: () => setSaved(true) })}
        >
          Save
        </Button>
      }
    >
      <Label htmlFor="ignore">Ignore error lines containing</Label>
      <textarea
        id="ignore"
        value={text}
        onChange={(e) => {
          setSaved(false);
          setText(e.target.value);
        }}
        rows={3}
        spellCheck={false}
        placeholder={"ECONNRESET\nDeprecationWarning"}
        className="w-full rounded-md border border-line bg-bg px-3 py-2 font-mono text-[12px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
      />
    </FormCard>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  mono,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={onChange} placeholder={placeholder} className={mono ? "font-mono" : undefined} />
    </div>
  );
}

function AppPreview({ name, url, live }: { name: string; url: string | null; live: boolean }) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-[#0b0b0b]">
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        <span className="size-2 rounded-full bg-[#333]" />
        <span className="size-2 rounded-full bg-[#333]" />
        <span className="size-2 rounded-full bg-[#333]" />
        <span className="ml-2 truncate rounded bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-subtle">{url?.replace("http://", "") ?? `${name}.internal`}</span>
      </div>
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgb(165_76_162/0.22),transparent_60%)]" />
        <div className="relative text-center">
          <div className="text-2xl font-semibold tracking-tight">{name}</div>
          <div className="mt-1 text-xs text-subtle">{live ? "Serving traffic" : "Waiting for the first release"}</div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-line px-3 py-2 text-[11px] text-subtle">
        <span>Live preview</span>
        <Badge tone={live ? "ok" : "neutral"}>{live ? "Live" : "Not live"}</Badge>
      </div>
    </div>
  );
}
