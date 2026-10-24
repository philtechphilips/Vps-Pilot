"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BrandChip } from "@/components/brand-chip";
import { CopyButton } from "@/components/copy-button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DetailHeader, InfoGrid } from "@/components/dashboard/detail";
import { Icon, type IconName } from "@/components/icons";
import { Badge, Button, Callout, Card, Container, Dot, EmptyState, FormCard, Input, Label, Mono, SectionTitle, Select } from "@/components/ui";
import { useApps } from "@/lib/api/apps";
import {
  type DatabaseInstance,
  ENGINE_BRAND,
  type ResultSet,
  runDbJob,
  useConnection,
  useDatabase,
  useDbAction,
  useDbRead,
  useRemoveDatabase,
} from "@/lib/api/databases";
import { formatBytes, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { dbLabel, dbTone } from "../database-list";
import { MetricsSection, RedisLoginsTab, TlsCard, TransferTab } from "./extras";

type Tab = "overview" | "connect" | "query" | "users" | "transfer" | "keys" | "logins" | "settings";

export function DatabaseView() {
  const { id } = useParams<{ id: string }>();
  const database = useDatabase(id);
  const [tab, setTab] = useState<Tab>("overview");

  if (database.isLoading) {
    return (
      <Container className="space-y-4 pt-6">
        <div className="skeleton h-10 w-64 rounded" />
        <div className="skeleton h-64 rounded-xl" />
      </Container>
    );
  }
  if (database.error || !database.data) {
    return (
      <Container className="pt-6">
        <EmptyState
          icon="database"
          title={database.error?.status === 404 ? "Database not found" : "Couldn't load this database"}
          action={
            <Link href="/dashboard/databases" className="text-sm text-accent-fg hover:underline">
              Back to databases
            </Link>
          }
        />
      </Container>
    );
  }

  const d = database.data;
  const redis = d.engine === "redis";
  const ready = d.status === "running";
  const tabs: { id: Tab; label: string; icon: IconName }[] = [
    { id: "overview", label: "Overview", icon: "activity" },
    { id: "connect", label: "Connect", icon: "link" },
    ...(redis
      ? [
          { id: "keys" as Tab, label: "Keys", icon: "key" as IconName },
          { id: "logins" as Tab, label: "Logins", icon: "users" as IconName },
        ]
      : [
          { id: "query" as Tab, label: "Query", icon: "terminal" as IconName },
          { id: "users" as Tab, label: "Users & Databases", icon: "users" as IconName },
          { id: "transfer" as Tab, label: "Import & Export", icon: "upload" as IconName },
        ]),
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  return (
    <>
      <DetailHeader
        back="/dashboard/databases"
        backLabel="Databases"
        title={
          <>
            <BrandChip name={ENGINE_BRAND[d.engine]} size={34} />
            {d.name}
            <Badge tone={d.mode === "managed" ? "violet" : "neutral"}>{d.mode === "managed" ? "Managed" : "External"}</Badge>
          </>
        }
        meta={
          <>
            <span className="flex items-center gap-1.5">
              <Dot tone={dbTone[d.status]} pulse={["creating", "checking", "removing"].includes(d.status)} /> {dbLabel[d.status]}
            </span>
            <span>
              {d.engine_label} {d.mode === "managed" ? d.version : ""}
            </span>
            <Link href={`/dashboard/servers/${d.server_id}`} className="hover:text-fg hover:underline">
              {d.server_name}
            </Link>
            <Mono>
              {d.host}:{d.port}
            </Mono>
          </>
        }
      />
      <div className="mt-5 border-b border-line px-4 sm:px-6">
        <nav className="no-scrollbar -mb-px flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition-colors",
                tab === t.id ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg",
              )}
            >
              <Icon name={t.icon} size={14} /> {t.label}
            </button>
          ))}
        </nav>
      </div>
      <Container className="space-y-6 pt-6">
        {d.status === "creating" && (
          <Callout tone="warn" icon="clock" title="Creating the database">
            <span className="text-muted">Pulling the image and starting it on {d.server_name}. This takes a minute the first time.</span>
          </Callout>
        )}
        {d.status === "checking" && (
          <Callout tone="warn" icon="clock" title="Testing the connection">
            <span className="text-muted">The agent on {d.server_name} is connecting to {d.host}:{d.port}.</span>
          </Callout>
        )}
        {d.status === "error" && d.error && (
          <Callout tone="err" icon="x-circle" title={d.mode === "managed" ? "Something went wrong" : "Couldn't connect"}>
            <span className="text-muted">{d.error}</span>
          </Callout>
        )}
        {d.status === "stopped" && (
          <Callout icon="pause" title="Stopped">
            <span className="text-muted">Start it from Settings to browse and query it.</span>
          </Callout>
        )}
        {tab === "overview" && <Overview d={d} ready={ready} />}
        {tab === "connect" && <Connect d={d} />}
        {tab === "query" && (ready ? <QueryTab d={d} /> : <NotReady />)}
        {tab === "users" && (ready ? <UsersTab d={d} /> : <NotReady />)}
        {tab === "keys" && (ready ? <KeysTab d={d} /> : <NotReady />)}
        {tab === "logins" && (ready ? <RedisLoginsTab d={d} /> : <NotReady />)}
        {tab === "transfer" && (ready ? <TransferTab d={d} /> : <NotReady />)}
        {tab === "settings" && <SettingsTab d={d} />}
      </Container>
    </>
  );
}

