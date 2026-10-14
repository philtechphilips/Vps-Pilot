"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandChip } from "@/components/brand-chip";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { LoadMore } from "@/components/dashboard/load-more";
import { Icon } from "@/components/icons";
import { Badge, Button, ButtonLink, Callout, Card, Container, Dot, EmptyState, Input, Label, Mono, SectionTitle, Select, type Tone } from "@/components/ui";
import {
  type BackupRun,
  type Policy,
  useBackupAction,
  useBackupRuns,
  useBackupSettings,
  useBackupSummary,
  usePolicies,
  useRunBackup,
  useSetPolicy,
  waitForBackupJob,
} from "@/lib/api/backups";
import { ENGINE_BRAND } from "@/lib/api/databases";
import { formatBytes, formatDate, timeAgo } from "@/lib/format";

const statusTone: Record<BackupRun["status"], Tone> = { queued: "neutral", running: "warn", succeeded: "ok", failed: "err" };
const statusLabel: Record<BackupRun["status"], string> = { queued: "Queued", running: "Backing up", succeeded: "Completed", failed: "Failed" };

export function BackupsView() {
  const summary = useBackupSummary();
  const settings = useBackupSettings();
  const policies = usePolicies();
  const runs = useBackupRuns();
  const list = runs.data?.pages.flat() ?? [];
  const s = summary.data;

  return (
    <Container className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { k: "Backups kept", v: s ? String(s.count) : "–", sub: s ? formatBytes(s.size) + " total" : "" },
          { k: "Failed in 24 h", v: s ? String(s.failed_24h) : "–", sub: s?.failed_24h ? "see the list below" : "all good" },
          { k: "Restore-verified", v: s ? String(s.verified) : "–", sub: "restored into a throwaway database" },
          {
            k: "Off-host storage",
            v: settings.data?.storage_enabled ? "On" : "Off",
            sub: settings.data?.storage_enabled ? `${settings.data.bucket} · AES-256` : "only on the server · encrypted",
          },
        ].map((x) => (
          <Card key={x.k} className="p-4">
            <div className="text-[13px] text-muted">{x.k}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{x.v}</div>
            <div className="mt-0.5 truncate text-xs text-subtle">{x.sub}</div>
          </Card>
        ))}
      </div>

      {!settings.data?.storage_enabled && settings.data && (
        <Callout icon="info" title="Backups only live on the servers">
          <span className="text-muted">
            They&apos;re encrypted, but a lost server takes its backups with it.{" "}
            <Link href="/dashboard/settings#storage" className="text-fg underline underline-offset-2">
              Add S3-compatible storage
            </Link>{" "}
            (AWS S3, Cloudflare R2, Backblaze B2, MinIO…) to keep a copy elsewhere.
          </span>
        </Callout>
      )}

      <section>
        <SectionTitle>Schedules</SectionTitle>
        {policies.isLoading ? (
          <div className="skeleton h-28 rounded-xl" />
        ) : !policies.data?.length ? (
          <EmptyState
            icon="database"
            title="Nothing to back up yet"
            action={
              <ButtonLink href="/dashboard/databases/new" variant="primary" size="md" icon="plus">
                Add a database
              </ButtonLink>
            }
          >
            Backups cover the databases VPSPilot runs or connects to.
          </EmptyState>
        ) : (
          <Card className="overflow-hidden">
            {policies.data.map((p) => (
              <PolicyRow key={p.instance_id} p={p} />
            ))}
          </Card>
        )}
      </section>

      <section>
        <SectionTitle>Backups</SectionTitle>
        {runs.isLoading ? (
          <div className="skeleton h-40 rounded-xl" />
        ) : !list.length ? (
          <Card className="p-5 text-sm text-subtle">No backups yet. Turn on a schedule above or press Back up now.</Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-subtle">
                  <th className="px-4 py-2.5 font-normal">Database</th>
                  <th className="px-4 py-2.5 font-normal">Status</th>
                  <th className="px-4 py-2.5 font-normal">Created</th>
                  <th className="px-4 py-2.5 font-normal">Size</th>
                  <th className="px-4 py-2.5 font-normal">Checksum</th>
                  <th className="px-4 py-2.5 font-normal">Stored</th>
                  <th className="px-4 py-2.5 font-normal">Restore check</th>
                  <th className="w-56 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <RunRow key={r.id} r={r} />
                ))}
              </tbody>
            </table>
          </Card>
        )}
        {list.length > 0 && <LoadMore hasMore={!!runs.hasNextPage} loading={runs.isFetchingNextPage} onLoad={() => runs.fetchNextPage()} label="backups" />}
      </section>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-subtle">
        <Icon name="shield-check" size={14} className="mt-px shrink-0" />
        Every backup is encrypted with AES-256 on the server before it&apos;s written, with a key only VPSPilot holds (encrypted at rest). Older backups beyond each
        schedule&apos;s limit are deleted locally and off-host.
      </p>
    </Container>
  );
}

