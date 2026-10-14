"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Avatar, Badge, Button, Dot, Input, Mono, type Tone } from "@/components/ui";
import type { App, Deployment, DeploymentStatus, EnvInput, EnvVar } from "@/lib/api/apps";
import type { ServerSummary } from "@/lib/api/servers";
import { formatDuration, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const deployTone: Record<DeploymentStatus, Tone> = {
  queued: "neutral",
  running: "warn",
  succeeded: "ok",
  failed: "err",
  canceled: "neutral",
};

export const deployLabel: Record<DeploymentStatus, string> = {
  queued: "Queued",
  running: "Building",
  succeeded: "Ready",
  failed: "Error",
  canceled: "Canceled",
};

export const triggerLabel = { create: "First deploy", manual: "Redeploy", rollback: "Rollback", push: "Git push" } as const;

export const shortSha = (sha: string | null | undefined) => (sha ? sha.slice(0, 7) : null);

/** owner/repo from an https Git URL, for compact display. */
export function repoName(url: string | null | undefined) {
  if (!url) return "";
  return url.replace(/^https:\/\/[^/]+\//, "").replace(/\.git$/, "");
}

export function sourceLabel(app: Pick<App, "source_type" | "repo_url" | "image">) {
  return app.source_type === "git" ? repoName(app.repo_url) : (app.image ?? "");
}

/** Where the app answers: the server's first address and the published port. */
export function appUrl(app: Pick<App, "server_id" | "host_port">, servers: ServerSummary[] | undefined) {
  const ip = servers?.find((s) => s.id === app.server_id)?.ip_addresses[0];
  return ip ? `http://${ip}:${app.host_port}` : null;
}

export function DeploymentStatusLabel({ status }: { status: DeploymentStatus }) {
  return (
    <span className="flex items-center gap-2">
      <Dot tone={deployTone[status]} pulse={status === "running" || status === "queued"} />
      {deployLabel[status]}
    </span>
  );
}

export function DeploymentRow({ d, showApp = true, serverName }: { d: Deployment; showApp?: boolean; serverName?: string }) {
  const ref = d.trigger === "rollback" ? "rollback" : d.requested_ref;
  return (
    <Link
      href={`/dashboard/deployments/${d.id}`}
      className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3.5 transition-colors last:border-0 hover:bg-white/[0.02] md:grid-cols-[minmax(160px,1.1fr)_minmax(120px,0.8fr)_minmax(200px,1.6fr)_auto]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Mono className="truncate text-fg">{d.id.slice(0, 10)}</Mono>
          {d.is_current && <Badge tone="blue">Current</Badge>}
        </div>
        <div className="mt-0.5 truncate text-xs text-subtle">
          {triggerLabel[d.trigger]}
          {showApp && d.app_name && <span> · {d.app_name}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end md:items-start">
        <span className="text-sm">
          <DeploymentStatusLabel status={d.status} />
        </span>
        <span className="mt-0.5 text-xs text-subtle">{d.status === "queued" ? "waiting" : formatDuration(d.created_at, d.finished_at)}</span>
      </div>
      <div className="col-span-2 min-w-0 md:col-span-1">
        <div className="flex items-center gap-1.5 text-[13px] text-fg">
          <Icon name={d.trigger === "rollback" ? "rollback" : d.commit_sha || !d.image_ref ? "git-branch" : "container"} size={14} className="shrink-0 text-subtle" />
          <span className="truncate">{ref ?? "—"}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-subtle">
          {d.commit_sha ? (
            <>
              <Icon name="git-commit" size={14} className="shrink-0" />
              <Mono className="text-[11.5px]">{shortSha(d.commit_sha)}</Mono>
              <span className="truncate">{d.commit_message}</span>
            </>
          ) : (
            <span className="truncate">{d.error ?? d.image_ref ?? ""}</span>
          )}
        </div>
      </div>
      <div className="col-span-2 flex min-w-0 items-center gap-2 text-xs text-subtle md:col-span-1 md:justify-end">
        <span className="truncate whitespace-nowrap">
          {timeAgo(d.created_at)} by {d.created_by.split("@")[0]}
        </span>
        <Avatar name={d.created_by} size={20} />
        {serverName && (
          <>
            <span className="hidden md:inline">·</span>
            <span className="hidden whitespace-nowrap md:inline">{serverName}</span>
          </>
        )}
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Environment variables editor                                        */
/* ------------------------------------------------------------------ */

export type EnvDraft = { id: number; key: string; value: string; secret: boolean; stored: boolean };

let nextId = 1;
export const draftFrom = (env: EnvVar[]): EnvDraft[] =>
  env.map((e) => ({ id: nextId++, key: e.key, value: e.value ?? "", secret: e.secret, stored: true }));

export const emptyDraft = (): EnvDraft => ({ id: nextId++, key: "", value: "", secret: false, stored: false });

const KEY_RE = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/;

/** Validation message for the draft, or null when it can be saved. */
export function envProblem(rows: EnvDraft[]): string | null {
  const seen = new Set<string>();
  for (const r of rows) {
    if (!r.key && !r.value) continue;
    if (!KEY_RE.test(r.key)) return `“${r.key || "(empty)"}” isn't a valid variable name`;
    if (r.key === "PORT") return "PORT is set by VPSPilot from the container port";
    if (seen.has(r.key)) return `${r.key} is listed twice`;
    seen.add(r.key);
    if (/[\r\n]/.test(r.value)) return `${r.key}: values must be a single line`;
    if (!r.value && !(r.secret && r.stored)) return `${r.key} needs a value`;
  }
  return null;
}

/** To API shape. Stored secrets left blank keep their saved value. */
export function envPayload(rows: EnvDraft[]): EnvInput[] {
  return rows
    .filter((r) => r.key || r.value)
    .map((r) => ({ key: r.key, secret: r.secret, value: r.secret && r.stored && !r.value ? null : r.value }));
}

/** Parse pasted .env text into rows (KEY=value, # comments, optional quotes). */
function parseDotenv(text: string): EnvDraft[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const [rawKey, ...rest] = line.replace(/^export\s+/, "").split("=");
      let value = rest.join("=").trim();
      if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
      const key = rawKey.trim();
      return { id: nextId++, key, value, secret: /SECRET|TOKEN|PASSWORD|KEY|DATABASE_URL|DSN/i.test(key), stored: false };
    });
}

export function EnvEditor({ rows, onChange }: { rows: EnvDraft[]; onChange: (rows: EnvDraft[]) => void }) {
  const [shown, setShown] = useState<Set<number>>(new Set());
  const update = (id: number, patch: Partial<EnvDraft>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-[13px] text-subtle">No variables yet. Paste a .env file into a name field to add many at once.</p>}
      {rows.map((r) => {
        // Saved values and secrets are masked until you reveal them; stored
        // secrets can't be revealed at all (the API never returns them).
        const masked = (r.stored || r.secret) && !shown.has(r.id);
        const revealable = !(r.secret && r.stored && !r.value);
        return (
          <div key={r.id} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto]">
            <Input
              aria-label="Name"
              placeholder="NAME"
              value={r.key}
              className="font-mono"
              onChange={(e) => update(r.id, { key: e.target.value.trim() })}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (!text.includes("=")) return;
                e.preventDefault();
                const parsed = parseDotenv(text);
                const keep = rows.filter((x) => x.id !== r.id || x.key || x.value);
                const byKey = new Map(keep.map((x) => [x.key, x]));
                for (const p of parsed) byKey.set(p.key, byKey.has(p.key) ? { ...byKey.get(p.key)!, value: p.value, secret: p.secret || byKey.get(p.key)!.secret } : p);
                onChange([...byKey.values()]);
              }}
            />
            <div className="order-3 col-span-2 flex gap-2 sm:order-none sm:col-span-1">
              <Input
                aria-label={`Value for ${r.key || "variable"}`}
                placeholder={r.secret && r.stored ? "Unchanged (encrypted)" : "value"}
                value={r.value}
                type={masked ? "password" : "text"}
                autoComplete="off"
                className="flex-1 font-mono"
                onChange={(e) => update(r.id, { value: e.target.value })}
              />
              {(r.stored || r.secret) && revealable && (
                <button
                  type="button"
                  aria-label={masked ? "Show value" : "Hide value"}
                  onClick={() =>
                    setShown((s) => {
                      const next = new Set(s);
                      if (next.has(r.id)) next.delete(r.id);
                      else next.add(r.id);
                      return next;
                    })
                  }
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-line-strong text-subtle hover:text-fg"
                >
                  <Icon name={masked ? "eye" : "eye-off"} size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-pressed={r.secret}
                title={r.secret ? "Secret: encrypted and never shown again" : "Mark as secret"}
                onClick={() => update(r.id, { secret: !r.secret })}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors",
                  r.secret ? "border-accent/50 bg-accent/15 text-accent-fg" : "border-line-strong text-subtle hover:text-fg",
                )}
              >
                <Icon name="lock" size={13} />
                <span className="hidden sm:inline">Secret</span>
              </button>
              <button
                type="button"
                aria-label={`Remove ${r.key || "variable"}`}
                onClick={() => onChange(rows.filter((x) => x.id !== r.id))}
                className="inline-flex size-10 items-center justify-center rounded-md border border-line-strong text-subtle hover:border-err/50 hover:text-err"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          </div>
        );
      })}
      <Button type="button" variant="secondary" size="sm" icon="plus" onClick={() => onChange([...rows, emptyDraft()])}>
        Add variable
      </Button>
    </div>
  );
}
