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
import { type App, isDeploying, useApp, useAppDeployments, useDeleteApp, useDeploy, useRollback, useUpdateApp } from "@/lib/api/apps";
import { useServers } from "@/lib/api/servers";
import { timeAgo } from "@/lib/format";

export function AppDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const app = useApp(id);
  const deployments = useAppDeployments(id);
  const { data: servers } = useServers();
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
  const url = appUrl(a, servers);
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
          </>
        }
        actions={
          <>
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
                      value: url ? (
                        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                          {url.replace("http://", "")} <Icon name="external-link" size={12} className="text-subtle" />
                        </a>
                      ) : (
                        <span className="text-muted">port {a.host_port}</span>
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

        <EnvSection key={`env-${a.id}`} app={a} onRedeploy={() => deploy.mutate(undefined, { onSuccess: (d) => goTo(d.id) })} />
        <SettingsSection key={`settings-${a.id}`} app={a} />

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
    container_port: String(app.container_port),
    health_path: app.health_path,
    health_timeout_seconds: String(app.health_timeout_seconds),
    cpu_limit: app.cpu_limit ?? "",
    memory_limit: app.memory_limit ?? "",
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
          ? { branch: form.branch.trim(), dockerfile: form.dockerfile.trim(), build_context: form.build_context.trim() }
          : { image: form.image.trim() }),
        container_port: Number(form.container_port),
        health_path: form.health_path.trim(),
        health_timeout_seconds: Number(form.health_timeout_seconds),
        cpu_limit: form.cpu_limit.trim() || null,
        memory_limit: form.memory_limit.trim().toLowerCase() || null,
      },
      { onSuccess: () => setSaved(true) },
    );

  return (
    <FormCard
      title="Build & Runtime"
      description="How the next deployment is built and checked. A candidate must pass the health check before it replaces the live version."
      footer={update.error ? <span className="text-err">{update.error.message}</span> : saved ? "Saved. Changes apply on the next deployment." : `Published on port ${app.host_port} of the server.`}
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
            <Field id="dockerfile" label="Dockerfile" value={form.dockerfile} onChange={set("dockerfile")} mono />
            <Field id="context" label="Build context" value={form.build_context} onChange={set("build_context")} mono />
          </>
        ) : (
          <div className="sm:col-span-3">
            <Field id="image" label="Image" value={form.image} onChange={set("image")} mono />
          </div>
        )}
        <Field id="port" label="Container port" value={form.container_port} onChange={set("container_port")} mono />
        <Field id="hc" label="Health check path" value={form.health_path} onChange={set("health_path")} mono />
        <Field id="hct" label="Health timeout (s)" value={form.health_timeout_seconds} onChange={set("health_timeout_seconds")} />
        <Field id="cpu" label="CPUs" value={form.cpu_limit} onChange={set("cpu_limit")} placeholder="no limit" />
        <Field id="mem" label="Memory" value={form.memory_limit} onChange={set("memory_limit")} placeholder="e.g. 512m" />
        <div>
          <Label>Source</Label>
          <div className="flex h-10 items-center gap-2 truncate rounded-md border border-line bg-bg-200 px-3 text-[13px] text-muted">
            <Icon name={app.source_type === "git" ? "github" : "container"} size={14} />
            <span className="truncate">{app.source_type === "git" ? repoName(app.repo_url) : "Container image"}</span>
            <Badge className="ml-auto">{app.runtime}</Badge>
          </div>
        </div>
      </div>
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
