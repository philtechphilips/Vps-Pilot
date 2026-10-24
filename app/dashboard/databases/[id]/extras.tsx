"use client";

import { useRef, useState } from "react";
import { AreaChart } from "@/components/charts";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ChartCard } from "@/components/dashboard/detail";
import { Icon } from "@/components/icons";
import { Badge, Button, Callout, Card, FormCard, Input, Label, SectionTitle, Select } from "@/components/ui";
import { ApiError, refreshSession } from "@/lib/api/client";
import {
  type DatabaseInstance,
  type ResultSet,
  type TlsMode,
  useConnection,
  useDbAction,
  useDbMetrics,
  useDbRead,
  waitForJob,
} from "@/lib/api/databases";
import { formatBytes } from "@/lib/format";
import { useAuthStore } from "@/lib/stores/auth-store";

/* ------------------------------------------------------------------ */
/* Metrics history                                                     */
/* ------------------------------------------------------------------ */

const RANGES = [
  { hours: 6, label: "6 hours" },
  { hours: 24, label: "24 hours" },
  { hours: 24 * 7, label: "7 days" },
];

export function MetricsSection({ d }: { d: DatabaseInstance }) {
  const [hours, setHours] = useState(24);
  const metrics = useDbMetrics(d.id, hours);
  const points = metrics.data ?? [];
  const latest = points[points.length - 1];
  const labels = points.map((p) =>
    new Date(p.ts).toLocaleString(undefined, hours > 24 ? { weekday: "short", hour: "2-digit" } : { hour: "2-digit", minute: "2-digit" }),
  );
  const redis = d.engine === "redis";
  const mb = (v: number | null) => +((v ?? 0) / 1024 / 1024).toFixed(1);

  return (
    <section>
      <SectionTitle
        action={
          <Select aria-label="Range" value={hours} onChange={(e) => setHours(Number(e.target.value))} className="h-8 w-32 text-xs">
            {RANGES.map((r) => (
              <option key={r.hours} value={r.hours}>
                {r.label}
              </option>
            ))}
          </Select>
        }
      >
        History
      </SectionTitle>
      {metrics.isLoading ? (
        <div className="skeleton h-48 rounded-xl" />
      ) : points.length < 2 ? (
        <Card className="p-5 text-sm text-muted">
          Samples are taken every 5 minutes while the database runs and its server is online. {points.length ? "One so far; " : ""}Charts appear after the second.
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Connections"
            value={latest?.connections ?? "—"}
            sub={latest?.max_connections ? `of ${latest.max_connections} allowed` : undefined}
          >
            <AreaChart series={[{ name: "Connections", data: points.map((p) => p.connections ?? 0), color: "blue" }]} labels={labels} unit="" height={140} />
          </ChartCard>
          {redis ? (
            <>
              <ChartCard title="Memory" value={latest?.memory_bytes != null ? formatBytes(latest.memory_bytes) : "—"} sub={latest?.keys != null ? `${latest.keys} keys` : undefined}>
                <AreaChart series={[{ name: "Memory", data: points.map((p) => mb(p.memory_bytes)), color: "violet" }]} labels={labels} unit="MB" height={140} />
              </ChartCard>
              <ChartCard title="Operations" value={latest?.ops_per_sec != null ? `${latest.ops_per_sec}/s` : "—"}>
                <AreaChart series={[{ name: "Ops/s", data: points.map((p) => p.ops_per_sec ?? 0), color: "teal" }]} labels={labels} unit="" height={140} />
              </ChartCard>
            </>
          ) : (
            <ChartCard title="Size on disk" value={latest?.size_bytes != null ? formatBytes(latest.size_bytes) : "—"} sub="all databases">
              <AreaChart series={[{ name: "Size", data: points.map((p) => mb(p.size_bytes)), color: "violet" }]} labels={labels} unit="MB" height={140} />
            </ChartCard>
          )}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Import & export                                                     */
/* ------------------------------------------------------------------ */

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = (token: string | null) =>
    fetch(`/api/v1${path}`, { ...init, credentials: "same-origin", headers: { ...(init.headers ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  let response = await send(useAuthStore.getState().accessToken);
  if (response.status === 401 && (await refreshSession())) response = await send(useAuthStore.getState().accessToken);
  if (!response.ok) {
    const detail = await response.json().then((b) => b?.detail, () => null);
    throw new ApiError(response.status, typeof detail === "string" ? detail : `Request failed (${response.status})`);
  }
  return response;
}

/** POST the file as the raw body, reporting upload progress (0-1). */
function uploadFile(path: string, file: File, onProgress: (p: number) => void): Promise<{ job_id: string }> {
  const attempt = (token: string | null) =>
    new Promise<{ status: number; body: unknown }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/v1${path}`);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
      xhr.onload = () => {
        let body: unknown = null;
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          body = null;
        }
        resolve({ status: xhr.status, body });
      };
      xhr.onerror = () => reject(new ApiError(0, "The upload was interrupted"));
      xhr.send(file);
    });
  return (async () => {
    let reply = await attempt(useAuthStore.getState().accessToken);
    if (reply.status === 401 && (await refreshSession())) reply = await attempt(useAuthStore.getState().accessToken);
    if (reply.status !== 202) {
      const detail = (reply.body as { detail?: unknown } | null)?.detail;
      throw new ApiError(reply.status, typeof detail === "string" ? detail : `Upload failed (${reply.status})`);
    }
    return reply.body as { job_id: string };
  })();
}

function DatabasePicker({ d, value, onChange, id }: { d: DatabaseInstance; value: string; onChange: (v: string) => void; id: string }) {
  const list = useDbRead<ResultSet>(d, "explore", { what: "databases" });
  const names = (list.data?.rows ?? []).map((r) => r[0] ?? "").filter(Boolean);
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={list.isLoading}>
      {!names.includes(value) && <option value={value}>{value || "Loading…"}</option>}
      {names.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </Select>
  );
}

type Step = { state: "idle" | "working" | "done" | "error"; message?: string };

export function TransferTab({ d }: { d: DatabaseInstance }) {
  const fallback = d.default_database ?? (d.engine === "postgres" ? "postgres" : "");
  const [exportDb, setExportDb] = useState(fallback);
  const [importDb, setImportDb] = useState(fallback);
  const [exporting, setExporting] = useState<Step>({ state: "idle" });
  const [importing, setImporting] = useState<Step>({ state: "idle" });
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [confirm, setConfirm] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const runExport = async () => {
    setExporting({ state: "working", message: "Dumping on the server…" });
    try {
      const { job_id } = await runDbJobQueue(d.id, "export", { database: exportDb });
      const result = await waitForJob(d.id, job_id, 3 * 3600_000);
      setExporting({ state: "working", message: "Downloading…" });
      const response = await authedFetch(`/databases/${d.id}/exports/${job_id}`);
      const blob = await response.blob();
      const name = /filename="([^"]+)"/.exec(response.headers.get("content-disposition") ?? "")?.[1] ?? `${exportDb}.sql.gz`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      setExporting({ state: "done", message: `${name} · ${formatBytes(Number(result.size ?? blob.size))}` });
    } catch (error) {
      setExporting({ state: "error", message: (error as Error).message });
    }
  };

  const runImport = async () => {
    if (!file) return;
    setConfirm(false);
    setImporting({ state: "working", message: "Uploading…" });
    setProgress(0);
    try {
      const { job_id } = await uploadFile(`/databases/${d.id}/import?database=${encodeURIComponent(importDb)}`, file, setProgress);
      setImporting({ state: "working", message: "Importing on the server…" });
      const result = await waitForJob(d.id, job_id, 3 * 3600_000);
      setImporting({ state: "done", message: result.tables != null ? `${importDb} now has ${result.tables} tables.` : "Imported." });
      setFile(null);
      if (input.current) input.current.value = "";
    } catch (error) {
      setImporting({ state: "error", message: (error as Error).message });
    }
  };

  const status = (step: Step) =>
    step.state === "error" ? (
      <span className="text-err">{step.message}</span>
    ) : step.state === "done" ? (
      <span className="text-ok">{step.message}</span>
    ) : step.state === "working" ? (
      <span className="flex items-center gap-2">
        <span className="size-3 animate-spin rounded-full border-2 border-black/20 border-t-black/70" /> {step.message}
      </span>
    ) : null;

  return (
    <>
      <FormCard
        title="Export"
        description="A plain SQL dump of one database (gzip), made on the server and downloaded here. It works with psql or mysql anywhere. Exports pass through VPSPilot encrypted and are kept for a day."
        footer={status(exporting) ?? "Large databases can take a while; you can keep using the dashboard."}
        action={
          <Button variant="primary" size="sm" icon="download" disabled={!exportDb || exporting.state === "working"} onClick={() => void runExport()}>
            Export
          </Button>
        }
      >
        <div className="max-w-xs">
          <Label htmlFor="exdb">Database</Label>
          <DatabasePicker d={d} id="exdb" value={exportDb} onChange={setExportDb} />
        </div>
      </FormCard>

      <FormCard
        title="Import"
        description={
          d.engine === "postgres"
            ? "Run a .sql or .sql.gz file, or restore a pg_dump archive, into a database. It runs as one transaction: if any statement fails, nothing is changed."
            : "Run a .sql or .sql.gz file into a database. Statements run in order; if one fails, the ones before it stay applied."
        }
        footer={
          importing.state === "working" && importing.message === "Uploading…" ? (
            <span className="flex items-center gap-3">
              Uploading {Math.round(progress * 100)}%
              <span className="h-1.5 w-40 overflow-hidden rounded-full bg-black/10">
                <span className="block h-full bg-accent" style={{ width: `${progress * 100}%` }} />
              </span>
            </span>
          ) : (
            (status(importing) ?? "Up to 1 GB.")
          )
        }
        action={
          <Button variant="primary" size="sm" icon="upload" disabled={!file || !importDb || importing.state === "working"} onClick={() => setConfirm(true)}>
            Import
          </Button>
        }
      >
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="imdb">Into database</Label>
            <DatabasePicker d={d} id="imdb" value={importDb} onChange={setImportDb} />
          </div>
          <div>
            <Label htmlFor="imfile">File</Label>
            <input
              ref={input}
              id="imfile"
              type="file"
              accept={d.engine === "postgres" ? ".sql,.gz,.dump,.backup" : ".sql,.gz"}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block h-10 w-full cursor-pointer rounded-md border border-line bg-bg px-3 py-2 text-[13px] text-muted file:mr-3 file:rounded file:border-0 file:bg-black/10 file:px-2 file:py-0.5 file:text-fg"
            />
          </div>
        </div>
      </FormCard>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Import into ${importDb}`}
        confirmText={importDb}
        action="Import"
        onConfirm={() => void runImport()}
      >
        {file?.name} ({formatBytes(file?.size ?? 0)}) runs against {importDb}. Statements like DROP TABLE in the file are applied too.
      </ConfirmDialog>
    </>
  );
}

async function runDbJobQueue(instanceId: string, path: string, body: unknown): Promise<{ job_id: string }> {
  const response = await authedFetch(`/databases/${instanceId}/${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  return response.json();
}

/* ------------------------------------------------------------------ */
/* External TLS                                                        */
/* ------------------------------------------------------------------ */

export const TLS_OPTIONS: { value: Exclude<TlsMode, "prefer">; label: string; hint: string }[] = [
  { value: "verify", label: "Verify certificate", hint: "Encrypted, and the certificate must match the host (system CAs, or the CA below)." },
  { value: "require", label: "Encrypt, don't verify", hint: "Encrypted, but any certificate is accepted (self-signed)." },
  { value: "disable", label: "No TLS", hint: "Only for databases on the server itself or a private network." },
];

export const CA_PATTERN = /^(-----BEGIN CERTIFICATE-----\r?\n[A-Za-z0-9+/=\r\n]+-----END CERTIFICATE-----\s*)+$/;

export function TlsCard({ d }: { d: DatabaseInstance }) {
  const action = useDbAction(d.id);
  const [mode, setMode] = useState<Exclude<TlsMode, "prefer">>(d.tls_mode && d.tls_mode !== "prefer" ? d.tls_mode : "verify");
  const [ca, setCa] = useState("");
  const [clearCa, setClearCa] = useState(false);
  const caValid = !ca.trim() || CA_PATTERN.test(ca.trim());

  return (
    <FormCard
      title="Connection security"
      description={`How the agent on ${d.server_name ?? "the server"} reaches ${d.host}:${d.port}. Saving checks the connection again.`}
      footer={
        action.error ? (
          <span className="text-err">{action.error.message}</span>
        ) : action.isSuccess ? (
          d.status === "error" ? (
            <span className="text-err">{d.error}</span>
          ) : (
            <span className="text-ok">Connected with these settings.</span>
          )
        ) : d.tls_mode === null || d.tls_mode === "prefer" ? (
          "Currently: the client default (TLS if the server offers it, not verified)."
        ) : (
          <span>
            Currently: {TLS_OPTIONS.find((o) => o.value === d.tls_mode)?.label}
            {d.has_ca ? " against a custom CA" : ""}
          </span>
        )
      }
      action={
        <Button
          variant="primary"
          size="sm"
          disabled={!caValid || action.isPending}
          onClick={() => action.mutate({ method: "PUT", path: "tls", body: { tls_mode: mode, ca: clearCa ? "" : ca.trim() || null } })}
        >
          {action.isPending ? "Checking…" : "Save"}
        </Button>
      }
    >
      <TlsFields mode={mode} onMode={setMode} ca={ca} onCa={setCa} />
      {d.has_ca && mode === "verify" && !ca && (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={clearCa} onChange={(e) => setClearCa(e.target.checked)} className="accent-[var(--color-accent)]" />
          Remove the saved CA and use the system ones
        </label>
      )}
    </FormCard>
  );
}

export function TlsFields({ mode, onMode, ca, onCa }: { mode: Exclude<TlsMode, "prefer">; onMode: (m: Exclude<TlsMode, "prefer">) => void; ca: string; onCa: (v: string) => void }) {
  const caValid = !ca.trim() || CA_PATTERN.test(ca.trim());
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {TLS_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={mode === o.value}
            onClick={() => onMode(o.value)}
            className={`rounded-md border px-3 py-2.5 text-left transition-colors ${mode === o.value ? "border-accent bg-accent/10" : "border-line hover:border-line-strong"}`}
          >
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Icon name={o.value === "disable" ? "eye" : o.value === "verify" ? "shield-check" : "lock"} size={13} /> {o.label}
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-subtle">{o.hint}</span>
          </button>
        ))}
      </div>
      {mode === "verify" && (
        <div>
          <Label htmlFor="ca" hint="optional, PEM">
            CA certificate
          </Label>
          <textarea
            id="ca"
            value={ca}
            onChange={(e) => onCa(e.target.value)}
            rows={4}
            spellCheck={false}
            placeholder={"-----BEGIN CERTIFICATE-----\n… (e.g. your provider's CA bundle; leave empty for public CAs)"}
            className="w-full rounded-md border border-line bg-bg px-3 py-2 font-mono text-[12px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
          />
          {!caValid && <p className="mt-1 text-xs text-err">Paste one or more PEM certificates (-----BEGIN CERTIFICATE-----).</p>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Redis logins (ACL)                                                  */
/* ------------------------------------------------------------------ */

type AclUser = { name: string; enabled: boolean; keys: string[]; rules: string };

export function RedisLoginsTab({ d }: { d: DatabaseInstance }) {
  const acl = useDbRead<{ users: AclUser[]; persisted: boolean }>(d, "redis", { action: "acl_list" });
  const connection = useConnection(d.id, true);
  const action = useDbAction(d.id);
  const [username, setUsername] = useState("");
  const [access, setAccess] = useState<"readwrite" | "readonly">("readwrite");
  const [pattern, setPattern] = useState("");
  const [dropping, setDropping] = useState<string | null>(null);
  const valid = /^[a-z_][a-z0-9_]{0,62}$/.test(username) && username !== "default";
  const patternValid = !pattern || /^[A-Za-z0-9_.:*{}[\]-]{1,63}$/.test(pattern);
  const logins = new Map((connection.data?.logins ?? []).filter((l) => l.id).map((l) => [l.username, l]));

  const refresh = () => {
    void acl.refetch();
    void connection.refetch();
  };

  return (
    <>
      <section>
        <SectionTitle>Logins</SectionTitle>
        <Card className="overflow-hidden">
          {acl.isLoading ? (
            <div className="skeleton m-4 h-16 rounded-md" />
          ) : acl.error ? (
            <p className="p-4 text-sm text-err">{acl.error.message}</p>
          ) : (
            (acl.data?.users ?? []).map((u) => {
              const login = logins.get(u.name);
              return (
                <div key={u.name} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                  <Icon name="user" size={15} className="text-subtle" />
                  <span className="font-mono text-[13px]">{u.name}</span>
                  {u.name === "default" && <Badge tone="violet">admin</Badge>}
                  {login && <Badge>{login.access === "readonly" ? "read only" : "read & write"}</Badge>}
                  {!u.enabled && <Badge tone="neutral">off</Badge>}
                  {u.name !== "default" && <span className="font-mono text-xs text-subtle">keys {u.keys.join(" ") || "none"}</span>}
                  <span className="ml-auto flex items-center gap-1">
                    {login && (
                      <Button variant="secondary" size="xs" icon="refresh" disabled={action.isPending} onClick={() => action.mutate({ path: `users/${login.id}/rotate` }, { onSuccess: refresh })}>
                        Rotate password
                      </Button>
                    )}
                    {u.name !== "default" && (
                      <button type="button" aria-label={`Delete ${u.name}`} onClick={() => setDropping(u.name)} className="rounded p-1.5 text-subtle hover:bg-black/10 hover:text-err">
                        <Icon name="trash" size={14} />
                      </button>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </Card>
        <p className="mt-2 text-xs text-subtle">
          {acl.data?.persisted === false
            ? "This Redis is external: logins created here last until it restarts unless its own config saves ACLs (ACL SAVE)."
            : "Logins are kept in the instance's config as password hashes, so they survive restarts. Passwords are shown under Connect."}
        </p>
      </section>

      <FormCard
        title="New login"
        description="Its own password and limited commands: no FLUSHALL, CONFIG, KEYS or other dangerous commands, and only the keys you allow."
        footer={action.error ? <span className="text-err">{action.error.message}</span> : "A strong password is generated for you."}
        action={
          <Button
            variant="primary"
            size="sm"
            disabled={!valid || !patternValid || action.isPending}
            onClick={() => action.mutate({ path: "users", body: { username, access, key_pattern: pattern || undefined } }, { onSuccess: () => (setUsername(""), setPattern(""), refresh()) })}
          >
            {action.isPending ? "Creating…" : "Create login"}
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="rln">Username</Label>
            <Input id="rln" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} className="font-mono" />
          </div>
          <div>
            <Label htmlFor="rla">Access</Label>
            <Select id="rla" value={access} onChange={(e) => setAccess(e.target.value as "readwrite" | "readonly")}>
              <option value="readwrite">Read and write</option>
              <option value="readonly">Read only</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="rlp" hint="optional">
              Keys
            </Label>
            <Input id="rlp" placeholder="all keys, or e.g. cache:*" value={pattern} onChange={(e) => setPattern(e.target.value)} className="font-mono" />
          </div>
        </div>
        {d.mode === "external" && (
          <div className="mt-4">
            <Callout tone="warn" icon="alert">
              VPSPilot doesn&apos;t control this Redis&apos;s config, so new logins aren&apos;t saved across its restarts.
            </Callout>
          </div>
        )}
      </FormCard>

      <ConfirmDialog
        open={!!dropping}
        onClose={() => setDropping(null)}
        title={`Delete login ${dropping}`}
        confirmText={dropping ?? ""}
        action="Delete login"
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

