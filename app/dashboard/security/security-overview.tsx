"use client";

import Link from "next/link";
import { Badge, Callout, Card, Container, EmptyState, SectionTitle, Table, Td, Th } from "@/components/ui";
import { type Severity, useSecurityOverview } from "@/lib/api/security";
import { timeAgo } from "@/lib/format";

const SHOWN: { key: Severity; tone: "err" | "warn" | "neutral" }[] = [
  { key: "critical", tone: "err" },
  { key: "high", tone: "err" },
  { key: "medium", tone: "warn" },
  { key: "low", tone: "neutral" },
];

const EVENT_LABELS: Record<string, string> = {
  new_sign_in: "New sign-in",
  account_locked: "Account locked",
  recovery_code_used: "Recovery code used",
  password_changed: "Password changed",
  password_reset: "Password reset",
  authenticator_enabled: "Authenticator set up",
  role_changed: "Role changed",
};

export function SecurityOverview() {
  const overview = useSecurityOverview();
  const data = overview.data;
  if (overview.isLoading || !data) {
    return (
      <Container>
        <div className="skeleton h-64 rounded-xl" />
      </Container>
    );
  }
  const apps = [...data.apps].sort(
    (a, b) => b.counts.critical - a.counts.critical || b.counts.high - a.counts.high || b.secrets - a.secrets || a.name.localeCompare(b.name),
  );
  return (
    <Container className="space-y-8">
      {!data.lookups && (
        <Callout tone="neutral" title="Vulnerability lookups are off">
          Apps are only checked for committed secrets. Turn lookups on in Settings → Security.
        </Callout>
      )}

      <section>
        <SectionTitle>Applications</SectionTitle>
        {apps.length === 0 ? (
          <EmptyState icon="shield-check" title="No applications yet">
            Each app is scanned after every deploy: its lockfiles, its container&apos;s OS packages and its repository.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Application</Th>
                <Th>Vulnerabilities</Th>
                <Th>Fixable</Th>
                <Th>Other</Th>
                <Th>Checked</Th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => {
                const any = SHOWN.some((s) => a.counts[s.key]);
                return (
                  <tr key={a.id} className="hover:bg-ink/[0.02]">
                    <Td>
                      <Link href={`/dashboard/applications/${a.id}`} className="font-medium text-fg hover:underline">
                        {a.name}
                      </Link>
                      {a.server && <span className="block text-xs text-subtle">{a.server}</span>}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        {any ? (
                          SHOWN.filter((s) => a.counts[s.key]).map((s) => (
                            <Badge key={s.key} tone={s.tone}>
                              {a.counts[s.key]} {s.key}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-subtle">{a.checked_at ? "None known" : "—"}</span>
                        )}
                      </div>
                    </Td>
                    <Td className="text-sm tabular-nums">{a.fixable || "—"}</Td>
                    <Td className="text-sm">
                      {a.secrets > 0 && <span className="block text-err">{a.secrets} possible secret{a.secrets === 1 ? "" : "s"}</span>}
                      {a.eol.map((e) => (
                        <span key={e} className="block text-warn">
                          {e}
                        </span>
                      ))}
                      {a.secrets === 0 && a.eol.length === 0 && <span className="text-subtle">—</span>}
                    </Td>
                    <Td className="text-sm text-muted">
                      {a.check_error ? (
                        <span className="text-warn" title={a.check_error}>
                          Check failed
                        </span>
                      ) : a.checked_at ? (
                        timeAgo(a.checked_at)
                      ) : a.deployed ? (
                        "Waiting for a scan"
                      ) : (
                        "Not deployed"
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </section>

      <section>
        <SectionTitle>Agents</SectionTitle>
        {data.outdated_agents.length === 0 ? (
          <Card className="p-5 text-sm text-muted">Every agent runs the latest version ({data.latest_agent}).</Card>
        ) : (
          <Card className="overflow-hidden">
            {data.outdated_agents.map((s) => (
              <div key={s.id} className="flex items-center gap-3 border-b border-line px-4 py-3 text-sm last:border-0">
                <Link href={`/dashboard/servers/${s.id}`} className="flex-1 font-medium text-fg hover:underline">
                  {s.name}
                </Link>
                <span className="text-muted">
                  {s.version ?? "unknown"} → {data.latest_agent}
                </span>
              </div>
            ))}
            <p className="border-t border-line px-4 py-3 text-xs text-subtle">Re-run the install command on each server to upgrade its agent; the server running VPSPilot upgrades with <span className="font-mono">vpspilot upgrade</span>.</p>
          </Card>
        )}
      </section>

      <section>
        <SectionTitle>Account and team changes</SectionTitle>
        {data.events.length === 0 ? (
          <Card className="p-5 text-sm text-muted">Nothing yet. New sign-ins, password changes, recovery codes and role changes show up here and in your alert channels.</Card>
        ) : (
          <Card className="overflow-hidden">
            {data.events.map((e) => (
              <div key={e.id} className="flex flex-col gap-0.5 border-b border-line px-4 py-3 last:border-0">
                <p className="text-sm text-fg">
                  {EVENT_LABELS[e.action] ?? e.action}
                  {e.target && <span className="text-muted"> · {e.target}</span>}
                </p>
                <p className="text-xs text-subtle">
                  {e.detail}
                  {" · "}
                  {timeAgo(e.at)}
                </p>
              </div>
            ))}
          </Card>
        )}
      </section>
    </Container>
  );
}
