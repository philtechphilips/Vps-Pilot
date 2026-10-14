"use client";

import Link from "next/link";
import { useState } from "react";
import { AreaChart } from "@/components/charts";
import { ChartCard } from "@/components/dashboard/detail";
import { FilterTabs } from "@/components/dashboard/filter-tabs";
import { Card, SectionTitle } from "@/components/ui";
import { type TrafficRange, useAppTraffic } from "@/lib/api/apps";
import { formatBytes } from "@/lib/format";

export function TrafficSection({ appId }: { appId: string }) {
  const [range, setRange] = useState<TrafficRange>("24h");
  const traffic = useAppTraffic(appId, range);
  const data = traffic.data;
  const points = data?.points ?? [];
  const labels = points.map((p) =>
    range === "7d"
      ? new Date(p.ts).toLocaleDateString(undefined, { weekday: "short", hour: "2-digit" })
      : new Date(p.ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  );
  const totals = data?.totals;

  return (
    <section>
      <SectionTitle
        action={
          <FilterTabs<TrafficRange>
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
        Traffic
      </SectionTitle>
      {traffic.isLoading ? (
        <div className="skeleton h-48 rounded-xl" />
      ) : !totals?.requests ? (
        <Card className="p-5 text-sm text-muted">
          No requests recorded {range === "1h" ? "in the last hour" : range === "24h" ? "today" : "this week"}. Traffic is counted for requests through the app&apos;s{" "}
          <Link href="/dashboard/domains" className="text-fg underline underline-offset-2">
            domains
          </Link>{" "}
          (from the proxy&apos;s access log), not its direct port.
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Requests"
            value={totals.requests.toLocaleString()}
            sub={`${totals.per_minute}/min · ${formatBytes(totals.bytes)} sent · ${(data?.hosts ?? []).join(", ")}`}
          >
            <AreaChart
              series={[
                { name: "Requests", data: points.map((p) => p.requests), color: "blue" },
                { name: "5xx", data: points.map((p) => p.s5xx), color: "err" },
              ]}
              labels={labels}
              unit=""
              height={140}
            />
          </ChartCard>
          <ChartCard
            title="Latency (p95)"
            value={totals.p95_ms != null ? `${Math.round(totals.p95_ms)} ms` : "—"}
            sub={`${(totals.error_rate * 100).toFixed(2)}% server errors · ${totals.s4xx} client errors`}
          >
            <AreaChart series={[{ name: "p95", data: points.map((p) => Math.round(p.p95_ms)), color: "violet" }]} labels={labels} unit="ms" height={140} />
          </ChartCard>
        </div>
      )}
    </section>
  );
}