function NotReady() {
  return <p className="text-sm text-subtle">Available once the database is running.</p>;
}

function Loading({ label = "Asking the agent…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 p-4 text-sm text-subtle">
      <Icon name="refresh" size={13} className="animate-spin" /> {label}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

function Overview({ d, ready }: { d: DatabaseInstance; ready: boolean }) {
  const redis = d.engine === "redis";
  const stats = useDbRead<ResultSet>(d, "explore", { what: "stats" }, ready && !redis);
  const info = useDbRead<{ info: Record<string, string>; keys: number }>(d, "redis", { action: "info" }, ready && redis);
  const row = stats.data?.rows[0];
  const col = (name: string) => (row ? row[stats.data!.columns.indexOf(name)] : null);

  const items = redis
    ? [
        { label: "Version", value: info.data?.info.redis_version ?? "—" },
        { label: "Memory used", value: info.data?.info.used_memory_human ?? "—" },
        { label: "Clients", value: info.data?.info.connected_clients ?? "—" },
        { label: "Keys", value: info.data ? String(info.data.keys) : "—" },
        { label: "Uptime", value: info.data ? `${Math.round(Number(info.data.info.uptime_in_seconds ?? 0) / 3600)} h` : "—" },
        { label: "Persistence", value: info.data?.info.aof_enabled === "1" ? "Append-only file" : (info.data?.info.rdb_last_save_time ? "Snapshots" : "—") },
      ]
    : [
        { label: "Version", value: col("version")?.split(" on ")[0]?.split(",")[0] ?? "—" },
        { label: "Connections", value: row ? `${col("connections")} / ${col("max_connections")}` : "—" },
        { label: "Size", value: row ? formatBytes(Number(col("size"))) : "—" },
        { label: "Uptime", value: col("uptime") ?? "—" },
        { label: "Default database", value: <Mono>{d.default_database ?? "—"}</Mono> },
        { label: "Admin user", value: <Mono>{d.admin_user ?? "—"}</Mono> },
      ];

  return (
    <>
      <Card className="p-5 sm:p-6">
        {(stats.isLoading || info.isLoading) && ready ? <Loading /> : <InfoGrid className="lg:grid-cols-3" items={items} />}
        {(stats.error || info.error) && <p className="mt-3 text-sm text-err">{(stats.error ?? info.error)?.message}</p>}
      </Card>
      <MetricsSection d={d} />
      {!redis && <DatabasesList d={d} ready={ready} />}
      <Card className="p-5 sm:p-6">
        <InfoGrid
          className="lg:grid-cols-3"
          items={[
            { label: "Mode", value: d.mode === "managed" ? `Managed container vpdb-${d.name}` : "External (you run it)" },
            { label: "Reachable at", value: <Mono>{`${d.host}:${d.port}`}</Mono> },
            {
              label: "Network exposure",
              value:
                d.mode === "managed" ? (
                  <span className="text-ok">Private{d.local_port ? ` · 127.0.0.1:${d.local_port} on the server` : ""}</span>
                ) : (
                  "As configured on your side"
                ),
            },
            { label: "Created", value: `${timeAgo(d.created_at)} by ${d.created_by}` },
          ]}
        />
      </Card>
    </>
  );
}

function DatabasesList({ d, ready }: { d: DatabaseInstance; ready: boolean }) {
  const list = useDbRead<ResultSet>(d, "explore", { what: "databases" }, ready);
  const action = useDbAction(d.id);
  const [name, setName] = useState("");
  const [dropping, setDropping] = useState<string | null>(null);
  const valid = /^[a-z_][a-z0-9_]{0,62}$/.test(name);

  return (
    <section>
      <SectionTitle>Databases</SectionTitle>
      <Card className="overflow-hidden">
        {list.isLoading ? (
          <Loading />
        ) : list.error ? (
          <p className="p-4 text-sm text-err">{list.error.message}</p>
        ) : (
          (list.data?.rows ?? []).map((r) => (
            <div key={r[0]} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
              <Icon name="database" size={15} className="text-subtle" />
              <span className="flex-1 font-mono text-[13px]">{r[0]}</span>
              {d.engine === "postgres" && r[2] && <span className="text-xs text-subtle">owner {r[2]}</span>}
              <span className="w-20 text-right text-xs text-muted tabular-nums">{formatBytes(Number(r[1]))}</span>
              <button
                type="button"
                aria-label={`Drop ${r[0]}`}
                disabled={r[0] === d.default_database || r[0] === "postgres"}
                onClick={() => setDropping(r[0])}
                className="rounded p-1.5 text-subtle hover:bg-black/10 hover:text-err disabled:invisible"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))
        )}
        <form
          className="flex items-center gap-2 border-t border-line bg-bg-200 px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            action.mutate({ path: "databases", body: { name } }, { onSuccess: () => (setName(""), list.refetch()) });
          }}
        >
          <Input placeholder="new_database" value={name} onChange={(e) => setName(e.target.value.toLowerCase())} className="max-w-xs font-mono" />
          <Button type="submit" variant="secondary" size="sm" icon="plus" disabled={!valid || action.isPending}>
            {action.isPending ? "Creating…" : "Create database"}
          </Button>
          {action.error && <span className="text-xs text-err">{action.error.message}</span>}
        </form>
      </Card>
      <ConfirmDialog
        open={!!dropping}
        onClose={() => setDropping(null)}
        title={`Drop ${dropping}`}
        confirmText={dropping ?? ""}
        phrase="delete all of its data"
        action="Drop database"
        onConfirm={() => {
          const target = dropping;
          setDropping(null);
          if (target) action.mutate({ method: "DELETE", path: `databases/${target}` }, { onSuccess: () => list.refetch() });
        }}
      >
        Every table and row in {dropping} is deleted for good.
      </ConfirmDialog>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Connect                                                             */
/* ------------------------------------------------------------------ */

function Secret({ value, mono = true }: { value: string; mono?: boolean }) {
  const [shown, setShown] = useState(false);
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className={cn("min-w-0 truncate text-[13px]", mono && "font-mono", !shown && "tracking-widest text-subtle")}>{shown ? value : "••••••••••••"}</span>
      <button type="button" aria-label={shown ? "Hide" : "Show"} onClick={() => setShown((s) => !s)} className="rounded p-1 text-subtle hover:bg-black/10 hover:text-fg">
        <Icon name={shown ? "eye-off" : "eye"} size={13} />
      </button>
      <CopyButton value={value} />
    </span>
  );
}

function Connect({ d }: { d: DatabaseInstance }) {
  const [open, setOpen] = useState(false);
  const connection = useConnection(d.id, open);
  const { data: apps } = useApps();
  const action = useDbAction(d.id);
  const [appId, setAppId] = useState("");
  const [envKey, setEnvKey] = useState(d.engine === "redis" ? "REDIS_URL" : "DATABASE_URL");
  const candidates = (apps ?? []).filter((a) => d.mode === "external" || a.server_id === d.server_id);
  const attachedNames = new Map((apps ?? []).map((a) => [a.id, a.name]));

  return (
    <>
      <FormCard
        title="Use it in an app"
        description={
          d.engine === "redis"
            ? "Adds the Redis URL to the app's environment as a secret."
            : "Creates the app's own database and login (it can do anything in its database and nothing elsewhere), then adds the URL to the app's environment as a secret."
        }
        footer={action.error ? <span className="text-err">{action.error.message}</span> : action.isSuccess ? "Done. Redeploy the app to pick it up." : d.mode === "managed" ? "Apps reach it over the private network on this server." : null}
        action={
          <Button variant="primary" size="sm" disabled={!appId || action.isPending || d.status !== "running"} onClick={() => action.mutate({ path: "attach", body: { application_id: appId, env_key: envKey } }, { onSuccess: () => connection.refetch() })}>
            {action.isPending ? "Setting up…" : "Connect app"}
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="app">Application</Label>
            <Select id="app" value={appId} onChange={(e) => setAppId(e.target.value)}>
              <option value="">{candidates.length ? "Choose an app…" : "No apps on this server yet"}</option>
              {candidates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ek">Variable</Label>
            <Input id="ek" value={envKey} onChange={(e) => setEnvKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))} className="font-mono" />
          </div>
        </div>
      </FormCard>

      <section>
        <SectionTitle>Connection details</SectionTitle>
        {!open ? (
          <Card className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
            <Icon name="lock" className="text-subtle" />
            <p className="flex-1 text-sm text-muted">Logins and connection URLs include passwords. Showing them is recorded in the audit log.</p>
            <Button variant="secondary" size="sm" icon="eye" onClick={() => setOpen(true)}>
              Show connection details
            </Button>
          </Card>
        ) : connection.isLoading ? (
          <Card>
            <Loading label="Decrypting…" />
          </Card>
        ) : connection.error ? (
          <Callout tone="err" icon="x-circle">
            {connection.error.message}
          </Callout>
        ) : (
          <Card className="overflow-hidden">
            {connection.data!.logins.map((l) => (
              <div key={l.id ?? "admin"} className="grid gap-2 border-b border-line px-4 py-4 last:border-0 md:grid-cols-[200px_minmax(0,1fr)]">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[13px]">
                    {l.username ?? "(password only)"}
                    {l.access === "admin" ? <Badge tone="violet">admin</Badge> : <Badge>{l.access}</Badge>}
                    {l.status === "pending" && <Badge tone="warn">creating</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-subtle">
                    {l.database ? `database ${l.database}` : ""}
                    {l.application_id && attachedNames.get(l.application_id) && <> · used by {attachedNames.get(l.application_id)}</>}
                  </div>
                </div>
                <div className="min-w-0 space-y-1.5">
                  {l.password && (
                    <div className="flex items-center gap-2 text-xs text-subtle">
                      <span className="w-16 shrink-0">Password</span>
                      <Secret value={l.password} />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-subtle">
                    <span className="w-16 shrink-0">URL</span>
                    <Secret value={l.url} />
                  </div>
                </div>
              </div>
            ))}
            {connection.data!.local_url && (
              <div className="border-t border-line bg-bg-200 px-4 py-3 text-xs text-muted">
                <div className="mb-1">On the server itself (or through an SSH tunnel):</div>
                <Secret value={connection.data!.local_url} />
              </div>
            )}
          </Card>
        )}
        {d.mode === "managed" && (
          <p className="mt-2 text-xs text-subtle">
            Host <span className="font-mono">vpdb-{d.name}</span> works from apps deployed by VPSPilot on {d.server_name}; they share a private Docker network.
          </p>
        )}
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Query                                                               */
/* ------------------------------------------------------------------ */

function quoteIdent(engine: string, name: string) {
  return engine === "postgres" ? `"${name.replace(/"/g, '""')}"` : `\`${name.replace(/`/g, "``")}\``;
}

function QueryTab({ d }: { d: DatabaseInstance }) {
  const databases = useDbRead<ResultSet>(d, "explore", { what: "databases" });
  const [database, setDatabase] = useState(d.default_database ?? "");
  const tables = useDbRead<ResultSet>(d, "explore", { what: "tables", database }, !!database);
  const [table, setTable] = useState<{ schema: string; name: string } | null>(null);
  const columns = useDbRead<ResultSet>(d, "explore", { what: "columns", database, namespace: table?.schema, table: table?.name }, !!table);
  const [sql, setSql] = useState("");
  const [writes, setWrites] = useState(false);
  const [confirmWrites, setConfirmWrites] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ResultSet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (text = sql) => {
    if (!text.trim()) return;
    setRunning(true);
    setError(null);
    try {
      setResult(await runDbJob<ResultSet>(d.id, "query", { sql: text, database: database || undefined, readonly: !writes, max_rows: 500 }));
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Query failed");
    } finally {
      setRunning(false);
    }
  };

  const preview = (t: { schema: string; name: string }) => {
    const from = d.engine === "postgres" ? `${quoteIdent(d.engine, t.schema)}.${quoteIdent(d.engine, t.name)}` : quoteIdent(d.engine, t.name);
    const text = `SELECT * FROM ${from} LIMIT 100;`;
    setSql(text);
    setTable(t);
    void run(text);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Card className="h-fit overflow-hidden">
        <div className="border-b border-line p-3">
          <Select
            value={database}
            onChange={(e) => {
              setDatabase(e.target.value);
              setTable(null);
            }}
            aria-label="Database"
          >
            {(databases.data?.rows ?? (database ? [[database]] : [])).map((r) => (
              <option key={r[0]} value={r[0] ?? ""}>
                {r[0]}
              </option>
            ))}
          </Select>
        </div>
        <div className="thin-scrollbar max-h-[520px] overflow-y-auto py-1">
          {tables.isLoading ? (
            <Loading label="Loading tables…" />
          ) : tables.error ? (
            <p className="p-3 text-xs text-err">{tables.error.message}</p>
          ) : !tables.data?.rows.length ? (
            <p className="p-3 text-xs text-subtle">No tables yet.</p>
          ) : (
            tables.data.rows.map((r) => {
              const t = { schema: r[0] ?? "", name: r[1] ?? "" };
              const active = table?.name === t.name && table.schema === t.schema;
              return (
                <div key={`${t.schema}.${t.name}`}>
                  <button
                    type="button"
                    onClick={() => preview(t)}
                    className={cn("flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-black/[0.04]", active && "bg-black/[0.06]")}
                  >
                    <Icon name="table" size={13} className="shrink-0 text-subtle" />
                    <span className="min-w-0 flex-1 truncate font-mono">
                      {d.engine === "postgres" && t.schema !== "public" ? `${t.schema}.` : ""}
                      {t.name}
                    </span>
                    <span className="text-[11px] text-subtle tabular-nums">{Number(r[3]).toLocaleString()}</span>
                  </button>
                  {active && columns.data && (
                    <div className="pb-1 pl-8">
                      {columns.data.rows.map((c) => (
                        <div key={c[0]} className="flex gap-2 py-0.5 pr-3 font-mono text-[11px]">
                          <span className="truncate text-muted">{c[0]}</span>
                          <span className="ml-auto shrink-0 text-subtle">{c[1]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      <div className="min-w-0 space-y-3">
        <Card className="overflow-hidden">
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                void run();
              }
            }}
            spellCheck={false}
            placeholder={d.engine === "postgres" ? "SELECT * FROM users ORDER BY created_at DESC LIMIT 20;" : "SELECT * FROM users ORDER BY id DESC LIMIT 20;"}
            className="block h-44 w-full resize-y bg-bg p-4 font-mono text-[13px] leading-relaxed text-fg outline-none placeholder:text-subtle"
          />
          <div className="flex flex-wrap items-center gap-3 border-t border-line bg-bg-200 px-4 py-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={writes}
                onChange={(e) => (e.target.checked ? setConfirmWrites(true) : setWrites(false))}
                className="accent-[var(--color-accent)]"
              />
              <span className={writes ? "text-warn" : "text-muted"}>{writes ? "Writes allowed" : "Read-only"}</span>
            </label>
            <span className="text-xs text-subtle">Up to 500 rows · 15 s limit · ⌘/Ctrl + Enter</span>
            <Button variant="primary" size="sm" icon="play" className="ml-auto" disabled={running || !sql.trim()} onClick={() => run()}>
              {running ? "Running…" : "Run"}
            </Button>
          </div>
        </Card>
        {error && (
          <Callout tone="err" icon="x-circle">
            {error}
          </Callout>
        )}
        {result && <ResultGrid result={result} />}
      </div>

      <ConfirmDialog
        open={confirmWrites}
        onClose={() => setConfirmWrites(false)}
        danger={false}
        title="Allow writes"
        confirmText={d.name}
        action="Allow writes"
        onConfirm={() => {
          setWrites(true);
          setConfirmWrites(false);
        }}
      >
        Queries will be able to change and delete data in {d.name}. Every query is recorded in the audit log.
      </ConfirmDialog>
    </div>
  );
}

function ResultGrid({ result }: { result: ResultSet }) {
  if (!result.columns.length) {
    return (
      <Card className="flex items-center gap-2 p-4 text-sm text-muted">
        <Icon name="check-circle" className="text-ok" /> Done in {result.duration_ms} ms. No rows returned.
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-4 py-2 text-xs text-muted">
        {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
        {result.truncated && <span className="text-warn">· showing the first {result.rows.length}</span>}
        <span className="ml-auto">{result.duration_ms} ms</span>
      </div>
      <div className="thin-scrollbar max-h-[480px] overflow-auto">
        <table className="w-max min-w-full font-mono text-[12.5px]">
          <thead className="sticky top-0 bg-bg-200">
            <tr>
              {result.columns.map((c, i) => (
                <th key={i} className="border-b border-line px-3 py-2 text-left font-medium text-muted">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, i) => (
              <tr key={i} className="hover:bg-black/[0.02]">
                {row.map((cell, j) => (
                  <td key={j} className="max-w-[420px] truncate border-b border-line/60 px-3 py-1.5" title={cell ?? "NULL"}>
                    {cell === null ? <span className="text-subtle italic">NULL</span> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

function UsersTab({ d }: { d: DatabaseInstance }) {
  const users = useDbRead<ResultSet>(d, "explore", { what: "users" });
  const databases = useDbRead<ResultSet>(d, "explore", { what: "databases" });
  const connection = useConnection(d.id, true);
  const action = useDbAction(d.id);
  const [username, setUsername] = useState("");
  const [database, setDatabase] = useState(d.default_database ?? "");
  const [access, setAccess] = useState<"readwrite" | "readonly">("readwrite");
  const [dropping, setDropping] = useState<string | null>(null);
  const managed = useMemo(() => new Map((connection.data?.logins ?? []).filter((l) => l.id).map((l) => [l.username, l])), [connection.data]);
  const valid = /^[a-z_][a-z0-9_]{0,62}$/.test(username);
  const names = [...new Set((users.data?.rows ?? []).map((r) => r[0] ?? ""))];

  const refresh = () => {
    void users.refetch();
    void connection.refetch();
  };

  return (
    <>
      <section>
        <SectionTitle>Users</SectionTitle>
        <Card className="overflow-hidden">
          {users.isLoading ? (
            <Loading />
          ) : users.error ? (
            <p className="p-4 text-sm text-err">{users.error.message}</p>
          ) : (
            names.map((name) => {
              const login = managed.get(name);
              const isAdmin = name === d.admin_user;
              const system = d.engine !== "postgres" && ["root", "healthcheck", "mariadb.sys"].includes(name);
              return (
                <div key={name} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                  <Icon name="user" size={15} className="text-subtle" />
                  <span className="font-mono text-[13px]">{name}</span>
                  {isAdmin && <Badge tone="violet">admin</Badge>}
                  {login && <Badge>{login.access}</Badge>}
                  {login?.database && <span className="text-xs text-subtle">on {login.database}</span>}
                  <span className="ml-auto flex items-center gap-1">
                    {login && (
                      <Button variant="secondary" size="xs" icon="refresh" disabled={action.isPending} onClick={() => action.mutate({ path: `users/${login.id}/rotate` }, { onSuccess: refresh })}>
                        Rotate password
                      </Button>
                    )}
                    {!isAdmin && !system && (
                      <button type="button" aria-label={`Drop ${name}`} onClick={() => setDropping(name)} className="rounded p-1.5 text-subtle hover:bg-black/10 hover:text-err">
                        <Icon name="trash" size={14} />
                      </button>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </Card>
        <p className="mt-2 text-xs text-subtle">Passwords for users created here are stored encrypted and shown under Connect. Rotating changes the password in the database; update apps that use it.</p>
      </section>

      <FormCard
        title="New user"
        description="A login limited to one database. Read-only users can only run SELECT."
        footer={action.error ? <span className="text-err">{action.error.message}</span> : "A strong password is generated for you."}
        action={
          <Button
            variant="primary"
            size="sm"
            disabled={!valid || action.isPending}
            onClick={() => action.mutate({ path: "users", body: { username, database: database || undefined, access } }, { onSuccess: () => (setUsername(""), refresh()) })}
          >
            {action.isPending ? "Creating…" : "Create user"}
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="un">Username</Label>
            <Input id="un" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} className="font-mono" />
          </div>
          <div>
            <Label htmlFor="udb">Database</Label>
            <Select id="udb" value={database} onChange={(e) => setDatabase(e.target.value)}>
              {(databases.data?.rows ?? []).map((r) => (
                <option key={r[0]} value={r[0] ?? ""}>
                  {r[0]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="acc">Access</Label>
            <Select id="acc" value={access} onChange={(e) => setAccess(e.target.value as "readwrite" | "readonly")}>
              <option value="readwrite">Read and write</option>
              <option value="readonly">Read only</option>
            </Select>
          </div>
        </div>
      </FormCard>

      <ConfirmDialog
        open={!!dropping}
        onClose={() => setDropping(null)}
        title={`Drop user ${dropping}`}
        confirmText={dropping ?? ""}
        action="Drop user"
        onConfirm={() => {
          const target = dropping;
          setDropping(null);
          if (target) action.mutate({ method: "DELETE", path: `users/${target}` }, { onSuccess: refresh });
        }}
      >
        Apps using this login stop being able to connect.
      </ConfirmDialog>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Redis keys                                                          */
/* ------------------------------------------------------------------ */

type ScanReply = { cursor: string; keys: { key: string; type: string; ttl: number }[] };
type KeyValue = { key: string; type: string; ttl: number; value: unknown };

function KeysTab({ d }: { d: DatabaseInstance }) {
  const [pattern, setPattern] = useState("*");
  const [applied, setApplied] = useState("*");
  const first = useDbRead<ScanReply>(d, "redis", { action: "scan", pattern: applied, cursor: 0, count: 200 });
  const [more, setMore] = useState<{ keys: ScanReply["keys"]; cursor: string | null } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<KeyValue | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const keys = [...(first.data?.keys ?? []), ...(more?.keys ?? [])].filter((k) => !removed.has(k.key));
  const cursor = more ? more.cursor : first.data && first.data.cursor !== "0" ? first.data.cursor : null;
  const loading = first.isFetching || loadingMore;

  const scanFurther = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    setError(null);
    try {
      const reply = await runDbJob<ScanReply>(d.id, "redis", { action: "scan", pattern: applied, cursor: Number(cursor), count: 200 });
      setMore((m) => ({ keys: [...(m?.keys ?? []), ...reply.keys], cursor: reply.cursor === "0" ? null : reply.cursor }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoadingMore(false);
    }
  };

  const open = async (key: string) => {
    try {
      setSelected(await runDbJob<KeyValue>(d.id, "redis", { action: "get", key }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read the key");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setMore(null);
            setRemoved(new Set());
            if (pattern === applied) void first.refetch();
            else setApplied(pattern || "*");
          }}
        >
          <Input icon="search" placeholder="Pattern, e.g. session:*" value={pattern} onChange={(e) => setPattern(e.target.value)} className="flex-1 font-mono" />
          <Button type="submit" variant="secondary" size="md" disabled={loading}>
            Scan
          </Button>
        </form>
        {(error || first.error) && <p className="text-sm text-err">{error ?? first.error?.message}</p>}
        <Card className="overflow-hidden">
          {keys.length === 0 && !loading ? (
            <p className="p-4 text-sm text-subtle">No keys match.</p>
          ) : (
            keys.map((k) => (
              <button
                key={k.key}
                type="button"
                onClick={() => open(k.key)}
                className={cn("flex w-full items-center gap-3 border-b border-line px-4 py-2 text-left last:border-0 hover:bg-black/[0.03]", selected?.key === k.key && "bg-black/[0.05]")}
              >
                <Badge>{k.type}</Badge>
                <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{k.key}</span>
                <span className="text-[11px] text-subtle">{k.ttl < 0 ? "no expiry" : `${k.ttl}s`}</span>
              </button>
            ))
          )}
          {loading && <Loading label="Scanning…" />}
        </Card>
        {cursor && !loading && keys.length > 0 && (
          <Button variant="secondary" size="sm" onClick={scanFurther}>
            Scan further
          </Button>
        )}
        <p className="text-xs text-subtle">Uses SCAN, never KEYS, so browsing doesn&apos;t block Redis.</p>
      </div>
      <div>
        {selected ? (
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <Badge>{selected.type}</Badge>
              <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{selected.key}</span>
              <Button variant="danger" size="xs" icon="trash" onClick={() => setDeleting(selected.key)}>
                Delete
              </Button>
            </div>
            <pre className="thin-scrollbar max-h-[480px] overflow-auto p-4 font-mono text-[12.5px] whitespace-pre-wrap text-fg">
              {typeof selected.value === "string" ? selected.value : JSON.stringify(selected.value, null, 2)}
            </pre>
          </Card>
        ) : (
          <Card className="p-5 text-sm text-subtle">Pick a key to see its value.</Card>
        )}
      </div>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete key"
        confirmText={deleting ?? ""}
        action="Delete"
        onConfirm={async () => {
          const key = deleting;
          setDeleting(null);
          if (!key) return;
          try {
            await runDbJob(d.id, "redis", { action: "delete", key });
            setRemoved((r) => new Set(r).add(key));
            setSelected(null);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Delete failed");
          }
        }}
      >
        The key and its value are removed immediately.
      </ConfirmDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

function SettingsTab({ d }: { d: DatabaseInstance }) {
  const router = useRouter();
  const action = useDbAction(d.id);
  const remove = useRemoveDatabase();
  const [confirm, setConfirm] = useState(false);
  const [deleteData, setDeleteData] = useState(false);

  return (
    <>
      {d.mode === "external" && <TlsCard d={d} />}
      {d.mode === "managed" && (
        <FormCard
          title="Container"
          description={`vpdb-${d.name} on ${d.server_name}. It restarts automatically unless stopped here.`}
          footer={action.error ? <span className="text-err">{action.error.message}</span> : null}
          action={
            <div className="flex gap-2">
              {(["start", "restart", "stop"] as const).map((a) => (
                <Button key={a} variant="secondary" size="sm" icon={a === "stop" ? "stop" : a === "start" ? "play" : "refresh"} disabled={action.isPending} onClick={() => action.mutate({ path: "control", body: { action: a } })}>
                  {a[0].toUpperCase() + a.slice(1)}
                </Button>
              ))}
            </div>
          }
        />
      )}
      <FormCard
        danger
        title={d.mode === "managed" ? "Delete database" : "Disconnect database"}
        description={
          d.mode === "managed"
            ? "Removes the container. The data volume is kept unless you choose to delete it too."
            : "VPSPilot forgets this connection. The database itself isn't touched."
        }
        footer={remove.error ? <span className="text-err">{remove.error.message}</span> : null}
        action={
          <Button variant="danger" size="sm" onClick={() => setConfirm(true)}>
            {d.mode === "managed" ? "Delete" : "Disconnect"}
          </Button>
        }
      />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={d.mode === "managed" ? `Delete ${d.name}` : `Disconnect ${d.name}`}
        confirmText={d.name}
        phrase={deleteData ? "delete all data" : undefined}
        action={d.mode === "managed" ? "Delete" : "Disconnect"}
        onConfirm={() => {
          setConfirm(false);
          remove.mutate({ id: d.id, deleteData }, { onSuccess: () => router.push("/dashboard/databases") });
        }}
      >
        {d.mode === "managed" && (
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={deleteData} onChange={(e) => setDeleteData(e.target.checked)} className="accent-[var(--color-err)]" />
            Also delete the data volume (can&apos;t be undone)
          </label>
        )}
      </ConfirmDialog>
    </>
  );
}
