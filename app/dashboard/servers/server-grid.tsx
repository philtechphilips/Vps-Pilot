"use client";

import Link from "next/link";
import { useState } from "react";
import { FilterTabs } from "@/components/dashboard/filter-tabs";
import { Icon } from "@/components/icons";
import { LiveServerCard, osLabel, StatusPill } from "@/components/servers/server-ui";
import { ButtonLink, Callout, Container, EmptyState, Meter, Mono, SearchBar, Table, Td, Th } from "@/components/ui";
import { type ServerStatus, useServers } from "@/lib/api/servers";
import { formatBytes, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type Filter = "all" | ServerStatus;

export function ServerGrid() {
  const servers = useServers();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const all = servers.data ?? [];
  const count = (s: ServerStatus) => all.filter((x) => x.status === s).length;
  const list = all.filter(
    (s) =>
      (filter === "all" || s.status === filter) &&
      `${s.name} ${s.hostname ?? ""} ${s.ip_addresses.join(" ")} ${s.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()),
  );

  if (servers.isLoading) {
    return (
      <Container>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-56 rounded-xl" />
          ))}
        </div>
      </Container>
    );
  }

  if (servers.error) {
    return (
      <Container>
        <Callout tone="err" icon="alert" title="Couldn't load servers">
          {servers.error.message}
        </Callout>
      </Container>
    );
  }

  if (all.length === 0) {
    return (
      <Container>
        <EmptyState
          icon="server"
          title="No servers yet"
          action={
            <ButtonLink href="/dashboard/servers/new" variant="primary" size="md" icon="plus">
              Enroll your first server
            </ButtonLink>
          }
        >
          Install the agent on any Ubuntu or Debian VPS with one command. It connects out to this control plane, so no inbound ports are needed.
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchBar placeholder="Search servers by name, IP, hostname or tag…" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
        <div className="flex items-center gap-2">
          <FilterTabs<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: all.length },
              { value: "online", label: "Online", count: count("online") },
              { value: "offline", label: "Offline", count: count("offline") },
              { value: "pending", label: "Pending", count: count("pending") },
            ]}
          />
          <div className="flex rounded-md border border-line bg-bg p-0.5">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-label={`${v} view`}
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cn("flex size-8 items-center justify-center rounded-[5px]", view === v ? "bg-bg-300 text-fg" : "text-subtle hover:text-fg")}
              >
                <Icon name={v} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {list.length === 0 ? (
          <EmptyState icon="search" title="No servers match">
            Try a different search or filter.
          </EmptyState>
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((s) => (
              <LiveServerCard key={s.id} server={s} />
            ))}
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>OS</Th>
                <Th>Resources</Th>
                <Th className="w-32">CPU</Th>
                <Th className="w-32">Memory</Th>
                <Th>Agent</Th>
                <Th>Heartbeat</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-white/[0.02]">
                  <Td>
                    <Link href={`/dashboard/servers/${s.id}`} className="font-medium hover:underline">
                      {s.name}
                    </Link>
                    <div className="font-mono text-xs text-subtle">{s.ip_addresses[0] ?? "—"}</div>
                  </Td>
                  <Td>
                    <StatusPill status={s.status} />
                  </Td>
                  <Td className="text-muted">{osLabel(s)}</Td>
                  <Td className="text-muted">{s.cpu_count ? `${s.cpu_count} vCPU · ${formatBytes(s.memory_total, 0)}` : "—"}</Td>
                  <Td>
                    <Meter value={s.status === "online" ? (s.latest?.cpu_percent ?? 0) : 0} />
                  </Td>
                  <Td>
                    <Meter value={s.status === "online" ? (s.latest?.memory_percent ?? 0) : 0} />
                  </Td>
                  <Td>
                    <Mono className="text-muted">{s.agent_version ?? "—"}</Mono>
                  </Td>
                  <Td className="text-muted">{timeAgo(s.last_heartbeat_at)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </Container>
  );
}
