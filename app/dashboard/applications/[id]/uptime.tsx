"use client";

import { useState } from "react";
import { AreaChart } from "@/components/charts";
import { ChartCard } from "@/components/dashboard/detail";
import { FilterTabs } from "@/components/dashboard/filter-tabs";
import { Card, Mono, SectionTitle, Select } from "@/components/ui";
import { type Domain, type UptimeRange, useUptime } from "@/lib/api/domains";
import { timeAgo } from "@/lib/format";

/** Availability and response time of the app's domains, checked every minute. */
export function UptimeSection({ domains }: { domains: Domain[] }) {
  const watched = domains.filter((d) => !d.redirect_to && d.status === "active");
  const [range, setRange] = useState<UptimeRange>("24h");
  const [picked, setPicked] = useState<string | null>(null);
  const domain = watched.find((d) => d.id === picked) ?? watched[0];
  const uptime = useUptime(domain?.id, range);
  if (!domain) return null;
  const data = uptime.data;
  const points = data?.points ?? [];
  const labels = points.map((p) =>
    range === "24h"
      ? new Date(p.t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      : new Date(p.t).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  );

  return (
    <section>
      <SectionTitle
        action={
          <div className="flex items-center gap-2">
            {watched.length > 1 && (
              <Select aria-label="Domain" className="w-48" value={domain.id} onChange={(e) => setPicked(e.target.value)}>
                {watched.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.hostname}
                  </option>
                ))}
              </Select>
            )}
            <FilterTabs<UptimeRange>
              value={range}
              onChange={setRange}
              options={[
                { value: "24h", label: "24h" },
                { value: "7d", label: "7d" },
                { value: "30d", label: "30d" },
              ]}
            />
          </div>
        }
      >
        Uptime
      </SectionTitle>
      {uptime.isLoading ? (
        <div className="skeleton h-48 rounded-xl" />
      ) : !data?.checks ? (
        <Card className="p-5 text-sm text-muted">
          No checks yet. VPSPilot requests <Mono>{data?.url ?? domain.hostname}</Mono> every minute and alerts you (Site down) when it stops answering.
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Availability" value={data.uptime != null ? `${data.uptime}%` : "—"} sub={`${data.checks.toLocaleString()} checks of ${data.url}`}>
            <AreaChart series={[{ name: "Uptime", data: points.map((p) => p.uptime ?? 0), color: "ok" }]} labels={labels} unit="%" height={140} />
          </ChartCard>
          <ChartCard
            title="Response time"
            value={domain.uptime?.ms != null ? `${Math.round(domain.uptime.ms)} ms` : "—"}
            sub={
              data.recent_failures.length
                ? `Last failure ${timeAgo(data.recent_failures[0].ts)}: ${data.recent_failures[0].error ?? `HTTP ${data.recent_failures[0].status}`}`
                : "No failures in this period"
            }
          >
            <AreaChart series={[{ name: "Response", data: points.map((p) => p.ms ?? 0), color: "violet" }]} labels={labels} unit="ms" height={140} />
          </ChartCard>
        </div>
      )}
    </section>
  );
}
