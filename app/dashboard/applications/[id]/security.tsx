"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { Badge, Button, Callout, Card, SectionTitle, type Tone } from "@/components/ui";
import { type Finding, type Severity, useAppSecurity, useAutoRebuild, useIgnoreFinding, useScanApp } from "@/lib/api/security";
import { timeAgo } from "@/lib/format";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";

const ORDER: Severity[] = ["critical", "high", "medium", "low", "unknown"];
const TONE: Record<Severity, Tone> = { critical: "err", high: "err", medium: "warn", low: "neutral", unknown: "neutral" };
const GROUPS_SHOWN = 8;

/** Rough version order (numbers as numbers), to pick the release that fixes every advisory. */
function newer(a: string, b: string) {
  const parts = (v: string) => v.replace(/^v/, "").split(/[^0-9A-Za-z]+/).map((p) => (/^\d+$/.test(p) ? Number(p) : p));
  const x = parts(a);
  const y = parts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] === y[i]) continue;
    if (x[i] === undefined) return b;
    if (y[i] === undefined) return a;
    return typeof x[i] === "number" && typeof y[i] === "number" ? ((x[i] as number) > (y[i] as number) ? a : b) : String(x[i]) > String(y[i]) ? a : b;
  }
  return a;
}

type Group = { key: string; package: string; version: string; ecosystem: string; worst: Severity; fixed: string | null; items: Finding[] };

/** Advisories for the same package and version are one row: fix the package once. */
function groupByPackage(findings: Finding[]): Group[] {
  const groups = new Map<string, Group>();
  for (const f of findings) {
    const key = `${f.ecosystem}:${f.package}:${f.version}`;
    const g = groups.get(key) ?? { key, package: f.package ?? "", version: f.version ?? "", ecosystem: f.ecosystem ?? "", worst: f.severity, fixed: null, items: [] };
    g.items.push(f);
    if (ORDER.indexOf(f.severity) < ORDER.indexOf(g.worst)) g.worst = f.severity;
    if (f.fixed) g.fixed = g.fixed ? newer(g.fixed, f.fixed) : f.fixed;
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => ORDER.indexOf(a.worst) - ORDER.indexOf(b.worst) || b.items.length - a.items.length);
}

