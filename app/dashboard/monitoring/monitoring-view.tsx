"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AreaChart, Legend, type ChartColor } from "@/components/charts";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ChartCard } from "@/components/dashboard/detail";
import { FilterTabs } from "@/components/dashboard/filter-tabs";
import { Icon } from "@/components/icons";
import { Badge, Button, ButtonLink, Card, Container, Dot, EmptyState, Input, Label, Meter, PageHeader, SectionTitle, Select, type Tone } from "@/components/ui";
import {
  type Alert,
  type AlertRule,
  type Fleet,
  KIND_INFO,
  type RuleKind,
  type Severity,
  useAcknowledge,
  useAlertRules,
  useAlerts,
  useCreateRule,
  useDeleteRule,
  useEvaluateNow,
  useFleet,
  useUpdateRule,
} from "@/lib/api/monitoring";
import { type MetricsRange, useServers } from "@/lib/api/servers";
import { formatDuration, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const COLORS: ChartColor[] = ["blue", "teal", "violet", "warn", "ok", "gray", "err"];
const SPAN_MS: Record<MetricsRange, number> = { "1h": 3_600_000, "24h": 86_400_000, "7d": 604_800_000 };
const BUCKETS = 60;
const sevTone: Record<Severity, Tone> = { critical: "err", warning: "warn", info: "blue" };

/** Put every server on the same time axis; gaps carry the last value. */
function align(fleet: Fleet | undefined, range: MetricsRange, field: "cpu_percent" | "memory_percent" | "disk_percent") {
  const now = Date.now();
  const span = SPAN_MS[range];
  const start = now - span;
  const labels = Array.from({ length: BUCKETS }, (_, i) => {
    const t = new Date(start + ((i + 1) * span) / BUCKETS);
    return range === "7d" ? t.toLocaleDateString(undefined, { weekday: "short", hour: "2-digit" }) : t.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  });
  const series = (fleet?.servers ?? [])
    .filter((s) => s.points.length)
    .map((s, i) => {
      const data: (number | null)[] = Array(BUCKETS).fill(null);
      for (const p of s.points) {
        const index = Math.min(BUCKETS - 1, Math.max(0, Math.floor(((new Date(p.ts).getTime() - start) / span) * BUCKETS)));
        data[index] = p[field];
      }
      let last = data.find((v) => v !== null) ?? 0;
      const filled = data.map((v) => (v === null ? last : (last = v)));
      return { name: s.name, data: filled, color: COLORS[i % COLORS.length] };
    });
  return { labels, series };
}

export function MonitoringView() {
  const [range, setRange] = useState<MetricsRange>("1h");
  const fleet = useFleet(range);
  const evaluate = useEvaluateNow();
  const [incidentTab, setIncidentTab] = useState<"open" | "resolved">("open");

  const cpu = useMemo(() => align(fleet.data, range, "cpu_percent"), [fleet.data, range]);
  const memory = useMemo(() => align(fleet.data, range, "memory_percent"), [fleet.data, range]);
  const disk = useMemo(() => align(fleet.data, range, "disk_percent"), [fleet.data, range]);
  const servers = fleet.data?.servers ?? [];
  const online = servers.filter((s) => s.status === "online").length;

  return (
    <>
      <PageHeader
        title="Monitoring"
        description="Fleet metrics, active incidents and the rules that raise them."
        actions={
          <>
            <ButtonLink href="/dashboard/settings#notifications" variant="secondary" size="md" icon="bell">
              Notifications
            </ButtonLink>
            <Button variant="secondary" size="md" icon="refresh" disabled={evaluate.isPending} onClick={() => evaluate.mutate()}>
              {evaluate.isPending ? "Checking…" : "Check now"}
            </Button>
          </>
        }
      />
      <Container className="space-y-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon="server" label="Servers online" value={fleet.data ? `${online} / ${servers.length}` : "–"} tone={online < servers.length ? "warn" : "ok"} />
          <StatCard icon="alert" label="Firing" value={fleet.data?.firing ?? "–"} tone={fleet.data?.firing ? "err" : "ok"} />
          <StatCard icon="eye" label="Acknowledged" value={fleet.data?.acknowledged ?? "–"} tone={fleet.data?.acknowledged ? "warn" : "neutral"} />
          <StatCard icon="activity" label="Evaluated" value="every 30s" tone="neutral" />
        </div>

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
                ]}
              />
            }
          >
            Fleet
          </SectionTitle>
          {fleet.isLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="skeleton h-64 rounded-xl" />
              <div className="skeleton h-64 rounded-xl" />
            </div>
          ) : servers.length === 0 ? (
            <EmptyState
              icon="server"
              title="No servers yet"
              action={
                <ButtonLink href="/dashboard/servers/new" variant="primary" size="md" icon="plus">
                  Enroll a server
                </ButtonLink>
              }
            >
              Metrics appear here as soon as an agent reports in.
            </EmptyState>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <FleetChart title="CPU" data={cpu} />
              <FleetChart title="Memory" data={memory} />
              <FleetChart title="Disk" data={disk} />
              <ServerHealth fleet={fleet.data!} />
            </div>
          )}
        </section>

        <section>
          <SectionTitle
            action={
              <FilterTabs<"open" | "resolved">
                value={incidentTab}
                onChange={setIncidentTab}
                options={[
                  { value: "open", label: "Open" },
                  { value: "resolved", label: "Resolved" },
                ]}
              />
            }
          >
            Incidents
          </SectionTitle>
          <Incidents state={incidentTab} />
        </section>

        <Rules />
      </Container>
    </>
  );
}

