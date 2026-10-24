"use client";

import { useState } from "react";
import { AreaChart } from "@/components/charts";
import { ChartCard } from "@/components/dashboard/detail";
import { FilterTabs } from "@/components/dashboard/filter-tabs";
import { Card, SectionTitle } from "@/components/ui";
import { type TrafficRange, useAppUsage } from "@/lib/api/apps";
import { formatBytes } from "@/lib/format";

/** CPU and memory of the app's container(s) or service. */
export function UsageSection({ appId }: { appId: string }) {
  const [range, setRange] = useState<TrafficRange>("24h");
  const usage = useAppUsage(appId, range);
  const data = usage.data;
  const points = data?.points ?? [];
  const labels = points.map((p) =>
    range === "7d"
      ? new Date(p.ts).toLocaleDateString(undefined, { weekday: "short", hour: "2-digit" })
      : new Date(p.ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  );

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
        Resources
      </SectionTitle>
      {usage.isLoading ? (
        <div className="skeleton h-48 rounded-xl" />
      ) : data?.memory_bytes == null ? (
        <Card className="p-5 text-sm text-muted">No usage reported yet. The server&apos;s agent sends CPU and memory once a minute (agent 1.1.5 or later).</Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="CPU" value={`${(data.cpu_percent ?? 0).toFixed(1)}%`} sub="100% is one full core">
            <AreaChart series={[{ name: "CPU", data: points.map((p) => p.cpu_percent ?? 0), color: "blue" }]} labels={labels} unit="%" height={140} />
          </ChartCard>
          <ChartCard
            title="Memory"
            value={formatBytes(data.memory_bytes)}
            sub={`peak ${formatBytes(data.peak_memory_bytes)}${data.memory_limit ? ` · limit ${data.memory_limit}` : " · no limit set"}`}
          >
            <AreaChart
              series={[{ name: "Memory", data: points.map((p) => Math.round((p.memory_bytes ?? 0) / 1048576)), color: "violet" }]}
              labels={labels}
              unit=" MB"
              height={140}
            />
          </ChartCard>
        </div>
      )}
    </section>
  );
}
