"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AreaChart, Legend } from "@/components/charts";
import { CommandPill } from "@/components/copy-button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ChartCard, DetailHeader, InfoGrid } from "@/components/dashboard/detail";
import { FilterTabs } from "@/components/dashboard/filter-tabs";
import { Icon } from "@/components/icons";
import { JobPanel, jobTitle, jobTone } from "@/components/servers/job-panel";
import { osLabel, StatusPill } from "@/components/servers/server-ui";
import { Badge, Button, Callout, Card, Container, Dot, EmptyState, FormCard, Meter, Mono, SectionTitle, Table, Td, Th } from "@/components/ui";
import {
  type MetricsRange,
  useDeleteServer,
  useReissueEnrollment,
  useRevokeServer,
  useServer,
  useServerMetrics,
} from "@/lib/api/servers";
import { isActive, type JobType, useRunAction, useServerJobs } from "@/lib/api/jobs";
import { formatBytes, formatDate, formatRate, formatUptime, timeAgo } from "@/lib/format";
import { UpdatesSection } from "./updates";

const PROTECTED = new Set(["vpspilot-agent.service", "vpspilot-helper.service"]);
const NO_STOP = new Set(["ssh.service", "sshd.service"]);

function ActionButton({ icon, label, onClick, disabled }: { icon: "refresh" | "play" | "stop" | "file-text"; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-7 items-center justify-center rounded text-subtle transition-colors hover:bg-white/10 hover:text-fg disabled:pointer-events-none disabled:opacity-30"
    >
      <Icon name={icon} size={14} />
    </button>
  );
}

const serviceTone = (s: { active: string; sub: string }) =>
  s.active === "active" ? "ok" : s.active === "failed" ? "err" : s.sub === "exited" || s.active === "inactive" ? "neutral" : "warn";

