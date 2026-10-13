import type { Metadata } from "next";
import { AreaChart, Legend } from "@/components/charts";
import { ChartCard, RangeTabs } from "@/components/dashboard/detail";
import { Icon } from "@/components/icons";
import { Badge, Button, Card, Container, Dot, PageHeader, SectionTitle, Table, Td, Th } from "@/components/ui";
import { alertRules, alerts, serverHistory, timeLabels } from "@/lib/data";

export const metadata: Metadata = { title: "Monitoring" };

const sevTone = { critical: "err", warning: "warn", info: "blue" } as const;
const stateTone = { firing: "err", acknowledged: "warn", resolved: "ok" } as const;

export default function MonitoringPage() {
  const a = serverHistory("web-prod-01");
  const b = serverHistory("web-prod-02");
  const c = serverHistory("db-primary");
  const d = serverHistory("pilot-control");

  return (
    <>
      <PageHeader
        title="Monitoring"
        description="Fleet metrics, active incidents and the rules that raise them."
        actions={
          <Button variant="secondary" size="md" icon="bell">
            Notification Channels
          </Button>
        }
      />
      <Container className="space-y-8">
        <section>
          <SectionTitle action={<RangeTabs />}>Fleet</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="CPU by server"
              right={
                <Legend
                  items={[
                    { name: "web-prod-01", color: "blue" },
                    { name: "web-prod-02", color: "teal" },
                    { name: "db-primary", color: "violet" },
                    { name: "pilot-control", color: "gray" },
                  ]}
                />
              }
            >
              <AreaChart
                series={[
                  { name: "web-prod-01", data: a.cpu, color: "blue" },
                  { name: "web-prod-02", data: b.cpu, color: "teal" },
                  { name: "db-primary", data: c.cpu, color: "violet" },
                  { name: "pilot-control", data: d.cpu, color: "gray" },
                ]}
                labels={timeLabels}
                height={180}
              />
            </ChartCard>
            <ChartCard
              title="Memory by server"
              right={
                <Legend
                  items={[
                    { name: "db-primary", color: "err" },
                    { name: "web-prod-01", color: "blue" },
                    { name: "web-prod-02", color: "teal" },
                  ]}
                />
              }
            >
              <AreaChart
                series={[
                  { name: "db-primary", data: c.memory, color: "err" },
                  { name: "web-prod-01", data: a.memory, color: "blue" },
                  { name: "web-prod-02", data: b.memory, color: "teal" },
                ]}
                labels={timeLabels}
                height={180}
              />
            </ChartCard>
          </div>
        </section>

        <section>
          <SectionTitle
            action={
              <span className="flex gap-2">
                <Badge tone="err">{alerts.filter((x) => x.state === "firing").length} firing</Badge>
                <Badge tone="warn">{alerts.filter((x) => x.state === "acknowledged").length} acknowledged</Badge>
              </span>
            }
          >
            Incidents
          </SectionTitle>
          <Card className="overflow-hidden">
            {alerts.map((x) => (
              <div key={x.id} className="flex flex-col gap-3 border-b border-line px-4 py-3.5 last:border-0 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Icon
                    name={x.state === "resolved" ? "check-circle" : "alert"}
                    className={`mt-0.5 shrink-0 ${x.state === "resolved" ? "text-ok" : x.severity === "critical" ? "text-err" : "text-warn"}`}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm ${x.state === "resolved" ? "text-muted" : ""}`}>{x.title}</span>
                      <Badge tone={sevTone[x.severity]}>{x.severity}</Badge>
                    </div>
                    <div className="text-xs text-subtle">
                      {x.target} · {x.rule}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-7 sm:pl-0">
                  <span className="flex items-center gap-1.5 text-xs text-muted capitalize">
                    <Dot tone={stateTone[x.state]} pulse={x.state === "firing"} /> {x.state} · {x.since}
                  </span>
                  {x.state === "firing" && (
                    <Button variant="secondary" size="xs">
                      Acknowledge
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </section>

        <section>
          <SectionTitle
            action={
              <Button variant="secondary" size="xs" icon="plus">
                New Rule
              </Button>
            }
          >
            Alert Rules
          </SectionTitle>
          <Table>
            <thead>
              <tr>
                <Th>Rule</Th>
                <Th>Condition</Th>
                <Th>Scope</Th>
                <Th>Channels</Th>
                <Th className="w-24">Enabled</Th>
              </tr>
            </thead>
            <tbody>
              {alertRules.map((r) => (
                <tr key={r.name} className="hover:bg-white/[0.02]">
                  <Td className="font-medium">{r.name}</Td>
                  <Td className="text-muted">{r.condition}</Td>
                  <Td className="text-muted">{r.scope}</Td>
                  <Td className="text-muted">{r.channel}</Td>
                  <Td>
                    <span role="switch" aria-checked={r.enabled} aria-label={`${r.name} enabled`} className={`flex h-5 w-9 items-center rounded-full p-0.5 ${r.enabled ? "bg-blue" : "bg-white/15"}`}>
                      <span className={`size-4 rounded-full bg-white transition-transform ${r.enabled ? "translate-x-4" : ""}`} />
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="mt-2 text-xs text-subtle">Alerts are deduplicated per target and rule. Metric retention: 1-minute samples for 7 days, 1-hour rollups for 90 days.</p>
        </section>
      </Container>
    </>
  );
}
