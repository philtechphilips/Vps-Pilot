import type { Metadata } from "next";
import { Avatar, Badge, Button, Container, Mono, PageHeader, SearchBar, Select, Table, Td, Th } from "@/components/ui";
import { auditLog } from "@/lib/data";

export const metadata: Metadata = { title: "Audit Log" };

function resultTone(r: string) {
  if (r.startsWith("rejected") || r.startsWith("failed") || r.includes("failed")) return "err" as const;
  if (r.startsWith("accepted")) return "blue" as const;
  return "ok" as const;
}

export default function AuditPage() {
  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Privileged operations with actor, target, result and correlation ID. Secrets and query literals are never recorded."
        actions={
          <Button variant="secondary" size="md" icon="download">
            Export CSV
          </Button>
        }
      />
      <Container>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchBar placeholder="Search actions, targets or correlation IDs…" className="flex-1" />
          <Select defaultValue="all" className="sm:w-48" aria-label="Action type">
            <option value="all">All actions</option>
            <option>deployment.*</option>
            <option>database.*</option>
            <option>backup.*</option>
            <option>auth.*</option>
          </Select>
          <Select defaultValue="7d" className="sm:w-40" aria-label="Time range">
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </Select>
        </div>

        <Table className="mt-6">
          <thead>
            <tr>
              <Th>Time (UTC)</Th>
              <Th>Actor</Th>
              <Th>Action</Th>
              <Th>Target</Th>
              <Th>Result</Th>
              <Th>Source IP</Th>
              <Th>Correlation ID</Th>
            </tr>
          </thead>
          <tbody>
            {auditLog.map((a) => (
              <tr key={a.id} className="hover:bg-white/[0.02]">
                <Td className="whitespace-nowrap text-muted">{a.time}</Td>
                <Td>
                  <span className="flex items-center gap-2">
                    {a.actor === "system" ? <span className="size-5 rounded-full border border-line bg-bg-300" /> : <Avatar name={a.actor} size={20} />}
                    {a.actor}
                  </span>
                </Td>
                <Td>
                  <Mono className="text-fg">{a.action}</Mono>
                </Td>
                <Td className="max-w-[240px] truncate text-muted">{a.target}</Td>
                <Td>
                  <Badge tone={resultTone(a.result)}>{a.result}</Badge>
                </Td>
                <Td className="font-mono text-xs text-subtle">{a.ip}</Td>
                <Td className="font-mono text-xs text-subtle">{a.correlation}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </>
  );
}
