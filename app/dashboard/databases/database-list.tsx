"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandChip } from "@/components/brand-chip";
import { Icon } from "@/components/icons";
import { Badge, ButtonLink, Card, Container, Dot, EmptyState, Mono, SearchBar, Table, Td, Th, type Tone } from "@/components/ui";
import { type DbStatus, ENGINE_BRAND, type Engine, useDatabases } from "@/lib/api/databases";
import { timeAgo } from "@/lib/format";

export const dbTone: Record<DbStatus, Tone> = { running: "ok", stopped: "neutral", creating: "warn", checking: "warn", removing: "warn", error: "err" };
export const dbLabel: Record<DbStatus, string> = { running: "Running", stopped: "Stopped", creating: "Creating", checking: "Connecting", removing: "Removing", error: "Error" };

const PLANNED = ["MongoDB", "SQLite", "SQL Server"] as const;

export function DatabaseList() {
  const { data, isLoading } = useDatabases();
  const [q, setQ] = useState("");
  const list = (data ?? []).filter((d) => `${d.name} ${d.engine_label} ${d.server_name}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Container className="space-y-6">
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-7">
        {(Object.keys(ENGINE_BRAND) as Engine[]).map((e) => {
          const n = (data ?? []).filter((d) => d.engine === e).length;
          return (
            <Card key={e} className="flex min-w-36 items-center gap-3 p-3">
              <BrandChip name={ENGINE_BRAND[e]} size={28} />
              <div className="min-w-0">
                <div className="truncate text-[13px]">{ENGINE_BRAND[e]}</div>
                <div className="text-xs text-subtle">
                  {n} instance{n === 1 ? "" : "s"}
                </div>
              </div>
            </Card>
          );
        })}
        {PLANNED.map((name) => (
          <Card key={name} className="flex min-w-36 items-center gap-3 p-3 opacity-50">
            <BrandChip name={name} size={28} />
            <div className="min-w-0">
              <div className="truncate text-[13px]">{name}</div>
              <div className="text-xs text-subtle">Planned</div>
            </div>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="skeleton h-48 rounded-xl" />
      ) : !data?.length ? (
        <EmptyState
          icon="database"
          title="No databases yet"
          action={
            <ButtonLink href="/dashboard/databases/new" variant="primary" size="md" icon="plus">
              Create a database
            </ButtonLink>
          }
        >
          VPSPilot can run PostgreSQL, MySQL, MariaDB or Redis on one of your servers and hand your apps their connection details, or connect to a database you already
          run.
        </EmptyState>
      ) : (
        <>
          <SearchBar placeholder="Search databases…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Table>
            <thead>
              <tr>
                <Th>Instance</Th>
                <Th>Status</Th>
                <Th>Server</Th>
                <Th>Mode</Th>
                <Th>Default database</Th>
                <Th>Logins</Th>
                <Th>Created</Th>
                <Th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} className="group transition-colors hover:bg-white/[0.02]">
                  <Td>
                    <Link href={`/dashboard/databases/${d.id}`} className="flex items-center gap-3">
                      <BrandChip name={ENGINE_BRAND[d.engine]} size={30} />
                      <span>
                        <span className="block font-medium group-hover:underline">{d.name}</span>
                        <span className="block text-xs text-subtle">
                          {d.engine_label} {d.mode === "managed" ? d.version : (d.server_version?.split(" ")[0] ?? "")}
                        </span>
                      </span>
                    </Link>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-2" title={d.error ?? undefined}>
                      <Dot tone={dbTone[d.status]} pulse={["creating", "checking", "removing"].includes(d.status)} /> {dbLabel[d.status]}
                    </span>
                  </Td>
                  <Td>
                    <div className="text-[13px]">{d.server_name}</div>
                    <Mono className="text-subtle">
                      {d.host}:{d.port}
                    </Mono>
                  </Td>
                  <Td>
                    <Badge tone={d.mode === "managed" ? "violet" : "neutral"}>{d.mode === "managed" ? "Managed" : "External"}</Badge>
                  </Td>
                  <Td className="font-mono text-[13px] text-muted">{d.default_database ?? "—"}</Td>
                  <Td className="text-muted">{d.engine === "redis" ? "—" : d.users + 1}</Td>
                  <Td className="text-muted">{timeAgo(d.created_at)}</Td>
                  <Td>
                    <Link href={`/dashboard/databases/${d.id}`} aria-label={`Open ${d.name}`} className="text-subtle hover:text-fg">
                      <Icon name="chevron-right" />
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      <p className="flex items-center gap-2 text-xs text-subtle">
        <Icon name="shield-check" size={14} />
        Managed databases have no public port: apps on the same server reach them over a private network. Passwords are encrypted at rest.
      </p>
    </Container>
  );
}
