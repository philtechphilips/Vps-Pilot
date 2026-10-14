"use client";

import { useState } from "react";
import { Avatar, Badge, Button, Callout, Container, EmptyState, Mono, SearchBar, Select, Table, Td, Th, type Tone } from "@/components/ui";
import { type AuditEntry, useAuditLog } from "@/lib/api/jobs";
import { formatDate } from "@/lib/format";

const resultTone: Record<AuditEntry["result"], Tone> = {
  success: "ok",
  accepted: "blue",
  failure: "err",
  rejected: "warn",
};

const CATEGORIES = [
  { value: "", label: "All actions" },
  { value: "auth.", label: "Sign-in & account" },
  { value: "server.", label: "Servers" },
  { value: "agent.", label: "Agents" },
  { value: "job.", label: "Server actions" },
];

export function AuditTable() {
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const log = useAuditLog(category);
  const rows = (log.data?.pages ?? []).flat();
  const shown = rows.filter((e) =>
    `${e.action} ${e.actor_label} ${e.target_label ?? ""} ${e.detail ?? ""} ${e.correlation_id} ${e.ip_address ?? ""}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  return (
    <Container>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBar placeholder="Search actions, people, targets or correlation IDs…" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:w-52" aria-label="Category">
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-6">
        {log.error ? (
          <Callout tone="err" icon="alert" title="Couldn't load the audit log">
            {log.error.message}
          </Callout>
        ) : log.isLoading ? (
          <div className="skeleton h-64 rounded-xl" />
        ) : shown.length === 0 ? (
          <EmptyState icon="shield" title={rows.length ? "Nothing matches" : "No audit entries yet"}>
            {rows.length ? "Try a different search or category." : "Sign-ins, enrollments and server actions are recorded here."}
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>Actor</Th>
                <Th>Action</Th>
                <Th>Target</Th>
                <Th>Result</Th>
                <Th>Source IP</Th>
                <Th>Correlation</Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => (
                <tr key={e.id} className="hover:bg-white/[0.02]">
                  <Td className="whitespace-nowrap text-[13px] text-muted">{formatDate(e.created_at)}</Td>
                  <Td>
                    <span className="flex items-center gap-2 text-[13px]">
                      {e.actor.startsWith("user:") ? (
                        <Avatar name={e.actor_label} size={20} />
                      ) : (
                        <span className="size-5 rounded-full border border-line bg-bg-300" />
                      )}
                      <span className="max-w-[180px] truncate">{e.actor_label}</span>
                    </span>
                  </Td>
                  <Td>
                    <Mono className="text-fg">{e.action}</Mono>
                    {e.detail && <div className="max-w-[320px] truncate text-xs text-subtle">{e.detail}</div>}
                  </Td>
                  <Td className="max-w-[200px] truncate text-[13px] text-muted">{e.target_label ?? "—"}</Td>
                  <Td>
                    <Badge tone={resultTone[e.result]}>{e.result}</Badge>
                  </Td>
                  <Td className="font-mono text-xs text-subtle">{e.ip_address ?? "—"}</Td>
                  <Td className="font-mono text-xs text-subtle">{e.correlation_id.slice(0, 12)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {log.hasNextPage && (
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" size="sm" disabled={log.isFetchingNextPage} onClick={() => log.fetchNextPage()}>
              {log.isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
      </div>
    </Container>
  );
}
