"use client";

import { useState } from "react";
import { DeploymentRow } from "@/components/dashboard/cards";
import { FilterTabs } from "@/components/dashboard/filter-tabs";
import { Card, Container, EmptyState, SearchBar, Select } from "@/components/ui";
import { apps, deployments, type DeployStatus } from "@/lib/data";

type Env = "all" | "Production" | "Staging";

export function DeploymentList() {
  const [env, setEnv] = useState<Env>("all");
  const [app, setApp] = useState("all");
  const [status, setStatus] = useState<"all" | DeployStatus>("all");
  const [q, setQ] = useState("");

  const list = deployments.filter(
    (d) =>
      (env === "all" || d.env === env) &&
      (app === "all" || d.appId === app) &&
      (status === "all" || d.status === status) &&
      `${d.id} ${d.branch} ${d.commit} ${d.message}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <Container>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchBar placeholder="Search deployments by ID, branch or commit…" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
        <div className="flex flex-wrap gap-2">
          <FilterTabs<Env>
            value={env}
            onChange={setEnv}
            options={[
              { value: "all", label: "All Environments" },
              { value: "Production", label: "Production" },
              { value: "Staging", label: "Staging" },
            ]}
          />
          <Select value={app} onChange={(e) => setApp(e.target.value)} className="w-40" aria-label="Application">
            <option value="all">All Apps</option>
            {apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as "all" | DeployStatus)} className="w-36" aria-label="Status">
            <option value="all">Status</option>
            <option value="ready">Ready</option>
            <option value="building">Building</option>
            <option value="error">Error</option>
            <option value="canceled">Canceled</option>
            <option value="rolled-back">Rolled back</option>
          </Select>
        </div>
      </div>
      <div className="mt-6">
        {list.length ? (
          <Card className="overflow-hidden">
            {list.map((d) => (
              <DeploymentRow key={d.id} d={d} />
            ))}
          </Card>
        ) : (
          <EmptyState icon="rocket" title="No deployments found">
            Nothing matches the current filters.
          </EmptyState>
        )}
      </div>
    </Container>
  );
}