function PolicyRow({ p }: { p: Policy }) {
  const save = useSetPolicy();
  const run = useRunBackup();
  return (
    <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 last:border-0 lg:flex-row lg:items-center">
      <Link href={`/dashboard/databases/${p.instance_id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <BrandChip name={ENGINE_BRAND[p.engine]} size={28} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium hover:underline">{p.instance_name}</span>
          <span className="block truncate text-xs text-subtle">
            {p.engine === "redis" ? "Redis snapshot" : p.databases.join(", ") || "no database"}
            {p.enabled && p.next_run_at && <> · next {timeAgo(p.next_run_at).replace(" ago", "") === "just now" ? "now" : new Date(p.next_run_at).toLocaleString()}</>}
          </span>
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={p.enabled}
            onChange={(e) => save.mutate({ instance_id: p.instance_id, enabled: e.target.checked })}
            className="accent-[var(--color-accent)]"
          />
          Scheduled
        </label>
        <Select value={String(p.every_hours)} onChange={(e) => save.mutate({ instance_id: p.instance_id, every_hours: Number(e.target.value) })} className="w-36" aria-label="How often">
          {[1, 6, 12, 24, 72, 168].map((h) => (
            <option key={h} value={h}>
              {h === 1 ? "Every hour" : h < 24 ? `Every ${h} hours` : h === 24 ? "Daily" : h === 168 ? "Weekly" : `Every ${h / 24} days`}
            </option>
          ))}
        </Select>
        <Select value={String(p.keep)} onChange={(e) => save.mutate({ instance_id: p.instance_id, keep: Number(e.target.value) })} className="w-32" aria-label="Keep">
          {[3, 7, 14, 30, 90].map((n) => (
            <option key={n} value={n}>
              Keep {n}
            </option>
          ))}
        </Select>
        <Button variant="secondary" size="md" icon="archive" disabled={run.isPending || p.status !== "running"} onClick={() => run.mutate({ instance_id: p.instance_id })}>
          {run.isPending ? "Starting…" : "Back up now"}
        </Button>
      </div>
      {(run.error || save.error) && <p className="text-xs text-err">{(run.error ?? save.error)?.message}</p>}
    </div>
  );
}

function RunRow({ r }: { r: BackupRun }) {
  const action = useBackupAction();
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const done = r.status === "succeeded";
  const redis = r.engine === "redis";

  return (
    <>
      <tr className="border-b border-line align-top last:border-0 hover:bg-white/[0.02]">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            {r.engine && <BrandChip name={ENGINE_BRAND[r.engine]} size={22} />}
            <span>
              <span className="block font-mono text-[13px]">{redis ? r.instance_name : r.database}</span>
              <span className="block text-xs text-subtle">
                {r.instance_name} · {r.trigger}
              </span>
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="flex items-center gap-2" title={r.error ?? undefined}>
            <Dot tone={statusTone[r.status]} pulse={r.status === "running" || r.status === "queued"} /> {statusLabel[r.status]}
          </span>
          {r.error && <span className="mt-1 block max-w-[220px] truncate text-xs text-err">{r.error}</span>}
        </td>
        <td className="px-4 py-3 text-muted" title={formatDate(r.created_at)}>
          {timeAgo(r.created_at)}
        </td>
        <td className="px-4 py-3 font-mono text-[13px] text-muted">{r.size != null ? formatBytes(r.size) : "—"}</td>
        <td className="px-4 py-3">
          <span title={r.sha256 ?? undefined}>
            <Mono className="text-subtle">{r.sha256 ? `${r.sha256.slice(0, 12)}…` : "—"}</Mono>
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="flex flex-wrap gap-1">
            {r.local && <Badge>Server</Badge>}
            {r.remote && <Badge tone="violet">Off-host</Badge>}
          </span>
        </td>
        <td className="px-4 py-3 text-xs">
          {r.verify_status === "passed" ? (
            <span className="text-ok" title={r.verify_detail ?? undefined}>
              <Icon name="check-circle" size={13} className="mr-1 inline" />
              Passed {timeAgo(r.verified_at)}
            </span>
          ) : r.verify_status === "failed" ? (
            <span className="text-err" title={r.verify_detail ?? undefined}>
              Failed: {r.verify_detail}
            </span>
          ) : r.verify_status === "running" ? (
            <span className="text-warn">Verifying…</span>
          ) : (
            <span className="text-subtle">Not checked</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className="flex justify-end gap-1.5">
            <Button variant="secondary" size="xs" disabled={!done || action.isPending || r.verify_status === "running"} onClick={() => action.mutate({ run: r.id, action: "verify" })}>
              Verify
            </Button>
            {!redis && (
              <Button variant="secondary" size="xs" disabled={!done} onClick={() => setRestoring(true)}>
                Restore
              </Button>
            )}
            <button type="button" aria-label="Delete backup" onClick={() => setDeleting(true)} className="rounded p-1.5 text-subtle hover:bg-white/10 hover:text-err">
              <Icon name="trash" size={14} />
            </button>
          </span>
          {message && <span className="mt-1 block text-right text-xs text-muted">{message}</span>}
        </td>
      </tr>
      {restoring && (
        <RestoreDialog
          r={r}
          onClose={() => setRestoring(false)}
          onRestore={(mode, into) => {
            setRestoring(false);
            setMessage("Restoring…");
            action.mutate(
              { run: r.id, action: "restore", body: { mode, into } },
              {
                onSuccess: async (reply) => {
                  try {
                    if (!reply.job_id) return;
                    const result = await waitForBackupJob(reply.job_id);
                    setMessage(`Restored ${result.tables ?? 0} tables${into ? ` into ${into}` : ""}`);
                  } catch (e) {
                    setMessage(e instanceof Error ? e.message : "Restore failed");
                  }
                },
                onError: (e) => setMessage(e.message),
              },
            );
          }}
        />
      )}
      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Delete backup"
        confirmText={redis ? (r.instance_name ?? "redis") : r.database}
        action="Delete"
        onConfirm={() => {
          setDeleting(false);
          action.mutate({ run: r.id, action: "delete" });
        }}
      >
        The encrypted file is deleted from the server{r.remote ? " and from off-host storage" : ""}.
      </ConfirmDialog>
    </>
  );
}

function RestoreDialog({ r, onClose, onRestore }: { r: BackupRun; onClose: () => void; onRestore: (mode: "replace" | "new", into?: string) => void }) {
  const [mode, setMode] = useState<"new" | "replace">("new");
  const [into, setInto] = useState(`${r.database}_restored`);
  const [confirm, setConfirm] = useState("");
  const valid = mode === "new" ? /^[a-z_][a-z0-9_]{0,62}$/.test(into) && into !== r.database : confirm === r.database;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Restore backup" onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-[500px] animate-fade-up overflow-hidden rounded-t-xl border border-line-strong bg-bg-100 shadow-2xl sm:rounded-xl">
        <div className="space-y-4 p-6">
          <h2 className="text-xl font-semibold tracking-tight">Restore {r.database}</h2>
          <p className="text-sm text-muted">
            From the backup taken {timeAgo(r.created_at)} ({r.size != null ? formatBytes(r.size) : "?"}). The checksum is verified before anything is restored.
          </p>
          <div className="space-y-2">
            {(
              [
                ["new", "Into a new database", "Leaves the current data alone, so you can compare or copy what you need."],
                ["replace", "Over the current database", "Replaces its tables with the backup. Changes since the backup are lost."],
              ] as const
            ).map(([value, title, desc]) => (
              <label key={value} className={`flex cursor-pointer gap-3 rounded-md border p-3 ${mode === value ? "border-accent/60 bg-accent/10" : "border-line"}`}>
                <input type="radio" name="restore-mode" checked={mode === value} onChange={() => setMode(value)} className="mt-1 accent-[var(--color-accent)]" />
                <span>
                  <span className="block text-sm">{title}</span>
                  <span className="block text-xs text-subtle">{desc}</span>
                </span>
              </label>
            ))}
          </div>
          {mode === "new" ? (
            <div>
              <Label htmlFor="into">New database name</Label>
              <Input id="into" value={into} onChange={(e) => setInto(e.target.value.toLowerCase())} className="font-mono" />
            </div>
          ) : (
            <label className="block text-[13px] text-muted">
              Type <span className="font-mono text-fg">{r.database}</span> to confirm:
              <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-2 font-mono" />
            </label>
          )}
        </div>
        <div className="flex justify-between gap-2 border-t border-line bg-bg-200 px-6 py-4">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={mode === "replace" ? "danger" : "primary"} size="md" disabled={!valid} onClick={() => onRestore(mode, mode === "new" ? into : undefined)}>
            Restore
          </Button>
        </div>
      </div>
    </div>
  );
}
