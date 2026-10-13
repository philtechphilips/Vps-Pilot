import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandChip } from "@/components/brand-chip";
import { DetailHeader, InfoGrid } from "@/components/dashboard/detail";
import { Icon } from "@/components/icons";
import { Avatar, Badge, Button, Card, Container, Dot, Mono, SectionTitle } from "@/components/ui";
import { buildLog, deployLabel, deployments, deployTone, failedLog, getApp, getDeployment, getServer } from "@/lib/data";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return deployments.map((d) => ({ id: d.id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Deployment ${id}` };
}

const levelClass = { info: "text-fg", warn: "text-warn", err: "text-err", ok: "text-ok", muted: "text-subtle" } as const;

export default async function DeploymentPage({ params }: Props) {
  const { id } = await params;
  const d = getDeployment(id);
  if (!d) notFound();
  const app = getApp(d.appId);
  const server = getServer(d.serverId);
  const failed = d.status === "error";
  const building = d.status === "building";
  const log = failed ? failedLog : building ? buildLog.slice(0, 11) : buildLog;

  const steps: { label: string; state: "done" | "failed" | "active" | "pending" | "skipped"; time: string }[] = failed
    ? [
        { label: "Queued", state: "done", time: "0s" },
        { label: "Pull / Build", state: "done", time: "1m 32s" },
        { label: "Health check", state: "failed", time: "30s" },
        { label: "Promote", state: "skipped", time: "—" },
      ]
    : building
      ? [
          { label: "Queued", state: "done", time: "0s" },
          { label: "Build", state: "active", time: "48s" },
          { label: "Health check", state: "pending", time: "—" },
          { label: "Promote", state: "pending", time: "—" },
        ]
      : [
          { label: "Queued", state: "done", time: "0s" },
          { label: "Build", state: "done", time: "1m 42s" },
          { label: "Health check", state: "done", time: "4s" },
          { label: "Promote", state: "done", time: "1s" },
        ];

  return (
    <>
      <DetailHeader
        back={app ? `/dashboard/applications/${app.id}` : "/dashboard/deployments"}
        backLabel={app?.name ?? "Deployments"}
        title={
          <>
            Deployment Details
            {d.current && <Badge tone="blue">Current</Badge>}
          </>
        }
        actions={
          <>
            {building && (
              <Button variant="secondary" size="md" icon="stop">
                Cancel
              </Button>
            )}
            {!d.current && d.status === "ready" && (
              <Button variant="secondary" size="md" icon="rollback">
                Promote to Production
              </Button>
            )}
            <Button variant="secondary" size="md" icon="refresh">
              Redeploy
            </Button>
            <Button variant="primary" size="md" icon="external-link">
              Visit
            </Button>
          </>
        }
      />
      <Container className="space-y-8">
        <Card className="p-5 sm:p-6">
          <InfoGrid
            className="lg:grid-cols-3"
            items={[
              { label: "Deployment", value: <Mono>{d.id}</Mono> },
              {
                label: "Status",
                value: (
                  <span className="flex items-center gap-2">
                    <Dot tone={deployTone[d.status]} pulse={building} /> {deployLabel[d.status]}
                  </span>
                ),
              },
              { label: "Environment", value: d.env },
              {
                label: "Application",
                value: app ? (
                  <Link href={`/dashboard/applications/${app.id}`} className="flex items-center gap-2 hover:underline">
                    <BrandChip name={app.framework} size={18} /> {app.name}
                  </Link>
                ) : (
                  "—"
                ),
              },
              {
                label: "Target",
                value: (
                  <Link href={`/dashboard/servers/${server?.id}`} className="hover:underline">
                    {server?.name} · {app?.runtime}
                  </Link>
                ),
              },
              { label: "Duration", value: `${d.duration} (${d.created})` },
              {
                label: "Source",
                value: (
                  <span className="flex items-center gap-1.5">
                    <Icon name="git-branch" size={14} className="text-subtle" /> {d.branch}
                    <Icon name="git-commit" size={14} className="ml-2 text-subtle" /> <Mono>{d.commit}</Mono>
                  </span>
                ),
              },
              { label: "Commit message", value: <span className="text-muted">{d.message}</span> },
              {
                label: "Created by",
                value: (
                  <span className="flex items-center gap-2">
                    <Avatar name={d.author} size={18} /> {d.author} · {d.trigger}
                  </span>
                ),
              },
            ]}
          />
        </Card>

        <section>
          <SectionTitle>Pipeline</SectionTitle>
          <Card className="grid overflow-hidden sm:grid-cols-4">
            {steps.map((s) => (
              <div key={s.label} className="flex items-center gap-3 border-b border-line p-4 last:border-0 sm:border-r sm:border-b-0">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border",
                    s.state === "done" && "border-ok/40 bg-ok/15 text-ok",
                    s.state === "failed" && "border-err/40 bg-err/15 text-err",
                    s.state === "active" && "border-warn/40 bg-warn/15 text-warn",
                    (s.state === "pending" || s.state === "skipped") && "border-line-strong text-subtle",
                  )}
                >
                  <Icon
                    name={s.state === "done" ? "check" : s.state === "failed" ? "x" : s.state === "active" ? "clock" : "minus"}
                    size={12}
                    strokeWidth={2.5}
                  />
                </span>
                <div>
                  <div className={cn("text-sm", s.state === "pending" || s.state === "skipped" ? "text-subtle" : "text-fg")}>{s.label}</div>
                  <div className="text-xs text-subtle">{s.state === "skipped" ? "Skipped" : s.time}</div>
                </div>
              </div>
            ))}
          </Card>
        </section>

        <section>
          <SectionTitle
            action={
              <span className="flex items-center gap-2 text-xs text-subtle">
                <Icon name="lock" size={12} /> Secrets redacted · {log.length} lines
              </span>
            }
          >
            Build Logs
          </SectionTitle>
          <div className="overflow-hidden rounded-lg border border-line bg-bg">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-xs">
              <span className={cn("flex items-center gap-1.5", failed ? "text-err" : "text-muted")}>
                <Icon name={failed ? "x-circle" : "check-circle"} size={14} className={failed ? "" : "text-ok"} />
                {failed ? "1 error" : "0 errors"}
              </span>
              <span className="flex items-center gap-1.5 text-muted">
                <Icon name="alert" size={14} className="text-warn" />
                {log.filter((l) => l.level === "warn").length} warnings
              </span>
              <button type="button" className="ml-auto inline-flex items-center gap-1 text-muted hover:text-fg">
                <Icon name="download" size={14} /> Download
              </button>
            </div>
            <div className="thin-scrollbar max-h-[520px] overflow-auto py-2 font-mono text-[12.5px] leading-[22px]">
              {log.map((l, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-4 px-4 hover:bg-white/[0.03]",
                    l.level === "err" && "bg-err/[0.07]",
                    l.level === "warn" && "bg-warn/[0.05]",
                  )}
                >
                  <span className="w-6 shrink-0 text-right text-subtle select-none">{i + 1}</span>
                  <span className="hidden shrink-0 text-subtle sm:inline">{l.t}</span>
                  <span className={cn("whitespace-pre-wrap", levelClass[l.level ?? "info"])}>{l.text}</span>
                </div>
              ))}
              {building && (
                <div className="flex gap-4 px-4">
                  <span className="w-6 shrink-0" />
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