function PackageRow({ group, admin }: { group: Group; admin: boolean }) {
  const [open, setOpen] = useState(false);
  const ignore = useIgnoreFinding();
  const ignored = group.items.every((f) => f.ignored_at);
  return (
    <div className={cn("border-b border-line last:border-0", ignored && "opacity-60")}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ink/[0.02]">
        <Icon name="chevron-right" size={14} className={cn("shrink-0 text-subtle transition-transform", open && "rotate-90")} />
        <span className="min-w-0 flex-1">
          <span className="font-mono text-[12.5px] text-fg">
            {group.package} <span className="text-muted">{group.version}</span>
          </span>
          <span className="block text-xs text-subtle">
            {group.items.length} {group.items.length === 1 ? "advisory" : "advisories"}
            {group.fixed ? (
              <>
                {" "}· fixed in <span className="font-mono text-fg">{group.fixed}</span>
              </>
            ) : (
              " · no fixed release yet"
            )}
          </span>
        </span>
        {ignored && <Badge>Ignored</Badge>}
        <Badge tone={TONE[group.worst]}>{group.worst}</Badge>
      </button>
      {open && (
        <div className="space-y-2 px-4 pb-3 pl-11">
          {group.items.map((f) => (
            <div key={f.id} className={cn("flex items-start gap-3 text-[13px]", f.ignored_at && "opacity-60")}>
              <div className="min-w-0 flex-1">
                <p className="text-fg">{f.title}</p>
                <p className="text-xs text-subtle">
                  {f.advisory && (
                    <a href={`https://osv.dev/vulnerability/${encodeURIComponent(f.advisory)}`} target="_blank" rel="noopener noreferrer" className="font-mono text-accent hover:underline">
                      {f.advisory}
                    </a>
                  )}
                  {f.fixed && <> · fixed in {f.fixed}</>} · {f.severity} · seen {timeAgo(f.first_seen_at)}
                  {f.ignored_by && <> · ignored by {f.ignored_by}</>}
                </p>
              </div>
              {admin && (
                <Button variant="ghost" size="xs" disabled={ignore.isPending} onClick={() => ignore.mutate({ id: f.id, ignored: !f.ignored_at })}>
                  {f.ignored_at ? "Count again" : "Ignore"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PackageList({ title, hint, findings, admin }: { title: string; hint?: string; findings: Finding[]; admin: boolean }) {
  const [all, setAll] = useState(false);
  if (findings.length === 0) return null;
  const groups = groupByPackage(findings);
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-fg">
        {title} <span className="font-normal text-subtle">· {groups.length}</span>
      </p>
      {hint && <p className="mb-2 text-xs text-subtle">{hint}</p>}
      <Card className="overflow-hidden">
        {(all ? groups : groups.slice(0, GROUPS_SHOWN)).map((g) => (
          <PackageRow key={g.key} group={g} admin={admin} />
        ))}
        {groups.length > GROUPS_SHOWN && (
          <button type="button" onClick={() => setAll((v) => !v)} className="w-full border-t border-line px-4 py-2.5 text-left text-[13px] text-muted hover:text-fg">
            {all ? "Show fewer" : `Show all ${groups.length}`}
          </button>
        )}
      </Card>
    </div>
  );
}

function SimpleList({ title, findings, admin, render }: { title: string; findings: Finding[]; admin: boolean; render: (f: Finding) => React.ReactNode }) {
  const ignore = useIgnoreFinding();
  if (findings.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-fg">{title}</p>
      <Card className="overflow-hidden">
        {findings.map((f) => (
          <div key={f.id} className={cn("flex items-center gap-3 border-b border-line px-4 py-3 last:border-0", f.ignored_at && "opacity-60")}>
            <div className="min-w-0 flex-1 text-[13px]">{render(f)}</div>
            <Badge tone={TONE[f.severity]}>{f.severity}</Badge>
            {admin && (
              <Button variant="ghost" size="xs" disabled={ignore.isPending} onClick={() => ignore.mutate({ id: f.id, ignored: !f.ignored_at })}>
                {f.ignored_at ? "Count again" : "Ignore"}
              </Button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

/** Known vulnerabilities in the app's packages, committed secrets and runtimes past end of life. */
export function SecuritySection({ appId }: { appId: string }) {
  const security = useAppSecurity(appId);
  const scan = useScanApp(appId);
  const rebuild = useAutoRebuild(appId);
  const admin = useAuthStore((s) => s.user?.role !== "viewer");
  const [showIgnored, setShowIgnored] = useState(false);
  const data = security.data;
  const findings = (data?.findings ?? []).filter((f) => showIgnored || !f.ignored_at);
  const ignoredCount = (data?.findings ?? []).filter((f) => f.ignored_at).length;
  const of = (kind: Finding["kind"]) => findings.filter((f) => f.kind === kind);
  const checking = data?.scan && !data.scan.checked_at && !data.scan.check_error;

  return (
    <section>
      <SectionTitle
        action={
          <div className="flex items-center gap-3">
            {ignoredCount > 0 && (
              <button type="button" className="text-[13px] text-muted hover:text-fg" onClick={() => setShowIgnored((v) => !v)}>
                {showIgnored ? "Hide ignored" : `Show ${ignoredCount} ignored`}
              </button>
            )}
            {admin && data?.agent_ready && (
              <Button variant="secondary" size="xs" icon="refresh" disabled={scan.isPending || !!checking} onClick={() => scan.mutate()}>
                {checking ? "Scanning…" : "Scan now"}
              </Button>
            )}
          </div>
        }
      >
        Security
      </SectionTitle>
      {security.isLoading || !data ? (
        <div className="skeleton h-24 rounded-xl" />
      ) : (
        <div className="space-y-4">
          {scan.error && <Callout tone="err">{scan.error.message}</Callout>}
          {!data.lookups && (
            <Callout tone="neutral" title="Vulnerability lookups are off">
              Only committed secrets are checked. Turn lookups on in Settings → Security to check packages against OSV.dev.
            </Callout>
          )}
          {!data.scan ? (
            <Card className="p-5 text-sm text-muted">
              {data.agent_ready
                ? "Not scanned yet. Every deploy scans the app's lockfiles, its container's OS packages and its repository."
                : "This server's agent can't scan apps yet. Re-run its install command to upgrade it to 1.1.7 or later."}
            </Card>
          ) : (
            <>
              <p className="text-xs text-subtle">
                {checking ? "Checking against OSV.dev…" : data.scan.checked_at ? `Checked ${timeAgo(data.scan.checked_at)}` : "Not checked yet"}
                {" · "}
                {data.scan.packages.toLocaleString()} packages
                {data.scan.lockfiles.length > 0 && ` from ${data.scan.lockfiles.join(", ")}`}
                {data.scan.os && ` · ${data.scan.os} (${data.scan.os_packages} packages)`}
              </p>
              {data.scan.check_error && <Callout tone="warn">The last check didn&apos;t finish ({data.scan.check_error}). These are the previous results; it tries again within a day.</Callout>}
              {findings.length === 0 && data.scan.checked_at ? (
                <Card className="flex items-center gap-3 p-5 text-sm text-muted">
                  <Icon name="shield-check" className="text-ok" />
                  No known vulnerabilities, committed secrets or end-of-life runtimes.
                </Card>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {ORDER.filter((s) => data.counts[s]).map((s) => (
                      <Badge key={s} tone={TONE[s]}>
                        {data.counts[s]} {s}
                      </Badge>
                    ))}
                  </div>
                  <SimpleList
                    title="Secrets in the repository"
                    findings={of("secret")}
                    admin={admin}
                    render={(f) => (
                      <>
                        <p className="font-mono text-[12.5px] text-fg">{f.path}</p>
                        <p className="text-xs text-subtle">{f.title}. Move it to the app&apos;s environment variables and rotate it: it&apos;s in the git history.</p>
                      </>
                    )}
                  />
                  <SimpleList title="End of life" findings={of("eol")} admin={admin} render={(f) => <p className="text-fg">{f.title}</p>} />
                  <PackageList title="Vulnerable dependencies" findings={of("dependency")} admin={admin} />
                  <PackageList
                    title="Vulnerable OS packages"
                    hint="Fixed in the distro already: rebuilding the app picks up the fixed packages from its base image."
                    findings={of("os")}
                    admin={admin}
                  />
                </>
              )}
            </>
          )}
          {admin && (
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={data.auto_rebuild} disabled={rebuild.isPending} onChange={(e) => rebuild.mutate(e.target.checked)} className="accent-[var(--color-accent)]" />
              <span className="text-sm">
                Rebuild weekly <span className="text-muted">— redeploys the live version so the base image and OS packages pick up security fixes</span>
              </span>
            </label>
          )}
        </div>
      )}
    </section>
  );
}
