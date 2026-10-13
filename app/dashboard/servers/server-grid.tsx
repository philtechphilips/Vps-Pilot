"use client";

import Link from "next/link";
import { useState } from "react";
import { ServerCard } from "@/components/dashboard/cards";
import { FilterTabs } from "@/components/dashboard/filter-tabs";
import { Icon } from "@/components/icons";
import { Container, Dot, EmptyState, Meter, Mono, SearchBar, Table, Td, Th } from "@/components/ui";
import { type ServerStatus, servers, serverTone } from "@/lib/data";
import { cn } from "@/lib/utils";

type Filter = "all" | ServerStatus;

export function ServerGrid() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const count = (s: ServerStatus) => servers.filter((x) => x.status === s).length;
  const list = servers.filter(
    (s) => (filter === "all" || s.status === filter) && `${s.name} ${s.ip} ${s.provider} ${s.region} ${s.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <Container>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchBar placeholder="Search servers by name, IP, provider or tag…" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
        <div className="flex items-center gap-2">
          <FilterTabs<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: servers.length },
              { value: "online", label: "Online", count: count("online") },
              { value: "degraded", label: "Degraded", count: count("degraded") },
              { value: "offline", label: "Offline", count: count("offline") },
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
          <EmptyState icon="server" title="No servers match">
            Try a different search or filter.
          </EmptyState>
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((s) => (
              <ServerCard key={s.id} s={s} />
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
                    <div className="font-mono text-xs text-subtle">{s.ip}</div>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-2 capitalize">
                      <Dot tone={serverTone[s.status]} />
                      {s.status}
                    </span>
                  </Td>
                  <Td className="text-muted">
                    {s.os} {s.osVersion}
                  </Td>
                  <Td className="text-muted">
                    {s.vcpu} vCPU · {s.memoryGb} GB
                  </Td>
                  <Td>
                    <Meter value={s.cpu} />
                  </Td>
                  <Td>
                    <Meter value={s.memory} />
                  </Td>
                  <Td>
                    <Mono className="text-muted">{s.agentVersion}</Mono>
                  </Td>
                  <Td className="text-muted">{s.heartbeat}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </Container>
  );
}
