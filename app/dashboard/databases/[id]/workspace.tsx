"use client";

import { useMemo, useState } from "react";
import { AreaChart, Legend } from "@/components/charts";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ChartCard, InfoGrid } from "@/components/dashboard/detail";
import { Icon, type IconName } from "@/components/icons";
import { Badge, Button, Callout, Card, Container, Dot, FormCard, Input, Label, Mono, SectionTitle, Select, Table, Td, Th } from "@/components/ui";
import {
  type DatabaseInstance,
  backups,
  backupTone,
  dbTree,
  dbUsers,
  queryResult,
  redisHashSample,
  redisKeys,
  sampleQuery,
  tableInfo,
  timeLabels,
} from "@/lib/data";
import { cn, series } from "@/lib/utils";

type Tab = "overview" | "explorer" | "query" | "keys" | "users" | "backups" | "settings";

export function DatabaseWorkspace({ db }: { db: DatabaseInstance }) {
  const isRedis = db.engine === "Redis";
  const tabs: { id: Tab; label: string; icon: IconName }[] = isRedis
    ? [
        { id: "overview", label: "Overview", icon: "activity" },
        { id: "keys", label: "Keys", icon: "key" },
        { id: "users", label: "ACL Users", icon: "users" },
        { id: "backups", label: "Backups", icon: "archive" },
        { id: "settings", label: "Settings", icon: "settings" },
      ]
    : [
        { id: "overview", label: "Overview", icon: "activity" },
        { id: "explorer", label: "Explorer", icon: "table" },
        { id: "query", label: "Query", icon: "terminal" },
        { id: "users", label: "Users & Roles", icon: "users" },
        { id: "backups", label: "Backups", icon: "archive" },
        { id: "settings", label: "Settings", icon: "settings" },
      ];
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <>
      <div className="mt-5 border-b border-line">
        <div role="tablist" aria-label="Database sections" className="no-scrollbar flex overflow-x-auto px-2 sm:px-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn("relative shrink-0 px-1 py-2.5 text-sm transition-colors", tab === t.id ? "text-fg" : "text-muted hover:text-fg")}
            >
              <span className="flex items-center gap-2 rounded-md px-2.5 py-1 hover:bg-white/[0.06]">
                <Icon name={t.icon} size={14} />
                {t.label}
              </span>
              {tab === t.id && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-fg" />}
            </button>
          ))}
        </div>
      </div>
      <Container>
        {db.status === "unreachable" && (
          <div className="mb-6">
            <Callout tone="err" icon="x-circle" title="Connection failed: certificate has expired">
              The remote endpoint presented a certificate that expired on 2026-10-12. VPSPilot refuses unverified TLS. Renew the certificate on the server or update the trusted
              CA bundle in Settings.
            </Callout>
          </div>
        )}
        {tab === "overview" && <Overview db={db} />}
        {tab === "explorer" && <Explorer />}
        {tab === "query" && <QueryEditor db={db} />}
        {tab === "keys" && <KeyBrowser db={db} />}
        {tab === "users" && <Users db={db} />}
        {tab === "backups" && <Backups db={db} />}
        {tab === "settings" && <Settings db={db} />}
      </Container>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Overview({ db }: { db: DatabaseInstance }) {
  const seed = [...db.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const conn = series(seed, 60, (db.connections[0] / db.connections[1]) * 100, 6);
  const ops = series(seed + 5, 60, 55, 18);
  const isRedis = db.engine === "Redis";

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {db.metrics.map((m) => (
          <Card key={m.label} className="p-4">
            <div className="text-[13px] text-muted">{m.label}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{m.value}</div>
            {m.sub && <div className="mt-0.5 text-xs text-subtle">{m.sub}</div>}
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Connections" value={`${db.connections[0]} / ${db.connections[1].toLocaleString()}`} sub="% of max_connections">
          <AreaChart series={[{ name: "Connections", data: conn, color: conn[conn.length - 1] > 85 ? "err" : "blue" }]} labels={timeLabels} height={150} />
        </ChartCard>
        <ChartCard
          title={isRedis ? "Commands / s" : "Throughput"}
          value={db.metrics[1].value}
          sub={isRedis ? "keyspace hits vs misses" : "reads vs writes, % of peak"}
          right={
            <Legend
              items={[
                { name: isRedis ? "Hits" : "Reads", color: "teal" },
                { name: isRedis ? "Misses" : "Writes", color: "violet" },
              ]}
            />
          }
        >
          <AreaChart
            series={[
              { name: isRedis ? "Hits" : "Reads", data: ops, color: "teal" },
              { name: isRedis ? "Misses" : "Writes", data: ops.map((v) => Math.round(v * 0.35 * 10) / 10), color: "violet" },
            ]}
            labels={timeLabels}
            height={150}
          />
        </ChartCard>
      </div>

      {!isRedis && (
        <section>
          <SectionTitle action={<span className="text-xs text-subtle">pg_stat_activity · refreshed 5s ago</span>}>Active Sessions</SectionTitle>
          <Table>
            <thead>
              <tr>
                <Th>PID</Th>
                <Th>User</Th>
                <Th>Database</Th>
                <Th>State</Th>
                <Th>Duration</Th>
                <Th>Query fingerprint</Th>
                <Th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {[
                ["48122", "storefront_app", "storefront", "active", "2.1s", "SELECT … FROM order_items oi JOIN products p ON … WHERE oi.order_id = ANY($1)"],
                ["48190", "storefront_app", "storefront", "idle in transaction", "14.8s", "UPDATE inventory_movements SET … WHERE sku = $1"],
                ["48201", "vpspilot_monitor", "postgres", "active", "4ms", "SELECT … FROM pg_stat_database"],
                ["47755", "replicator", "—", "streaming", "41d", "START_REPLICATION SLOT replica_1"],
              ].map((r) => (
                <tr key={r[0]} className="hover:bg-white/[0.02]">
                  <Td className="font-mono text-[13px]">{r[0]}</Td>
                  <Td className="text-muted">{r[1]}</Td>
                  <Td className="text-muted">{r[2]}</Td>
                  <Td>
                    <Badge tone={r[3] === "active" ? "ok" : r[3] === "streaming" ? "blue" : "warn"}>{r[3]}</Badge>
                  </Td>
                  <Td className="font-mono text-[13px] text-muted">{r[4]}</Td>
                  <Td className="max-w-[360px] truncate font-mono text-xs text-subtle">{r[5]}</Td>
                  <Td className="text-right">
                    {r[3] !== "streaming" && r[1] !== "vpspilot_monitor" && (
                      <Button variant="ghost" size="xs">
                        Cancel
                      </Button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>
      )}

      <Card className="p-5 sm:p-6">
        <InfoGrid
          items={[
            { label: "Endpoint", value: <Mono>{db.endpoint}</Mono> },
            { label: "TLS", value: db.tls ? "Required · verified" : "Disabled (local socket)" },
            { label: "Monitoring identity", value: <Mono>{db.credential}</Mono> },
            { label: "Credential rotated", value: db.rotated },
            { label: "Size", value: db.size },
            { label: "Environment", value: <span className="capitalize">{db.env}</span> },
            { label: "Capabilities", value: db.engine === "Redis" ? "metrics, keys, acl, backup" : "metrics, explorer, query, users, backup" },
            { label: "Network exposure", value: <span className="text-ok">Private · not publicly reachable</span> },
          ]}
        />
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Explorer() {
  const [openDb, setOpenDb] = useState<Record<string, boolean>>({ storefront: true, "storefront.public": true });
  const [table, setTable] = useState("orders");
  const [view, setView] = useState<"columns" | "indexes" | "constraints" | "data">("columns");
  const [filter, setFilter] = useState("");

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card className="h-fit overflow-hidden">
        <div className="border-b border-line p-2">
          <Input icon="search" placeholder="Filter objects…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <div className="thin-scrollbar max-h-[560px] overflow-y-auto p-2 text-[13px]">
          {dbTree.sql.map((d) => (
            <div key={d.name}>
              <TreeRow depth={0} icon="database" open={!!openDb[d.name]} onClick={() => setOpenDb((o) => ({ ...o, [d.name]: !o[d.name] }))}>
                {d.name}
              </TreeRow>
              {openDb[d.name] &&
                d.schemas.map((s) => {
                  const key = `${d.name}.${s.name}`;
                  const tables = s.tables.filter((t) => t.includes(filter.toLowerCase()));
                  return (
                    <div key={key}>
                      <TreeRow depth={1} icon="folder" open={!!openDb[key]} onClick={() => setOpenDb((o) => ({ ...o, [key]: !o[key] }))}>
                        {s.name} <span className="text-subtle">{s.tables.length}</span>
                      </TreeRow>
                      {openDb[key] &&
                        tables.map((t) => (
                          <TreeRow key={t} depth={2} icon="table" active={t === table && d.name === "storefront"} onClick={() => setTable(t)}>
                            {t}
                          </TreeRow>
                        ))}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </Card>

      <div className="min-w-0 space-y-4">
        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Icon name="table" className="text-muted" />
            <h2 className="font-mono text-lg">public.{table}</h2>
            <Badge>table</Badge>
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" size="sm" icon="download">
                Export
              </Button>
              <Button variant="secondary" size="sm" icon="terminal">
                Query
              </Button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            {[
              ["Rows (est.)", tableInfo.rows],
              ["Table size", tableInfo.size],
              ["Index size", tableInfo.indexSize],
              ["Last vacuum", "2h ago"],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-[13px] text-muted">{k}</div>
                <div className="mt-0.5 font-mono">{v}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="inline-flex rounded-md border border-line bg-bg p-0.5 text-[13px]">
          {(["columns", "indexes", "constraints", "data"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn("rounded-[5px] px-3 py-1.5 capitalize", view === v ? "bg-bg-300 text-fg" : "text-muted hover:text-fg")}
            >
              {v === "data" ? "Data preview" : v}
            </button>
          ))}
        </div>

        {view === "columns" && (
          <Table>
            <thead>
              <tr>
                <Th>Column</Th>
                <Th>Type</Th>
                <Th>Nullable</Th>
                <Th>Default</Th>
                <Th>Key</Th>
              </tr>
            </thead>
            <tbody>
              {tableInfo.columns.map((c) => (
                <tr key={c.name} className="hover:bg-white/[0.02]">
                  <Td className="font-mono text-[13px]">{c.name}</Td>
                  <Td className="font-mono text-[13px] text-blue-fg">{c.type}</Td>
                  <Td className="text-muted">{c.nullable ? "YES" : "NO"}</Td>
                  <Td className="font-mono text-xs text-subtle">{c.default || "—"}</Td>
                  <Td>{c.key && <Badge tone={c.key === "PK" ? "warn" : "violet"}>{c.key}</Badge>}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {view === "indexes" && (
          <Table>
            <thead>
              <tr>
                <Th>Index</Th>
                <Th>Definition</Th>
                <Th>Size</Th>
              </tr>
            </thead>
            <tbody>
              {tableInfo.indexes.map((i) => (
                <tr key={i.name}>
                  <Td className="font-mono text-[13px]">{i.name}</Td>
                  <Td className="font-mono text-xs text-muted">{i.def}</Td>
                  <Td className="font-mono text-[13px] text-muted">{i.size}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {view === "constraints" && (
          <Table>
            <thead>
              <tr>
                <Th>Constraint</Th>
                <Th>Definition</Th>
              </tr>
            </thead>
            <tbody>
              {tableInfo.constraints.map((c) => (
                <tr key={c.name}>
                  <Td className="font-mono text-[13px]">{c.name}</Td>
                  <Td className="font-mono text-xs text-muted">{c.def}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {view === "data" && <ResultGrid />}
      </div>
    </div>
  );
}

function TreeRow({
  depth,
  icon,
  open,
  active,
  onClick,
  children,
}: {
  depth: number;
  icon: IconName;
  open?: boolean;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left transition-colors",
        active ? "bg-blue/15 text-blue-fg" : "text-muted hover:bg-white/[0.05] hover:text-fg",
      )}
      style={{ paddingLeft: 6 + depth * 14 }}
    >
      {open !== undefined ? (
        <Icon name="chevron-right" size={12} className={cn("shrink-0 transition-transform", open && "rotate-90")} />
      ) : (
        <span className="w-3 shrink-0" />
      )}
      <Icon name={icon} size={14} className="shrink-0" />
      <span className="truncate font-mono text-[12.5px]">{children}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */

const WRITE_RE = /\b(insert|update|delete|drop|truncate|alter|create|grant|revoke)\b/i;

function QueryEditor({ db }: { db: DatabaseInstance }) {
  const [sql, setSql] = useState(sampleQuery);
  const [state, setState] = useState<"idle" | "running" | "done" | "blocked">("done");
  const [role, setRole] = useState("vpspilot_readonly");
  const lines = sql.split("\n").length;
  const isWrite = WRITE_RE.test(sql);

  const run = () => {
    if (isWrite && role === "vpspilot_readonly") {
      setState("blocked");
      return;
    }
    setState("running");
    setTimeout(() => setState("done"), 700);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
      <div className="min-w-0 space-y-4">
        <div className="overflow-hidden rounded-lg border border-line bg-bg">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
            <Select defaultValue="storefront" className="w-40" aria-label="Database">
              <option>storefront</option>
              <option>analytics_staging</option>
              <option>postgres</option>
            </Select>
            <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-52" aria-label="Role">
              <option value="vpspilot_readonly">vpspilot_readonly (read-only)</option>
              <option value="vpspilot_admin">vpspilot_admin (confirm writes)</option>
            </Select>
            <span className="hidden items-center gap-3 text-xs text-subtle md:flex">
              <span>timeout 30s</span>
              <span>max 1,000 rows · 5 MB</span>
            </span>
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSql("")}>
                Clear
              </Button>
              <Button variant="primary" size="sm" icon="play" onClick={run} disabled={state === "running" || db.status === "unreachable"}>
                Run <span className="ml-1 hidden text-black/50 sm:inline">⌘↵</span>
              </Button>
            </div>
          </div>
          <div className="flex font-mono text-[13px] leading-6">
            <div className="shrink-0 border-r border-line bg-bg-100 py-3 pr-3 pl-4 text-right text-subtle select-none" aria-hidden="true">
              {Array.from({ length: Math.max(lines, 8) }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run();
              }}
              spellCheck={false}
              aria-label="SQL query"
              className="min-h-[200px] w-full resize-y bg-transparent px-4 py-3 text-fg outline-none"
              style={{ height: Math.max(lines, 8) * 24 + 24 }}
            />
          </div>
        </div>

        {isWrite && role === "vpspilot_readonly" && state !== "blocked" && (
          <Callout tone="warn" icon="lock" title="This looks like a write statement">
            Read-only browsing is the default. Switch to an administrative role to run writes; destructive statements require typed confirmation.
          </Callout>
        )}
        {state === "blocked" && (
          <Callout tone="err" icon="x-circle" title="Rejected by policy">
            <Mono>vpspilot_readonly</Mono> cannot execute write statements. The attempt was recorded in the audit log (query fingerprint only, no literals).
          </Callout>
        )}

        {state === "running" && (
          <Card className="space-y-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-6 rounded" />
            ))}
          </Card>
        )}
        {state === "done" && <ResultGrid showMeta />}
      </div>

      <aside className="space-y-4">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-3 text-sm font-medium">History</div>
          {[
            ["SELECT id, customer_email … LIMIT 50", "38 ms", "ok"],
            ["SELECT status, count(*) … GROUP BY 1", "112 ms", "ok"],
            ["DELETE FROM sessions WHERE …", "rejected", "err"],
            ["EXPLAIN ANALYZE SELECT …", "2.3 s", "ok"],
          ].map(([q, t, s]) => (
            <button key={q} type="button" className="block w-full border-b border-line px-4 py-2.5 text-left last:border-0 hover:bg-white/[0.03]">
              <div className="truncate font-mono text-xs text-fg">{q}</div>
              <div className={cn("mt-0.5 text-[11px]", s === "err" ? "text-err" : "text-subtle")}>{t}</div>
            </button>
          ))}
        </Card>
        <Card className="p-4 text-xs text-muted">
          <p className="flex items-center gap-2 font-medium text-fg">
            <Icon name="shield-check" size={14} /> Query policy
          </p>
          <ul className="mt-2 space-y-1.5">
            <li>Executed by the agent, never from the browser.</li>
            <li>Statement timeout 30s, cancellable.</li>
            <li>Results capped at 1,000 rows / 5 MB.</li>
            <li>Audit stores fingerprint, duration and row count only.</li>
          </ul>
        </Card>
      </aside>
    </div>
  );
}

function ResultGrid({ showMeta }: { showMeta?: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-bg-100">
      {showMeta && (
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5 text-xs text-muted">
          <span className="flex items-center gap-1.5 text-ok">
            <Icon name="check-circle" size={14} /> Success
          </span>
          <span>{queryResult.rowCount} rows</span>
          <span>{queryResult.duration}</span>
          <span className="text-subtle">PII columns masked</span>
          <button type="button" className="ml-auto inline-flex items-center gap-1 hover:text-fg">
            <Icon name="download" size={14} /> CSV
          </button>
        </div>
      )}
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[640px] font-mono text-[12.5px]">
          <thead>
            <tr>
              <th className="w-10 border-b border-line bg-bg-200 px-3 py-2 text-right font-normal text-subtle">#</th>
              {queryResult.columns.map((c) => (
                <th key={c} className="border-b border-l border-line bg-bg-200 px-3 py-2 text-left font-medium whitespace-nowrap text-muted">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queryResult.rows.map((r, i) => (
              <tr key={i} className="hover:bg-white/[0.03]">
                <td className="border-b border-line px-3 py-2 text-right text-subtle">{i + 1}</td>
                {r.map((c, j) => (
                  <td key={j} className={cn("border-b border-l border-line px-3 py-2 whitespace-nowrap", j === 3 ? "text-right text-blue-fg" : "text-fg")}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const typeColor: Record<string, string> = {
  string: "text-[#60a5fa] border-[#60a5fa]/30 bg-[#60a5fa]/10",
  hash: "text-[#f472b6] border-[#f472b6]/30 bg-[#f472b6]/10",
  list: "text-[#34d399] border-[#34d399]/30 bg-[#34d399]/10",
  set: "text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10",
  zset: "text-[#a78bfa] border-[#a78bfa]/30 bg-[#a78bfa]/10",
  stream: "text-[#2dd4bf] border-[#2dd4bf]/30 bg-[#2dd4bf]/10",
};

function KeyBrowser({ db }: { db: DatabaseInstance }) {
  const [pattern, setPattern] = useState("*");
  const [selected, setSelected] = useState("cart:user:1042");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState<string[]>([]);

  const matches = useMemo(() => {
    const re = new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".")}$`);
    return redisKeys.filter((k) => re.test(k.key) && !deleted.includes(k.key));
  }, [pattern, deleted]);
  const key = redisKeys.find((k) => k.key === selected && !deleted.includes(k.key));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
      <Card className="h-fit overflow-hidden">
        <div className="flex gap-2 border-b border-line p-2">
          <Input icon="search" value={pattern} onChange={(e) => setPattern(e.target.value || "*")} className="flex-1 font-mono" aria-label="SCAN MATCH pattern" />
          <Select defaultValue="db0" className="w-20" aria-label="Logical database">
            <option>db0</option>
            <option>db1</option>
          </Select>
        </div>
        <div className="border-b border-line px-3 py-2 font-mono text-[11px] text-subtle">
          SCAN 0 MATCH {pattern} COUNT 100 · {matches.length} keys
        </div>
        <div className="thin-scrollbar max-h-[520px] overflow-y-auto">
          {matches.map((k) => (
            <button
              key={k.key}
              type="button"
              onClick={() => setSelected(k.key)}
              className={cn(
                "flex w-full items-center gap-2 border-b border-line px-3 py-2.5 text-left last:border-0",
                selected === k.key ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
              )}
            >
              <span className={cn("w-12 shrink-0 rounded border px-1 text-center font-mono text-[10px]", typeColor[k.type])}>{k.type}</span>
              <span className="min-w-0 flex-1 truncate font-mono text-[12.5px]">{k.key}</span>
              <span className="shrink-0 text-[11px] text-subtle">{k.ttl}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-line p-2">
          <Button variant="ghost" size="sm" className="w-full">
            Load more · cursor 1840
          </Button>
        </div>
      </Card>

      <div className="min-w-0 space-y-4">
        {key ? (
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
              <span className={cn("rounded border px-1.5 font-mono text-[11px]", typeColor[key.type])}>{key.type}</span>
              <h2 className="min-w-0 flex-1 truncate font-mono">{key.key}</h2>
              <Button variant="secondary" size="sm" icon="clock">
                TTL {key.ttl}
              </Button>
              <Button variant="secondary" size="sm" icon="trash" className="text-err" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b border-line px-4 py-3 text-xs">
              <div>
                <div className="text-subtle">Memory</div>
                <div className="mt-0.5 font-mono">{key.size}</div>
              </div>
              <div>
                <div className="text-subtle">Encoding</div>
                <div className="mt-0.5 font-mono">{key.type === "hash" ? "listpack" : key.type === "string" ? "embstr" : "quicklist"}</div>
              </div>
              <div>
                <div className="text-subtle">Idle</div>
                <div className="mt-0.5 font-mono">12s</div>
              </div>
            </div>
            {key.type === "hash" ? (
              <table className="w-full font-mono text-[12.5px]">
                <thead>
                  <tr>
                    <th className="w-40 border-b border-line bg-bg-200 px-4 py-2 text-left font-medium text-muted">field</th>
                    <th className="border-b border-line bg-bg-200 px-4 py-2 text-left font-medium text-muted">value</th>
                  </tr>
                </thead>
                <tbody>
                  {redisHashSample.map(([f, v]) => (
                    <tr key={f}>
                      <td className="border-b border-line px-4 py-2.5 align-top text-[#f472b6]">{f}</td>
                      <td className="border-b border-line px-4 py-2.5 break-all text-fg">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <pre className="thin-scrollbar overflow-x-auto p-4 font-mono text-[12.5px] text-fg">
                {key.type === "string" ? '"17"' : key.type === "zset" ? "1) usr_1042  4210\n2) usr_2310  3988\n3) usr_0871  3501" : "Showing first 100 elements…"}
              </pre>
            )}
          </Card>
        ) : (
          <Card className="p-10 text-center text-sm text-muted">Select a key to inspect it.</Card>
        )}

        <FormCard
          danger
          title="Flush Database"
          description={
            <>
              Runs <Mono>FLUSHDB ASYNC</Mono> on db0 of <span className="text-fg">{db.name}</span>. Requires the admin ACL user and typed confirmation. A fresh RDB snapshot is taken first.
            </>
          }
          action={
            <Button variant="danger" size="sm">
              Flush db0
            </Button>
          }
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setDeleted((d) => [...d, selected]);
          setConfirmDelete(false);
        }}
        title="Delete key"
        confirmText={selected}
        action="Delete key"
      >
        <span className="font-mono text-fg">{selected}</span> will be removed with <Mono>UNLINK</Mono>.
      </ConfirmDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Users({ db }: { db: DatabaseInstance }) {
  const [creating, setCreating] = useState(false);
  const isRedis = db.engine === "Redis";
  const rows = isRedis
    ? [
        { name: "default", attrs: ["off"], grants: "disabled", purpose: "Legacy AUTH", lastLogin: "—", managed: false },
        { name: "vpspilot-ro", attrs: ["on"], grants: "+@read +info +scan ~*", purpose: "Monitoring & browsing", lastLogin: "4s ago", managed: true },
        { name: "vpspilot-admin", attrs: ["on"], grants: "+@all -@dangerous +flushdb ~*", purpose: "Administrative ops", lastLogin: "3d ago", managed: true },
        { name: "storefront", attrs: ["on"], grants: "+@all -@admin ~session:* ~cart:* ~rate:*", purpose: "Application", lastLogin: "1s ago", managed: false },
      ]
    : dbUsers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">{isRedis ? "ACL users" : "Roles and grants"} discovered on this instance. Managed identities are created and rotated by VPSPilot.</p>
        <Button variant="primary" size="md" icon="plus" onClick={() => setCreating((c) => !c)}>
          {isRedis ? "New ACL User" : "Create User"}
        </Button>
      </div>

      {creating && (
        <FormCard
          title={isRedis ? "New ACL user" : "Create a restricted user"}
          description="The password is generated, shown once and stored encrypted. Grants are applied through the typed engine adapter."
          footer="Requires confirmation by the admin identity."
          action={
            <Button variant="primary" size="sm" onClick={() => setCreating(false)}>
              Create
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="uname">Username</Label>
              <Input id="uname" className="font-mono" placeholder="reporting_ro" />
            </div>
            <div>
              <Label htmlFor="preset">Access</Label>
              <Select id="preset" defaultValue="ro">
                <option value="ro">Read-only</option>
                <option value="rw">Read & write (no DDL)</option>
                <option value="custom">Custom grants…</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="scope">{isRedis ? "Key pattern" : "Database"}</Label>
              {isRedis ? (
                <Input id="scope" className="font-mono" defaultValue="~report:*" />
              ) : (
                <Select id="scope" defaultValue="storefront">
                  <option>storefront</option>
                  <option>analytics_staging</option>
                </Select>
              )}
            </div>
          </div>
        </FormCard>
      )}

      <Table>
        <thead>
          <tr>
            <Th>User</Th>
            <Th>Attributes</Th>
            <Th>Grants</Th>
            <Th>Purpose</Th>
            <Th>Last seen</Th>
            <Th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.name} className="hover:bg-white/[0.02]">
              <Td>
                <span className="flex items-center gap-2">
                  <Mono className="text-fg">{u.name}</Mono>
                  {u.managed && <Badge tone="blue">Managed</Badge>}
                </span>
              </Td>
              <Td>
                <span className="flex flex-wrap gap-1">
                  {u.attrs.map((a) => (
                    <Badge key={a} tone={a === "SUPERUSER" ? "err" : a === "off" ? "neutral" : "neutral"}>
                      {a}
                    </Badge>
                  ))}
                </span>
              </Td>
              <Td className="max-w-[280px] truncate font-mono text-xs text-muted">{u.grants}</Td>
              <Td className="text-muted">{u.purpose}</Td>
              <Td className="text-muted">{u.lastLogin}</Td>
              <Td>
                <button type="button" aria-label={`Options for ${u.name}`} className="inline-flex size-8 items-center justify-center rounded-md text-subtle hover:bg-white/10 hover:text-fg">
                  <Icon name="more" />
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Backups({ db }: { db: DatabaseInstance }) {
  const list = backups.filter((b) => b.target === db.id);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [target, setTarget] = useState<"new" | "overwrite">("new");
  const [done, setDone] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-[13px] text-muted">Schedule</div>
          <div className="mt-1 font-medium">Daily at 03:00 UTC</div>
          <div className="mt-0.5 text-xs text-subtle">{db.engine === "PostgreSQL" ? "pg_dump -Fc + WAL archiving" : db.engine === "Redis" ? "RDB snapshot" : "mysqldump --single-transaction"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[13px] text-muted">Destination</div>
          <div className="mt-1 font-medium">s3://acme-backups</div>
          <div className="mt-0.5 text-xs text-subtle">Off-host · AES-256-GCM · key v3</div>
        </Card>
        <Card className="p-4">
          <div className="text-[13px] text-muted">Restore test</div>
          <div className="mt-1 font-medium">Weekly · Sundays</div>
          <div className="mt-0.5 text-xs text-subtle">into a separate, disposable target</div>
        </Card>
      </div>

      {done && (
        <Callout tone="ok" icon="check-circle" title="Restore job queued">
          job_8813 restoring into <Mono>{db.name}-restore-1013</Mono>. You will be notified when verification completes.
        </Callout>
      )}

      {list.length ? (
        <Table>
          <thead>
            <tr>
              <Th>Backup</Th>
              <Th>Status</Th>
              <Th>Size</Th>
              <Th>Checksum</Th>
              <Th>Retention</Th>
              <Th>Restore verification</Th>
              <Th className="w-28" />
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.id} className="hover:bg-white/[0.02]">
                <Td>
                  <Mono className="text-fg">{b.id}</Mono>
                  <div className="text-xs text-subtle">{b.created}</div>
                </Td>
                <Td>
                  <span className="flex items-center gap-2 capitalize">
                    <Dot tone={backupTone[b.status]} pulse={b.status === "running"} />
                    {b.status}
                  </span>
                </Td>
                <Td className="font-mono text-[13px] text-muted">{b.size}</Td>
                <Td className="font-mono text-xs text-subtle">{b.checksum}</Td>
                <Td className="text-muted">{b.retention}</Td>
                <Td className="text-xs text-muted">{b.restoreTest}</Td>
                <Td className="text-right">
                  {(b.status === "verified" || b.status === "completed") && (
                    <Button variant="secondary" size="xs" icon="rollback" onClick={() => setRestoring(b.id)}>
                      Restore
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Card className="p-8 text-center text-sm text-muted">No backups yet for {db.name}.</Card>
      )}

      {restoring && (
        <RestoreDialog
          db={db}
          backupId={restoring}
          target={target}
          setTarget={setTarget}
          onClose={() => setRestoring(null)}
          onDone={() => {
            setRestoring(null);
            setDone(true);
          }}
        />
      )}
    </div>
  );
}

function RestoreDialog({
  db,
  backupId,
  target,
  setTarget,
  onClose,
  onDone,
}: {
  db: DatabaseInstance;
  backupId: string;
  target: "new" | "overwrite";
  setTarget: (t: "new" | "overwrite") => void;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<"choose" | "confirm">("choose");
  if (step === "confirm") {
    return (
      <ConfirmDialog open onClose={onClose} onConfirm={onDone} title={`Overwrite ${db.name}`} confirmText={db.name} phrase="overwrite with backup" action="Restore and overwrite">
        All data in <span className="text-fg">{db.name}</span> will be replaced by <Mono>{backupId}</Mono>. A pre-restore snapshot is taken automatically.
      </ConfirmDialog>
    );
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-[520px] animate-fade-up overflow-hidden rounded-t-xl border border-line-strong bg-bg-100 sm:rounded-xl">
        <div className="p-6">
          <h2 className="text-xl font-semibold tracking-tight">Restore {backupId}</h2>
          <p className="mt-2 text-sm text-muted">Checksum is verified and the artifact decrypted before anything is written.</p>
          <div className="mt-5 space-y-2">
            {(
              [
                { id: "new", title: "Restore to a new target", desc: `Creates ${db.name}-restore-1013 on the same server. Nothing existing is touched.`, rec: true },
                { id: "overwrite", title: `Overwrite ${db.name}`, desc: "Replaces live data. Requires typed confirmation.", rec: false },
              ] as const
            ).map((o) => (
              <label
                key={o.id}
                className={cn("flex cursor-pointer gap-3 rounded-md border p-4", target === o.id ? (o.id === "overwrite" ? "border-err/60 bg-err/[0.05]" : "border-fg bg-white/[0.04]") : "border-line")}
              >
                <input type="radio" name="restore-target" checked={target === o.id} onChange={() => setTarget(o.id)} className="mt-1 accent-white" />
                <span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {o.title}
                    {o.rec && <Badge tone="ok">Recommended</Badge>}
                  </span>
                  <span className="mt-1 block text-[13px] text-muted">{o.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-between border-t border-line bg-bg-200 px-6 py-4">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={target === "overwrite" ? "danger" : "primary"} size="md" onClick={() => (target === "overwrite" ? setStep("confirm") : onDone())}>
            {target === "overwrite" ? "Continue" : "Start Restore"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Settings({ db }: { db: DatabaseInstance }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="space-y-6">
      <FormCard
        title="Display Name"
        description="Used across the dashboard and in alerts."
        footer="Please use 48 characters at maximum."
        action={
          <Button variant="primary" size="sm">
            Save
          </Button>
        }
      >
        <Input defaultValue={db.name} className="max-w-sm" />
      </FormCard>
      <FormCard
        title="Query Limits"
        description="Applied to every query run from the dashboard. Lower limits reduce the risk of expensive scans on production."
        action={
          <Button variant="primary" size="sm">
            Save
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="to">Statement timeout</Label>
            <Input id="to" defaultValue="30s" />
          </div>
          <div>
            <Label htmlFor="rows">Max rows</Label>
            <Input id="rows" defaultValue="1000" />
          </div>
          <div>
            <Label htmlFor="bytes">Max result size</Label>
            <Input id="bytes" defaultValue="5 MB" />
          </div>
        </div>
      </FormCard>
      <FormCard
        title="Credentials"
        description={
          <>
            Monitoring identity <Mono className="text-fg">{db.credential}</Mono>, last rotated {db.rotated}. Secrets are never displayed after entry.
          </>
        }
        footer="Rotation creates a new password, updates the instance and revokes the old one."
        action={
          <Button variant="secondary" size="sm" icon="refresh">
            Rotate
          </Button>
        }
      />
      <FormCard
        danger
        title="Unregister Database"
        description="Removes this instance and its stored credentials from VPSPilot. The database itself and its data are not modified. Backups follow their retention policy."
        action={
          <Button variant="danger" size="sm" onClick={() => setConfirm(true)}>
            Unregister
          </Button>
        }
      />
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => setConfirm(false)} title="Unregister database" confirmText={db.name} action="Unregister">
        VPSPilot will stop monitoring <span className="text-fg">{db.name}</span> and delete its encrypted credentials.
      </ConfirmDialog>
    </div>
  );
}
