import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandChip } from "@/components/brand-chip";
import { AreaChart, Legend } from "@/components/charts";
import { CopyButton } from "@/components/copy-button";
import { ChartCard, DetailHeader, InfoGrid, RangeTabs } from "@/components/dashboard/detail";
import { Dropdown, MenuItem } from "@/components/dashboard/nav";
import { Icon } from "@/components/icons";
import { Badge, Button, Callout, Card, Container, Dot, FormCard, Meter, Mono, SectionTitle, Table, Td, Th } from "@/components/ui";
import { apps, databases, dbTone, deployLabel, deployTone, getServer, serverHistory, servers, serverTone, services, timeLabels } from "@/lib/data";

export function generateStaticParams() {
  return servers.map((s) => ({ id: s.id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: getServer(id)?.name ?? "Server" };
}

const svcTone = { running: "ok", exited: "neutral", restarting: "warn", failed: "err" } as const;

export default async function ServerPage({ params }: Props) {
  const { id } = await params;
  const s = getServer(id);
  if (!s) notFound();

  const h = serverHistory(s.id);
  const off = s.status === "offline";
  const svc = services[s.id] ?? [];
  const serverApps = apps.filter((a) => a.serverId === s.id);
  const serverDbs = databases.filter((d) => d.serverId === s.id);

  return (
    <>
      <DetailHeader
        back="/dashboard/servers"
        backLabel="Servers"
        title={
          <>
            {s.name}
            {s.controlPlane && <Badge tone="blue">Control plane</Badge>}
          </>
        }
        meta={
          <>
            <span className="flex items-center gap-2 capitalize">
              <Dot tone={serverTone[s.status]} pulse={s.status === "online"} /> {s.status}
            </span>
            <span className="flex items-center gap-1 font-mono text-[13px]">
              {s.ip}
              <CopyButton value={s.ip} />
            </span>
            <span>
              {s.provider} · {s.region}
            </span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" size="md" icon="terminal">
              Run Action
            </Button>
            <Dropdown
              label="More actions"
              trigger={
                <span className="inline-flex size-10 items-center justify-center rounded-md border border-line-strong bg-bg-100 text-fg hover:bg-bg-300">
                  <Icon name="more" />
                </span>
              }
            >
              <MenuItem href="#" icon="refresh">Restart agent</MenuItem>
              <MenuItem href="#" icon="download">Update agent</MenuItem>
              <MenuItem href="#" icon="key">Rotate credentials</MenuItem>
              <MenuItem href="#" icon="rollback">Reboot server…</MenuItem>
              <div className="my-1 h-px bg-line" />
              <MenuItem href="#danger" icon="x-circle" danger>
                Revoke agent…
              </MenuItem>
            </Dropdown>
          </>
        }
      />

      <Container className="space-y-8">
        {off && (
          <Callout tone="err" icon="alert" title={`Agent offline — last heartbeat ${s.heartbeat}`}>
            Jobs targeting this server are paused and will expire. Check that <Mono>vpspilot-agent.service</Mono> is running and that outbound HTTPS to the control plane is
            allowed.
          </Callout>
        )}
        {s.status === "degraded" && (
          <Callout tone="warn" icon="alert" title="Memory pressure">
            Memory has been above 85% for 42 minutes. Swap usage is {s.swap}%. Consider raising <Mono>shared_buffers</Mono> limits or adding RAM.
          </Callout>
        )}

        <Card className="p-5 sm:p-6">
          <InfoGrid
            items={[
              {
                label: "Operating system",
                value: (
                  <span className="flex items-center gap-2">
                    <BrandChip name={s.os} size={18} /> {s.os} {s.osVersion}
                  </span>
                ),
              },
              { label: "Architecture", value: s.arch },
              { label: "Resources", value: `${s.vcpu} vCPU · ${s.memoryGb} GB RAM · ${s.diskGb} GB disk` },
              { label: "Uptime", value: s.uptime },
              { label: "Agent", value: <Mono>{s.agentVersion}{s.agentVersion !== "0.4.2" && <span className="ml-2 text-warn">update available</span>}</Mono> },
              { label: "Last heartbeat", value: s.heartbeat },
              { label: "Load average", value: <Mono>{s.load.join("  ")}</Mono> },
              { label: "Hostname", value: <Mono>{s.hostname}</Mono> },
            ]}
          />
        </Card>

        <section>
          <SectionTitle action={<RangeTabs />}>Metrics</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="CPU" value={off ? "—" : `${s.cpu}%`} sub={`${s.vcpu} vCPU`}>
              <AreaChart series={[{ name: "CPU", data: h.cpu, color: s.cpu > 60 ? "warn" : "blue" }]} labels={timeLabels} height={150} />
            </ChartCard>
            <ChartCard title="Memory" value={off ? "—" : `${s.memory}%`} sub={`of ${s.memoryGb} GB · swap ${s.swap}%`}>
              <AreaChart series={[{ name: "Memory", data: h.memory, color: s.memory > 85 ? "err" : "violet" }]} labels={timeLabels} height={150} />
            </ChartCard>
            <ChartCard
              title="Network"
              value={s.netOut}
              sub={`out · ${s.netIn} in`}
              right={
                <Legend
                  items={[
                    { name: "In", color: "teal" },
                    { name: "Out", color: "blue" },
                  ]}
                />
              }
            >
              <AreaChart
                series={[
                  { name: "In", data: h.netIn, color: "teal" },
                  { name: "Out", data: h.netOut, color: "blue" },
                ]}
                labels={timeLabels}
                unit=" MB/s"
                max={100}
                height={150}
              />
            </ChartCard>
            <ChartCard title="Disk" value={`${s.disk}%`} sub={`of ${s.diskGb} GB · inodes ${s.inodes}%`}>
              <div className="space-y-4 pt-2">
                {[
                  { mount: "/", used: s.disk, size: `${Math.round((s.diskGb * s.disk) / 100)} / ${s.diskGb} GB` },
                  { mount: "/var/lib/docker", used: Math.min(95, s.disk + 9), size: "overlay2" },
                  { mount: "inodes", used: s.inodes, size: "ext4" },
                ].map((d) => (
                  <div key={d.mount}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <Mono className="text-fg">{d.mount}</Mono>
                      <span className="text-subtle">
                        {d.size} · {d.used}%
                      </span>
                    </div>
                    <Meter value={d.used} />
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </section>

        <section>
          <SectionTitle action={<span className="text-xs text-subtle">{svc.length} services</span>}>Services & Containers</SectionTitle>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th>CPU</Th>
                <Th>Memory</Th>
                <Th>Uptime</Th>
                <Th className="w-28 text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {svc.map((v) => (
                <tr key={v.name} className="hover:bg-white/[0.02]">
                  <Td>
                    <div className="font-medium">{v.name}</div>
                    {v.image && <Mono className="text-subtle">{v.image}</Mono>}
                  </Td>
                  <Td>
                    <Badge>{v.kind}</Badge>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-2 capitalize">
                      <Dot tone={svcTone[v.status]} pulse={v.status === "restarting"} /> {v.status}
                    </span>
                  </Td>
                  <Td className="font-mono text-[13px] text-muted">{v.cpu}</Td>
                  <Td className="font-mono text-[13px] text-muted">{v.memory}</Td>
                  <Td className="text-muted">{v.uptime}</Td>
                  <Td className="text-right">
                    <span className="inline-flex gap-1">
                      <button type="button" className="inline-flex size-7 items-center justify-center rounded text-subtle hover:bg-white/10 hover:text-fg" aria-label={`Restart ${v.name}`} title="Restart">
                        <Icon name="refresh" size={14} />
                      </button>
                      <button type="button" className="inline-flex size-7 items-center justify-center rounded text-subtle hover:bg-white/10 hover:text-fg" aria-label={`Logs for ${v.name}`} title="Logs">
                        <Icon name="file-text" size={14} />
                      </button>
                      <button type="button" className="inline-flex size-7 items-center justify-center rounded text-subtle hover:bg-white/10 hover:text-fg" aria-label={`Stop ${v.name}`} title="Stop">
                        <Icon name="stop" size={14} />
                      </button>
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <SectionTitle>Applications</SectionTitle>
            <Card className="overflow-hidden">
              {serverApps.length === 0 && <p className="p-4 text-sm text-muted">No applications deployed to this server.</p>}
              {serverApps.map((a) => (
                <Link key={a.id} href={`/dashboard/applications/${a.id}`} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-white/[0.02]">
                  <BrandChip name={a.framework} size={26} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{a.name}</div>
                    <div className="truncate text-xs text-subtle">
                      {a.runtime} · {a.domains[0] ?? "no domain"}
                    </div>
                  </div>
                  <span className="flex items-center gap-2 text-xs text-muted">
                    <Dot tone={deployTone[a.status]} /> {deployLabel[a.status]}
                  </span>
                </Link>
              ))}
            </Card>
          </section>
          <section>
            <SectionTitle>Databases</SectionTitle>
            <Card className="overflow-hidden">
              {serverDbs.length === 0 && <p className="p-4 text-sm text-muted">No databases registered on this server.</p>}
              {serverDbs.map((d) => (
                <Link key={d.id} href={`/dashboard/databases/${d.id}`} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-white/[0.02]">
                  <BrandChip name={d.engine} size={26} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{d.name}</div>
                    <div className="truncate text-xs text-subtle">
                      {d.engine} {d.version} · {d.mode}
                    </div>
                  </div>
                  <span className="flex items-center gap-2 text-xs text-muted capitalize">
                    <Dot tone={dbTone[d.status]} /> {d.status}
                  </span>
                </Link>
              ))}
            </Card>
          </section>
        </div>

        <FormCard
          title="Agent identity"
          description="This agent authenticates with a per-agent credential issued at enrollment. Rotation issues a new credential without re-enrolling."
          footer={
            <span>
              Enrolled {s.enrolledAt} · credential rotated automatically every 30 days
            </span>
          }
          action={
            <Button variant="secondary" size="sm" icon="refresh">
              Rotate now
            </Button>
          }
        >
          <InfoGrid
            className="lg:grid-cols-3"
            items={[
              { label: "Fingerprint", value: <Mono>{s.fingerprint}</Mono> },
              { label: "Transport", value: "Outbound HTTPS polling · 5s" },
              { label: "Capabilities", value: "docker, systemd, proxy, postgres, backups" },
            ]}
          />
        </FormCard>

        <div id="danger">
          <FormCard
            danger
            title="Revoke Agent"
            description="Revoking immediately invalidates this agent’s credentials. Pending jobs are cancelled and the server is marked as revoked. Applications keep running."
            action={
              <Button variant="danger" size="sm">
                Revoke
              </Button>
            }
          />
        </div>
      </Container>
    </>
  );
}
