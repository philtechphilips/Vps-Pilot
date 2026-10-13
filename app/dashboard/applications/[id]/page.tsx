import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandChip } from "@/components/brand-chip";
import { AreaChart } from "@/components/charts";
import { DeploymentRow } from "@/components/dashboard/cards";
import { ChartCard, DetailHeader, InfoGrid } from "@/components/dashboard/detail";
import { EnvRow } from "@/components/dashboard/secret-row";
import { Icon } from "@/components/icons";
import { Badge, Button, ButtonLink, Callout, Card, Container, Dot, FormCard, Input, Label, Mono, SectionTitle } from "@/components/ui";
import { apps, deployLabel, deployments, deployTone, getApp, getServer } from "@/lib/data";
import { series } from "@/lib/utils";

export function generateStaticParams() {
  return apps.map((a) => ({ id: a.id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: getApp(id)?.name ?? "Application" };
}

export default async function ApplicationPage({ params }: Props) {
  const { id } = await params;
  const a = getApp(id);
  if (!a) notFound();

  const server = getServer(a.serverId);
  const appDeploys = deployments.filter((d) => d.appId === a.id);
  const current = appDeploys.find((d) => d.current) ?? appDeploys[0];
  const latencySeed = [...a.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  const labels = Array.from({ length: 30 }, (_, i) => `${13 + Math.floor(i / 2)}:${i % 2 ? "30" : "00"}`);

  return (
    <>
      <DetailHeader
        back="/dashboard/applications"
        backLabel="Applications"
        title={
          <>
            <BrandChip name={a.framework} size={32} className="rounded-full" />
            {a.name}
          </>
        }
        actions={
          <>
            <Button variant="secondary" size="md" icon="file-text">
              Logs
            </Button>
            <Button variant="secondary" size="md" icon="rollback">
              Instant Rollback
            </Button>
            <Button variant="primary" size="md" icon="rocket">
              Redeploy
            </Button>
          </>
        }
      />

      <Container className="space-y-8">
        {a.status === "error" && (
          <Callout tone="err" icon="x-circle" title="Latest deployment failed its health check">
            The previous healthy release is still serving production traffic. <Link href={`/dashboard/deployments/dpl_9TnB3sWc`} className="text-fg underline underline-offset-2">Inspect the build logs</Link>.
          </Callout>
        )}

        <section>
          <SectionTitle>Production Deployment</SectionTitle>
          <Card className="grid overflow-hidden lg:grid-cols-[420px_1fr]">
            <div className="border-b border-line bg-bg p-4 lg:border-r lg:border-b-0">
              <AppPreview name={a.name} domain={a.domains[0]} />
            </div>
            <div className="p-5 sm:p-6">
              <InfoGrid
                className="lg:grid-cols-2"
                items={[
                  { label: "Deployment", value: <Link href={`/dashboard/deployments/${current?.id}`} className="font-mono text-[13px] hover:underline">{current?.id}</Link> },
                  {
                    label: "Status",
                    value: (
                      <span className="flex items-center gap-2">
                        <Dot tone={deployTone[current?.status ?? "ready"]} /> {deployLabel[current?.status ?? "ready"]}
                        <span className="text-subtle">{current?.created}</span>
                      </span>
                    ),
                  },
                  {
                    label: "Domains",
                    value: a.domains.length ? (
                      <span className="flex flex-col gap-0.5">
                        {a.domains.map((d) => (
                          <a key={d} href="#" className="inline-flex items-center gap-1 hover:underline">
                            {d} <Icon name="external-link" size={12} className="text-subtle" />
                          </a>
                        ))}
                      </span>
                    ) : (
                      <span className="text-subtle">No public domain</span>
                    ),
                  },
                  {
                    label: "Runtime",
                    value: (
                      <span className="flex items-center gap-2">
                        <BrandChip name={a.runtime} size={18} /> {a.runtime} on{" "}
                        <Link href={`/dashboard/servers/${server?.id}`} className="hover:underline">
                          {server?.name}
                        </Link>
                      </span>
                    ),
                  },
                  {
                    label: "Source",
                    value: (
                      <span className="flex flex-col gap-0.5 text-[13px]">
                        <span className="flex items-center gap-1.5">
                          <Icon name="git-branch" size={14} className="text-subtle" /> {a.branch}
                        </span>
                        <span className="flex min-w-0 items-center gap-1.5">
                          <Icon name="git-commit" size={14} className="shrink-0 text-subtle" /> <Mono>{a.commit}</Mono>
                          <span className="truncate text-muted">{a.commitMessage}</span>
                        </span>
                      </span>
                    ),
                  },
                  { label: "Health check", value: <Mono className="text-muted">{a.healthCheck}</Mono> },
                ]}
              />
              <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
                <ButtonLink href={`/dashboard/deployments/${current?.id}`} variant="secondary" size="sm" icon="file-text">
                  Build Logs
                </ButtonLink>
                <ButtonLink href="/dashboard/logs" variant="secondary" size="sm" icon="terminal">
                  Runtime Logs
                </ButtonLink>
                <ButtonLink href="/dashboard/domains" variant="secondary" size="sm" icon="globe">
                  Domains
                </ButtonLink>
              </div>
            </div>
          </Card>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Requests" value="1,284/min" sub="via proxy access logs">
            <AreaChart series={[{ name: "Requests", data: a.requests, color: "blue" }]} labels={labels} unit="" height={140} max={100} />
          </ChartCard>
          <ChartCard title="p95 latency" value={`${Math.round(80 + (latencySeed % 140))} ms`} sub="health-check & proxy timings">
            <AreaChart series={[{ name: "p95", data: series(latencySeed, 30, 45, 16), color: "violet" }]} labels={labels} unit=" ms" height={140} max={100} />
          </ChartCard>
        </div>

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
            {appDeploys.map((d) => (
              <DeploymentRow key={d.id} d={d} showApp={false} />
            ))}
          </Card>
        </section>

        <section>
          <SectionTitle
            action={
              <Button variant="secondary" size="xs" icon="plus">
                Add
              </Button>
            }
          >
            Environment Variables
          </SectionTitle>
          <Card className="overflow-hidden">
            <EnvRow name="NODE_ENV" value="production" envs="Production" />
            <EnvRow name="DATABASE_URL" value="" secret envs="Production · from pg-main credential reference" />
            <EnvRow name="REDIS_URL" value="" secret envs="Production · from redis-cache" />
            <EnvRow name="STRIPE_SECRET_KEY" value="" secret envs="Production" />
            <EnvRow name="NEXT_PUBLIC_SITE_URL" value={`https://${a.domains[0] ?? "example.com"}`} envs="Production, Staging" />
            <EnvRow name="LOG_LEVEL" value="info" envs="Production, Staging" />
          </Card>
          <p className="mt-2 text-xs text-subtle">Secret values are encrypted at rest and never returned to the browser after they are saved.</p>
        </section>

        <FormCard
          title="Resource Limits"
          description="Applied to the container or systemd unit. Builds run separately with their own quotas."
          footer="Changes take effect on the next deployment."
          action={
            <Button variant="primary" size="sm">
              Save
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="cpu">CPU</Label>
              <Input id="cpu" defaultValue={a.limits.cpu} />
            </div>
            <div>
              <Label htmlFor="mem">Memory</Label>
              <Input id="mem" defaultValue={a.limits.memory} />
            </div>
            <div>
              <Label htmlFor="port">Internal port</Label>
              <Input id="port" defaultValue={a.port || ""} placeholder="—" />
            </div>
          </div>
        </FormCard>

        <FormCard
          title="Health Check"
          description="A candidate release must pass this check before it is promoted. Failing candidates are removed and the previous release keeps serving."
          action={
            <Button variant="primary" size="sm">
              Save
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
            <div>
              <Label htmlFor="hc">Endpoint</Label>
              <Input id="hc" defaultValue={a.healthCheck.split(" →")[0]} className="font-mono" />
            </div>
            <div>
              <Label htmlFor="hct">Timeout</Label>
              <Input id="hct" defaultValue="5s" />
            </div>
            <div>
              <Label htmlFor="hcn">Required passes</Label>
              <Input id="hcn" defaultValue="3" />
            </div>
          </div>
        </FormCard>

        <FormCard
          danger
          title="Delete Application"
          description="Stops the running release, removes proxy configuration and deletes release history. Domains are detached. Database data is not affected."
          action={
            <Button variant="danger" size="sm">
              Delete
            </Button>
          }
        />
      </Container>
    </>
  );
}

function AppPreview({ name, domain }: { name: string; domain?: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-[#0b0b0b]">
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        <span className="size-2 rounded-full bg-[#333]" />
        <span className="size-2 rounded-full bg-[#333]" />
        <span className="size-2 rounded-full bg-[#333]" />
        <span className="ml-2 truncate rounded bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-subtle">{domain ?? `${name}.internal`}</span>
      </div>
      <div className="aspect-[16/10] p-4">
        <div className="flex items-center justify-between">
          <span className="h-2.5 w-16 rounded bg-white/20" />
          <span className="flex gap-2">
            <span className="h-2 w-8 rounded bg-white/10" />
            <span className="h-2 w-8 rounded bg-white/10" />
            <span className="h-2 w-8 rounded bg-white/10" />
          </span>
        </div>
        <div className="mt-6 h-4 w-2/3 rounded bg-white/25" />
        <div className="mt-2 h-4 w-1/2 rounded bg-white/15" />
        <div className="mt-4 h-2 w-3/4 rounded bg-white/10" />
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-square rounded bg-gradient-to-br from-white/[0.08] to-white/[0.02]" />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-line px-3 py-2 text-[11px] text-subtle">
        <span>Live preview</span>
        <Badge tone="ok">200 OK</Badge>
      </div>
    </div>
  );
}
