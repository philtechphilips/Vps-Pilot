import type { Metadata } from "next";
import Link from "next/link";
import { BrandChip } from "@/components/brand-chip";
import { Icon } from "@/components/icons";
import { Badge, ButtonLink, Card, Container, Dot, Meter, Mono, PageHeader, SearchBar, Table, Td, Th } from "@/components/ui";
import { databases, dbTone, getServer } from "@/lib/data";

export const metadata: Metadata = { title: "Databases" };

const engines = [
  { name: "PostgreSQL", status: "Available" },
  { name: "MySQL", status: "Available" },
  { name: "MariaDB", status: "Available" },
  { name: "Redis", status: "Available" },
  { name: "MongoDB", status: "Planned" },
  { name: "SQLite", status: "Planned" },
  { name: "SQL Server", status: "Planned" },
] as const;

export default function DatabasesPage() {
  return (
    <>
      <PageHeader
        title="Databases"
        description="Local, Dockerized and remote instances across your servers. Registered, not reinstalled."
        actions={
          <ButtonLink href="/dashboard/databases/new" variant="primary" size="md" icon="plus">
            Register Database
          </ButtonLink>
        }
      />
      <Container className="space-y-6">
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-7">
          {engines.map((e) => {
            const n = databases.filter((d) => d.engine === e.name).length;
            return (
              <Card key={e.name} className={`flex min-w-36 items-center gap-3 p-3 ${e.status === "Planned" ? "opacity-50" : ""}`}>
                <BrandChip name={e.name} size={28} />
                <div className="min-w-0">
                  <div className="truncate text-[13px]">{e.name}</div>
                  <div className="text-xs text-subtle">{e.status === "Planned" ? "Planned" : `${n} instance${n === 1 ? "" : "s"}`}</div>
                </div>
              </Card>
            );
          })}
        </div>

        <SearchBar placeholder="Search databases…" />

        <Table>
          <thead>
            <tr>
              <Th>Instance</Th>
              <Th>Status</Th>
              <Th>Host</Th>
              <Th>Mode</Th>
              <Th>Environment</Th>
              <Th className="w-40">Connections</Th>
              <Th>Size</Th>
              <Th>Last check</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {databases.map((d) => {
              const server = d.serverId ? getServer(d.serverId) : null;
              const pct = Math.round((d.connections[0] / d.connections[1]) * 100);
              return (
                <tr key={d.id} className="group transition-colors hover:bg-white/[0.02]">
                  <Td>
                    <Link href={`/dashboard/databases/${d.id}`} className="flex items-center gap-3">
                      <BrandChip name={d.engine} size={30} />
                      <span>
                        <span className="block font-medium group-hover:underline">{d.name}</span>
                        <span className="block text-xs text-subtle">
                          {d.engine} {d.version}
                        </span>
                      </span>
                    </Link>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-2 capitalize">
                      <Dot tone={dbTone[d.status]} /> {d.status}
                    </span>
                  </Td>
                  <Td>
                    <div className="text-[13px]">{server?.name ?? "Remote"}</div>
                    <Mono className="text-subtle">{d.endpoint}</Mono>
                  </Td>
                  <Td>
                    <Badge tone={d.mode === "Remote" ? "violet" : d.mode === "Docker" ? "blue" : "neutral"}>{d.mode}</Badge>
                  </Td>
                  <Td className="text-muted capitalize">{d.env}</Td>
                  <Td>
                    <div className="mb-1 flex justify-between font-mono text-xs text-muted">
                      <span>{d.connections[0]}</span>
                      <span className="text-subtle">/ {d.connections[1].toLocaleString()}</span>
                    </div>
                    <Meter value={pct} />
                  </Td>
                  <Td className="font-mono text-[13px] text-muted">{d.size}</Td>
                  <Td className="text-muted">{d.lastCheck}</Td>
                  <Td>
                    <Link href={`/dashboard/databases/${d.id}`} aria-label={`Open ${d.name}`} className="text-subtle hover:text-fg">
                      <Icon name="chevron-right" />
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>

        <p className="flex items-center gap-2 text-xs text-subtle">
          <Icon name="shield-check" size={14} />
          Credentials are encrypted at rest and never returned after entry. Monitoring uses dedicated least-privileged roles.
        </p>
      </Container>
    </>
  );
}
