"use client";

import { useState } from "react";
import { DeploymentRow } from "@/components/apps/app-ui";
import { LoadMore } from "@/components/dashboard/load-more";
import { Card, Container, EmptyState, SearchBar, Select } from "@/components/ui";
import { type DeploymentStatus, useApps, useDeploymentPages } from "@/lib/api/apps";
import { useServers } from "@/lib/api/servers";

export function DeploymentList() {
  const { data: apps } = useApps();
  const { data: servers } = useServers();
  const [app, setApp] = useState("all");
  const [status, setStatus] = useState<"all" | DeploymentStatus>("all");
  const [q, setQ] = useState("");
  const pages = useDeploymentPages(app === "all" ? null : app);
  const loaded = pages.data?.pages.flat() ?? [];

  const serverName = (id: string) => servers?.find((s) => s.id === id)?.name;
  const list = loaded.filter(
    (d) =>
      (status === "all" || d.status === status) &&
      `${d.id} ${d.app_name} ${d.requested_ref} ${d.commit_sha} ${d.commit_message} ${d.image_ref}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <Container>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchBar placeholder="Search by ID, branch, commit or image…" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
        <div className="flex flex-wrap gap-2">
          <Select value={app} onChange={(e) => setApp(e.target.value)} className="w-44" aria-label="Application">
            <option value="all">All Apps</option>
            {apps?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as "all" | DeploymentStatus)} className="w-36" aria-label="Status">
            <option value="all">Any status</option>
            <option value="succeeded">Ready</option>
            <option value="running">Building</option>
            <option value="queued">Queued</option>
            <option value="failed">Error</option>
            <option value="canceled">Canceled</option>
          </Select>
        </div>
      </div>
      <div className="mt-6">
        {pages.isLoading ? (
          <div className="skeleton h-64 rounded-xl" />
        ) : list.length ? (
          <Card className="overflow-hidden">
            {list.map((d) => (
              <DeploymentRow key={d.id} d={d} serverName={serverName(d.server_id)} />
            ))}
          </Card>
        ) : (
          <EmptyState icon="rocket" title={loaded.length ? "No deployments found" : "No deployments yet"}>
            {loaded.length ? "Nothing matches the current filters." : "Deployments appear here when you create or redeploy an application."}
          </EmptyState>
        )}
        {loaded.length > 0 && (
          <LoadMore hasMore={!!pages.hasNextPage} loading={pages.isFetchingNextPage} onLoad={() => pages.fetchNextPage()} label="deployments" />
        )}
      </div>
    </Container>
  );
}