function StatCard({ icon, label, value, tone }: { icon: "server" | "alert" | "eye" | "activity"; label: string; value: React.ReactNode; tone: Tone }) {
  return (
    <Card className="relative overflow-hidden p-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Dot tone={tone} /> {label}
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
      <Icon name={icon} size={56} strokeWidth={1} className="pointer-events-none absolute -right-2 -bottom-3 text-white/[0.05]" />
    </Card>
  );
}

function FleetChart({ title, data }: { title: string; data: ReturnType<typeof align> }) {
  const latest = data.series.map((s) => s.data.at(-1) ?? 0);
  const peak = latest.length ? Math.max(...latest) : 0;
  return (
    <ChartCard
      title={`${title} by server`}
      value={data.series.length ? `${peak.toFixed(0)}%` : "–"}
      sub="highest right now"
      right={<Legend items={data.series.map((s) => ({ name: s.name, color: s.color }))} />}
    >
      {data.series.length ? (
        <AreaChart series={data.series} labels={data.labels} height={170} max={100} />
      ) : (
        <p className="py-10 text-center text-sm text-subtle">No samples in this range.</p>
      )}
    </ChartCard>
  );
}

function ServerHealth({ fleet }: { fleet: Fleet }) {
  const tone = (v: number) => (v >= 90 ? "err" : v >= 75 ? "warn" : "ok");
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line px-4 py-3 text-sm font-medium">Right now</div>
      <div className="divide-y divide-line">
        {fleet.servers.map((s) => {
          const p = s.points.at(-1);
          return (
            <Link key={s.id} href={`/dashboard/servers/${s.id}`} className="grid grid-cols-[minmax(0,1fr)_repeat(3,64px)] items-center gap-3 px-4 py-2.5 text-xs hover:bg-white/[0.02] sm:grid-cols-[minmax(0,1fr)_repeat(3,96px)]">
              <span className="flex min-w-0 items-center gap-2 text-[13px]">
                <Dot tone={s.status === "online" ? "ok" : "err"} pulse={s.status === "online"} />
                <span className="truncate">{s.name}</span>
              </span>
              {(["cpu_percent", "memory_percent", "disk_percent"] as const).map((f) => (
                <span key={f} className="space-y-1">
                  <span className="flex justify-between text-subtle">
                    <span className="hidden sm:inline">{f === "cpu_percent" ? "CPU" : f === "memory_percent" ? "Mem" : "Disk"}</span>
                    <span className="tabular-nums text-muted">{p ? `${p[f].toFixed(0)}%` : "–"}</span>
                  </span>
                  <Meter value={p ? p[f] : 0} tone={p ? tone(p[f]) : "neutral"} />
                </span>
              ))}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

function targetHref(a: Alert) {
  return a.target_type === "server" ? `/dashboard/servers/${a.target_id}` : `/dashboard/applications/${a.target_id}`;
}

function Incidents({ state }: { state: "open" | "resolved" }) {
  const alerts = useAlerts(state);
  const ack = useAcknowledge();
  if (alerts.isLoading) return <div className="skeleton h-32 rounded-xl" />;
  if (!alerts.data?.length) {
    return (
      <Card className="flex items-center gap-3 p-5 text-sm text-muted">
        <Icon name="check-circle" className="text-ok" />
        {state === "open" ? "All clear. Nothing is firing." : "No resolved incidents yet."}
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      {alerts.data.map((a) => (
        <div key={a.id} className="flex flex-col gap-3 border-b border-line px-4 py-3.5 last:border-0 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Icon
              name={a.state === "resolved" ? "check-circle" : "alert"}
              className={cn("mt-0.5 shrink-0", a.state === "resolved" ? "text-ok" : a.severity === "critical" ? "text-err" : "text-warn")}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("text-sm", a.state === "resolved" && "text-muted")}>{a.title}</span>
                <Badge tone={sevTone[a.severity]}>{a.severity}</Badge>
                <Link href={targetHref(a)} className="text-xs text-muted hover:text-fg hover:underline">
                  {a.target_label}
                </Link>
              </div>
              {a.detail && <div className="truncate text-xs text-subtle">{a.detail}</div>}
              {a.acknowledged_by && a.state !== "resolved" && <div className="text-xs text-subtle">Acknowledged by {a.acknowledged_by}</div>}
            </div>
          </div>
          <div className="flex items-center gap-3 pl-7 sm:pl-0">
            <span className="flex items-center gap-1.5 text-xs whitespace-nowrap text-muted">
              <Dot tone={a.state === "firing" ? "err" : a.state === "acknowledged" ? "warn" : "ok"} pulse={a.state === "firing"} />
              {a.state === "resolved"
                ? `Resolved ${timeAgo(a.resolved_at)} · lasted ${formatDuration(a.fired_at ?? a.started_at, a.resolved_at)}`
                : `${a.state === "firing" ? "Firing" : "Acknowledged"} for ${formatDuration(a.fired_at ?? a.started_at)}`}
            </span>
            {a.state === "firing" && (
              <Button variant="secondary" size="xs" disabled={ack.isPending} onClick={() => ack.mutate(a.id)}>
                Acknowledge
              </Button>
            )}
          </div>
        </div>
      ))}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

function Switch({ on, label, onChange, disabled }: { on: boolean; label: string; onChange: (on: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cn("relative h-5 w-9 shrink-0 rounded-full border transition-colors disabled:opacity-50", on ? "border-accent/70 bg-accent" : "border-line-strong bg-bg-200")}
    >
      <span className={cn("absolute top-px size-4 rounded-full bg-white shadow transition-[left]", on ? "left-[17px]" : "left-px")} />
    </button>
  );
}

function Rules() {
  const rules = useAlertRules();
  const update = useUpdateRule();
  const remove = useDeleteRule();
  const { data: servers } = useServers();
  const [editing, setEditing] = useState<AlertRule | "new" | null>(null);
  const [deleting, setDeleting] = useState<AlertRule | null>(null);
  const serverName = (id: string | null) => servers?.find((s) => s.id === id)?.name ?? "one server";

  return (
    <section>
      <SectionTitle
        action={
          <Button variant="secondary" size="xs" icon="plus" onClick={() => setEditing("new")}>
            New Rule
          </Button>
        }
      >
        Alert Rules
      </SectionTitle>
      {update.error && <p className="mb-2 text-sm text-err">{update.error.message}</p>}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-subtle">
              <th className="px-4 py-2.5 font-normal">Rule</th>
              <th className="px-4 py-2.5 font-normal">Condition</th>
              <th className="px-4 py-2.5 font-normal">Scope</th>
              <th className="px-4 py-2.5 font-normal">Severity</th>
              <th className="px-4 py-2.5 font-normal">Email</th>
              <th className="px-4 py-2.5 font-normal">Enabled</th>
              <th className="w-20 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {(rules.data ?? []).map((r) => (
              <tr key={r.id} className={cn("border-b border-line last:border-0 hover:bg-white/[0.02]", !r.enabled && "text-muted")}>
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-muted">{KIND_INFO[r.kind].describe(r)}</td>
                <td className="px-4 py-3 text-muted">{r.target === "application" ? "All applications" : r.server_id ? serverName(r.server_id) : "All servers"}</td>
                <td className="px-4 py-3">
                  <Badge tone={sevTone[r.severity]}>{r.severity}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Switch on={r.notify_email} label={`Email for ${r.name}`} onChange={(on) => update.mutate({ id: r.id, notify_email: on })} />
                </td>
                <td className="px-4 py-3">
                  <Switch on={r.enabled} label={`${r.name} enabled`} onChange={(on) => update.mutate({ id: r.id, enabled: on })} />
                </td>
                <td className="px-4 py-3">
                  <span className="flex justify-end gap-1">
                    <button type="button" aria-label={`Edit ${r.name}`} onClick={() => setEditing(r)} className="rounded p-1.5 text-subtle hover:bg-white/10 hover:text-fg">
                      <Icon name="settings" size={14} />
                    </button>
                    <button type="button" aria-label={`Delete ${r.name}`} onClick={() => setDeleting(r)} className="rounded p-1.5 text-subtle hover:bg-white/10 hover:text-err">
                      <Icon name="trash" size={14} />
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-2 text-xs text-subtle">
        Rules are checked every 30 seconds. Metric rules use the average over their window, so short spikes don&apos;t alert, and resolve 3 points below the limit so
        values at the edge don&apos;t flap. One incident per rule and target.
      </p>
      {editing && <RuleDialog rule={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete rule"
        confirmText={deleting?.name ?? ""}
        action="Delete"
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      >
        Its open incidents close. You can disable a rule instead to keep it for later.
      </ConfirmDialog>
    </section>
  );
}

function RuleDialog({ rule, onClose }: { rule: AlertRule | null; onClose: () => void }) {
  const create = useCreateRule();
  const update = useUpdateRule();
  const { data: servers } = useServers();
  const [kind, setKind] = useState<RuleKind>(rule?.kind ?? "cpu_high");
  const [name, setName] = useState(rule?.name ?? "");
  const [threshold, setThreshold] = useState(String(rule?.threshold ?? 85));
  const [duration, setDuration] = useState(String(rule?.duration_minutes ?? 10));
  const [severity, setSeverity] = useState<Severity>(rule?.severity ?? "warning");
  const [serverId, setServerId] = useState(rule?.server_id ?? "");
  const metric = !["agent_offline", "app_down"].includes(kind);
  const error = create.error ?? update.error;
  const busy = create.isPending || update.isPending;

  const save = () => {
    const common = {
      name: name.trim() || KIND_INFO[kind].label,
      duration_minutes: Number(duration),
      severity,
      ...(metric ? { threshold: Number(threshold) } : {}),
    };
    if (rule) update.mutate({ id: rule.id, ...common }, { onSuccess: onClose });
    else create.mutate({ kind, ...common, server_id: kind !== "app_down" && serverId ? serverId : null }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={rule ? "Edit rule" : "New rule"}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] animate-fade-up overflow-hidden rounded-t-xl border border-line-strong bg-bg-100 shadow-2xl sm:rounded-xl"
      >
        <div className="space-y-4 p-6">
          <h2 className="text-xl font-semibold tracking-tight">{rule ? "Edit rule" : "New alert rule"}</h2>
          {!rule && (
            <div>
              <Label htmlFor="rk">Watch</Label>
              <Select id="rk" value={kind} onChange={(e) => setKind(e.target.value as RuleKind)}>
                {(Object.keys(KIND_INFO) as RuleKind[]).map((k) => (
                  <option key={k} value={k}>
                    {KIND_INFO[k].label}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="rn">Name</Label>
            <Input id="rn" placeholder={KIND_INFO[kind].label} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {metric && (
              <div>
                <Label htmlFor="rt" hint="%">
                  Above
                </Label>
                <Input id="rt" inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value.replace(/[^\d.]/g, ""))} />
              </div>
            )}
            <div className={metric ? "" : "col-span-2"}>
              <Label htmlFor="rd" hint="minutes">
                For at least
              </Label>
              <Input id="rd" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rs">Severity</Label>
              <Select id="rs" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </Select>
            </div>
            {!rule && kind !== "app_down" && (
              <div>
                <Label htmlFor="rsv">Servers</Label>
                <Select id="rsv" value={serverId} onChange={(e) => setServerId(e.target.value)}>
                  <option value="">All servers</option>
                  {servers
                    ?.filter((s) => s.enrolled_at && s.status !== "revoked")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </Select>
              </div>
            )}
          </div>
          <p className="text-xs text-subtle">{KIND_INFO[kind].describe({ threshold: Number(threshold) || 0, duration_minutes: Number(duration) || 0 })}</p>
          {error && <p className="text-sm text-err">{error.message}</p>}
        </div>
        <div className="flex justify-between gap-2 border-t border-line bg-bg-200 px-6 py-4">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" disabled={busy || !Number(duration) || (metric && !Number(threshold))} onClick={save}>
            {rule ? "Save" : "Create rule"}
          </Button>
        </div>
      </div>
    </div>
  );
}