export function ServerDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const server = useServer(id);
  const [range, setRange] = useState<MetricsRange>("1h");
  const metrics = useServerMetrics(server.data && server.data.status !== "pending" ? id : undefined, range);
  const revoke = useRevokeServer();
  const remove = useDeleteServer();
  const reissue = useReissueEnrollment();
  const [confirm, setConfirm] = useState<"revoke" | "delete" | null>(null);
  const [serviceFilter, setServiceFilter] = useState<"running" | "failed" | "all">("running");
  const run = useRunAction(id);
  const jobs = useServerJobs(server.data && server.data.status !== "pending" ? id : undefined);
  const [openJob, setOpenJob] = useState<string | null>(null);
  const [pendingStop, setPendingStop] = useState<{ type: JobType; payload: Record<string, unknown>; name: string } | null>(null);
  const action = (type: JobType, payload: Record<string, unknown>) =>
    run.mutate({ type, payload }, { onSuccess: (job) => setOpenJob(job.id) });

  if (server.isLoading) {
    return (
      <Container className="space-y-4 pt-6">
        <div className="skeleton h-10 w-64 rounded" />
        <div className="skeleton h-40 rounded-xl" />
      </Container>
    );
  }
  if (server.error || !server.data) {
    return (
      <Container className="pt-6">
        <EmptyState
          icon="server"
          title={server.error?.status === 404 ? "Server not found" : "Couldn't load this server"}
          action={
            <Link href="/dashboard/servers" className="text-sm text-accent-fg hover:underline">
              Back to servers
            </Link>
          }
        >
          {server.error?.status === 404 ? "It may have been removed." : server.error?.message}
        </EmptyState>
      </Container>
    );
  }

  const s = server.data;
  const latest = s.latest;
  const live = s.status === "online";
  const points = metrics.data ?? [];
  const labels = points.map((p) =>
    range === "1h" || range === "24h"
      ? new Date(p.ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      : new Date(p.ts).toLocaleDateString(undefined, range === "7d" ? { weekday: "short", hour: "2-digit" } : { month: "short", day: "numeric" }),
  );
  const netMax = Math.max(1, ...points.flatMap((p) => [p.net_rx_bps, p.net_tx_bps]));
  const netUnit = netMax > 1_048_576 ? { div: 1_048_576, label: " MB/s" } : { div: 1024, label: " KB/s" };
  const services = s.inventory.services ?? [];
  const shownServices = services.filter((v) =>
    serviceFilter === "all" ? true : serviceFilter === "failed" ? v.active === "failed" : v.sub === "running",
  );
  const containers = s.inventory.containers ?? [];
  const runtimes = Object.entries(s.inventory.runtimes ?? {});

  return (
    <>
      <DetailHeader
        back="/dashboard/servers"
        backLabel="Servers"
        title={
          <>
            {s.name}
            {s.is_control_plane && <Badge tone="blue">Control plane</Badge>}
            {s.tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </>
        }
        meta={
          <>
            <StatusPill status={s.status} />
            {s.ip_addresses[0] && <Mono>{s.ip_addresses[0]}</Mono>}
            {s.hostname && <span>{s.hostname}</span>}
            <span>{s.status === "pending" ? `Added ${timeAgo(s.created_at)}` : `Heartbeat ${timeAgo(s.last_heartbeat_at)}`}</span>
          </>
        }
        actions={
          s.status === "revoked" || s.status === "pending" ? (
            <Button variant="secondary" size="md" icon="trash" onClick={() => setConfirm("delete")}>
              Remove
            </Button>
          ) : (
            <Button variant="secondary" size="md" icon="x-circle" onClick={() => setConfirm("revoke")}>
              Revoke agent
            </Button>
          )
        }
      />

      <Container className="space-y-8">
        {s.status === "pending" && (
          <FormCard
            title="Connect this server"
            description="Run this on the server as a user with sudo. The token works once and expires; get a fresh one if it has."
            action={
              <Button variant="secondary" size="sm" icon="refresh" disabled={reissue.isPending} onClick={() => reissue.mutate(s.id)}>
                {reissue.isPending ? "Creating…" : "New install command"}
              </Button>
            }
          >
            {reissue.data ? (
              <CommandPill command={reissue.data.install_command} className="w-full" />
            ) : (
              <p className="text-sm text-muted">The original command was shown when you added the server. Create a new one to copy it again.</p>
            )}
            {reissue.error && <p className="mt-3 text-sm text-err">{reissue.error.message}</p>}
          </FormCard>
        )}

        {s.status === "offline" && (
          <Callout tone="err" icon="alert" title={`No heartbeat ${timeAgo(s.last_heartbeat_at)}`}>
            The agent stopped reporting. Check <Mono>systemctl status vpspilot-agent</Mono> on the server and that it can reach the control plane over HTTPS.
          </Callout>
        )}
        {s.status === "revoked" && (
          <Callout tone="neutral" icon="x-circle" title={`Agent revoked ${timeAgo(s.revoked_at)}`}>
            Its credential no longer works and the agent has stopped. The server keeps running; remove it here or enroll it again with a new name.
          </Callout>
        )}

        {s.status !== "pending" && (
          <>
            <Card className="p-5 sm:p-6">
              <InfoGrid
                items={[
                  { label: "Operating system", value: osLabel(s) },
                  { label: "Architecture", value: s.arch ?? "—" },
                  { label: "Resources", value: s.cpu_count ? `${s.cpu_count} vCPU · ${formatBytes(s.memory_total, 1)} RAM · ${formatBytes(s.disk_total, 0)} disk` : "—" },
                  { label: "Uptime", value: formatUptime(s.uptime_seconds) },
                  { label: "Agent", value: <Mono>{s.agent_version ?? "—"}</Mono> },
                  { label: "Kernel", value: <Mono>{s.kernel ?? "—"}</Mono> },
                  { label: "Load average", value: latest ? <Mono>{`${latest.load_1}  ${latest.load_5}  ${latest.load_15}`}</Mono> : "—" },
                  { label: "IP addresses", value: <Mono>{s.ip_addresses.join(", ") || "—"}</Mono> },
                ]}
              />
            </Card>

            <section>
              <SectionTitle
                action={
                  <FilterTabs<MetricsRange>
                    value={range}
                    onChange={setRange}
                    options={[
                      { value: "1h", label: "1h" },
                      { value: "24h", label: "24h" },
                      { value: "7d", label: "7d" },
                      { value: "30d", label: "30d" },
                      { value: "90d", label: "90d" },
                    ]}
                  />
                }
              >
                Metrics
              </SectionTitle>
              {points.length < 2 ? (
                <Card className="p-8 text-center text-sm text-muted">
                  {metrics.isLoading ? "Loading metrics…" : "Collecting metrics — the first points appear within a minute."}
                </Card>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  <ChartCard title="CPU" value={latest ? `${Math.round(latest.cpu_percent)}%` : "—"} sub={`${s.cpu_count ?? "?"} vCPU · load ${latest?.load_1 ?? "—"}`}>
                    <AreaChart series={[{ name: "CPU", data: points.map((p) => p.cpu_percent), color: (latest?.cpu_percent ?? 0) > 70 ? "warn" : "blue" }]} labels={labels} height={150} />
                  </ChartCard>
                  <ChartCard
                    title="Memory"
                    value={latest ? `${Math.round(latest.memory_percent)}%` : "—"}
                    sub={latest ? `${formatBytes(latest.memory_used)} of ${formatBytes(s.memory_total)} · swap ${Math.round(latest.swap_percent)}%` : undefined}
                  >
                    <AreaChart
                      series={[
                        { name: "Memory", data: points.map((p) => p.memory_percent), color: (latest?.memory_percent ?? 0) > 85 ? "err" : "violet" },
                        { name: "Swap", data: points.map((p) => p.swap_percent), color: "gray" },
                      ]}
                      labels={labels}
                      height={150}
                    />
                  </ChartCard>
                  <ChartCard
                    title="Network"
                    value={latest ? formatRate(latest.net_tx_bps) : "—"}
                    sub={latest ? `out · ${formatRate(latest.net_rx_bps)} in` : undefined}
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
                        { name: "In", data: points.map((p) => +(p.net_rx_bps / netUnit.div).toFixed(2)), color: "teal" },
                        { name: "Out", data: points.map((p) => +(p.net_tx_bps / netUnit.div).toFixed(2)), color: "blue" },
                      ]}
                      labels={labels}
                      unit={netUnit.label}
                      height={150}
                    />
                  </ChartCard>
                  <ChartCard title="Disk" value={latest ? `${Math.round(latest.disk_percent)}%` : "—"} sub={latest ? `${formatBytes(latest.disk_used)} of ${formatBytes(s.disk_total)}` : undefined}>
                    <div className="space-y-4 pt-2">
                      {[
                        { label: "/ (root)", used: latest?.disk_percent ?? 0, note: latest ? `${formatBytes(latest.disk_used)} used` : "" },
                        { label: "inodes", used: latest?.inode_percent ?? 0, note: "files" },
                      ].map((d) => (
                        <div key={d.label}>
                          <div className="mb-1.5 flex justify-between text-xs">
                            <Mono className="text-fg">{d.label}</Mono>
                            <span className="text-subtle">
                              {d.note} · {Math.round(d.used)}%
                            </span>
                          </div>
                          <Meter value={d.used} />
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                </div>
              )}
            </section>

            <section>
              <SectionTitle
                action={
                  <FilterTabs
                    value={serviceFilter}
                    onChange={setServiceFilter}
                    options={[
                      { value: "running", label: "Running", count: services.filter((v) => v.sub === "running").length },
                      { value: "failed", label: "Failed", count: services.filter((v) => v.active === "failed").length },
                      { value: "all", label: "All", count: services.length },
                    ]}
                  />
                }
              >
                Services {s.inventory_at && <span className="ml-2 text-xs font-normal text-subtle">updated {timeAgo(s.inventory_at)}</span>}
              </SectionTitle>
              {services.length === 0 ? (
                <Card className="p-6 text-sm text-muted">The agent reports systemd services within a minute of starting.</Card>
              ) : (
                <Table className="max-h-[420px] overflow-y-auto">
                  <thead className="sticky top-0">
                    <tr>
                      <Th>Service</Th>
                      <Th>State</Th>
                      <Th>Description</Th>
                      <Th className="w-36 text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {shownServices.map((v) => (
                      <tr key={v.name} className="hover:bg-white/[0.02]">
                        <Td className="h-11 font-mono text-[13px]">{v.name.replace(/\.service$/, "")}</Td>
                        <Td className="h-11">
                          <span className="flex items-center gap-2 text-[13px]">
                            <Dot tone={serviceTone(v)} /> {v.active} · {v.sub}
                          </span>
                        </Td>
                        <Td className="h-11 max-w-[420px] truncate text-[13px] text-muted">{v.description}</Td>
                        <Td className="h-11 text-right">
                          <span className="inline-flex gap-0.5">
                            <ActionButton icon="file-text" label={`Logs for ${v.name}`} disabled={!live} onClick={() => action("service.logs", { unit: v.name, lines: 200 })} />
                            {!PROTECTED.has(v.name) && (
                              <>
                                <ActionButton icon="refresh" label={`Restart ${v.name}`} disabled={!live} onClick={() => action("service.restart", { unit: v.name })} />
                                {v.active === "active" ? (
                                  !NO_STOP.has(v.name) && (
                                    <ActionButton
                                      icon="stop"
                                      label={`Stop ${v.name}`}
                                      disabled={!live}
                                      onClick={() => setPendingStop({ type: "service.stop", payload: { unit: v.name }, name: v.name })}
                                    />
                                  )
                                ) : (
                                  <ActionButton icon="play" label={`Start ${v.name}`} disabled={!live} onClick={() => action("service.start", { unit: v.name })} />
                                )}
                              </>
                            )}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
              <section>
                <SectionTitle>Containers</SectionTitle>
                <Card className="overflow-hidden">
                  {!s.inventory.docker_access ? (
                    <div className="flex gap-3 p-4 text-sm text-muted">
                      <Icon name="lock" className="mt-0.5 shrink-0" />
                      <span>
                        {s.capabilities.docker
                          ? "Docker is installed but the privileged helper isn’t reporting containers. Re-run the install command to update the agent."
                          : "Docker isn’t installed on this server."}
                      </span>
                    </div>
                  ) : containers.length === 0 ? (
                    <p className="p-4 text-sm text-muted">No containers.</p>
                  ) : (
                    containers.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                        <Dot tone={c.state === "running" ? "ok" : c.state === "restarting" ? "warn" : "neutral"} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm">{c.name}</div>
                          <div className="truncate font-mono text-xs text-subtle">{c.image}</div>
                        </div>
                        <span className="hidden text-xs text-muted sm:inline">{c.status}</span>
                        <span className="inline-flex gap-0.5">
                          <ActionButton icon="file-text" label={`Logs for ${c.name}`} disabled={!live} onClick={() => action("container.logs", { container: c.name, lines: 200 })} />
                          <ActionButton icon="refresh" label={`Restart ${c.name}`} disabled={!live} onClick={() => action("container.restart", { container: c.name })} />
                          {c.state === "running" ? (
                            <ActionButton
                              icon="stop"
                              label={`Stop ${c.name}`}
                              disabled={!live}
                              onClick={() => setPendingStop({ type: "container.stop", payload: { container: c.name }, name: c.name })}
                            />
                          ) : (
                            <ActionButton icon="play" label={`Start ${c.name}`} disabled={!live} onClick={() => action("container.start", { container: c.name })} />
                          )}
                        </span>
                      </div>
                    ))
                  )}
                </Card>
              </section>
              <section>
                <SectionTitle>Runtimes detected</SectionTitle>
                <Card className="overflow-hidden">
                  {runtimes.length === 0 ? (
                    <p className="p-4 text-sm text-muted">Nothing detected yet.</p>
                  ) : (
                    runtimes.map(([name, version]) => (
                      <div key={name} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                        <Icon name="box" className="text-subtle" />
                        <span className="text-sm capitalize">{name}</span>
                        <Mono className="ml-auto truncate text-muted">{version ?? "installed"}</Mono>
                      </div>
                    ))
                  )}
                </Card>
              </section>
            </div>

            <UpdatesSection
              name={s.name}
              updates={s.inventory.updates ?? undefined}
              live={s.status === "online"}
              busy={run.isPending || (jobs.data ?? []).some((j) => j.type === "os.upgrade" && isActive(j.status))}
              action={action}
            />

            <section>
              <SectionTitle>Recent activity</SectionTitle>
              <Card className="overflow-hidden">
                {run.error && <p className="border-b border-line px-4 py-3 text-sm text-err">{run.error.message}</p>}
                {(jobs.data ?? []).length === 0 ? (
                  <p className="p-4 text-sm text-muted">Actions you run on this server show up here, with their output.</p>
                ) : (
                  jobs.data!.map((j) => (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => setOpenJob(j.id)}
                      className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-white/[0.02]"
                    >
                      <Dot tone={jobTone[j.status]} pulse={isActive(j.status)} />
                      <span className="min-w-0 flex-1 truncate text-sm">{jobTitle(j)}</span>
                      <span className="text-xs text-muted capitalize">{j.status}</span>
                      <span className="w-20 text-right text-xs text-subtle">{timeAgo(j.created_at)}</span>
                      <Icon name="chevron-right" size={14} className="text-subtle" />
                    </button>
                  ))
                )}
              </Card>
            </section>

            <FormCard
              title="Agent identity"
              description="The agent authenticates with a per-agent credential issued at enrollment and stored only as a hash here. It connects out over HTTPS; no inbound port is open."
              footer={`Enrolled ${formatDate(s.enrolled_at)}`}
            >
              <InfoGrid
                className="lg:grid-cols-3"
                items={[
                  { label: "Server ID", value: <Mono>{s.id}</Mono> },
                  { label: "Capabilities", value: Object.entries(s.capabilities).filter(([, v]) => v).map(([k]) => k).join(", ") || "—" },
                  { label: "Credential issued", value: formatDate(s.agent_token_rotated_at) },
                ]}
              />
            </FormCard>
          </>
        )}
      </Container>

      <JobPanel jobId={openJob} onClose={() => setOpenJob(null)} />
      <ConfirmDialog
        open={!!pendingStop}
        onClose={() => setPendingStop(null)}
        onConfirm={() => {
          if (pendingStop) action(pendingStop.type, pendingStop.payload);
          setPendingStop(null);
        }}
        title={pendingStop?.type === "container.stop" ? "Stop container" : "Stop service"}
        confirmText={pendingStop?.name ?? ""}
        action="Stop"
      >
        <span className="text-fg">{pendingStop?.name}</span> on <span className="text-fg">{s.name}</span> stops until you start it again.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === "revoke"}
        onClose={() => setConfirm(null)}
        onConfirm={() => revoke.mutate(s.id, { onSettled: () => setConfirm(null) })}
        title="Revoke agent"
        confirmText={s.name}
        action="Revoke"
      >
        The agent on <span className="text-fg">{s.name}</span> loses its credential immediately and stops. Apps on the server keep running.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        onConfirm={() => remove.mutate(s.id, { onSuccess: () => router.replace("/dashboard/servers") })}
        title="Remove server"
        confirmText={s.name}
        action="Remove"
      >
        Deletes <span className="text-fg">{s.name}</span> and its metrics history from VPSPilot. Nothing on the server itself is changed.
      </ConfirmDialog>
    </>
  );
}
