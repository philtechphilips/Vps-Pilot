"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { StatusPagesSection } from "@/components/dashboard/status-pages";
import { Icon } from "@/components/icons";
import { Badge, Button, ButtonLink, Card, Container, EmptyState, Input, Label, Mono, Select } from "@/components/ui";
import { useApps } from "@/lib/api/apps";
import { type Domain, domainUrl, type TlsMode, useAddDomain, useCheckDomain, useDomainAccess, useDomains, useRemoveDomain, useUpdateDomain } from "@/lib/api/domains";
import { formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const TLS_LABEL: Record<TlsMode, string> = {
  auto: "Automatic HTTPS (Let's Encrypt)",
  internal: "Internal certificate (testing)",
  off: "No HTTPS",
};

const PRIVATE_IP = /^(10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|fc|fd|fe80|::1)/i;

export function DomainsView() {
  const domains = useDomains();
  const { data: apps } = useApps();
  const add = useAddDomain();
  const [hostname, setHostname] = useState("");
  const [appId, setAppId] = useState("");
  const [tls, setTls] = useState<TlsMode>("auto");
  const [www, setWww] = useState(false);
  const valid = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(hostname.trim().replace(/\.$/, ""));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !appId) return;
    add.mutate({ hostname: hostname.trim(), application_id: appId, tls_mode: tls, redirect_www: www }, { onSuccess: () => (setHostname(""), setWww(false)) });
  };

  return (
    <Container className="space-y-6">
      <Card className="p-4">
        <form className="space-y-3" onSubmit={submit}>
          <div className="flex flex-col gap-2 lg:flex-row">
            <Input placeholder="shop.example.com" value={hostname} onChange={(e) => setHostname(e.target.value)} className="flex-1 font-mono" aria-label="Domain" />
            <Select value={appId} onChange={(e) => setAppId(e.target.value)} className="lg:w-56" aria-label="Application">
              <option value="" disabled>
                {apps?.length ? "Assign to application…" : "Create an application first"}
              </option>
              {apps?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.server_name}
                </option>
              ))}
            </Select>
            <Select value={tls} onChange={(e) => setTls(e.target.value as TlsMode)} className="lg:w-72" aria-label="HTTPS">
              {(Object.keys(TLS_LABEL) as TlsMode[]).map((m) => (
                <option key={m} value={m}>
                  {TLS_LABEL[m]}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="primary" size="md" disabled={!valid || !appId || add.isPending}>
              {add.isPending ? "Adding…" : "Add"}
            </Button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={www} onChange={(e) => setWww(e.target.checked)} className="accent-[var(--color-accent)]" />
            Also redirect <Mono>{hostname.trim().startsWith("www.") ? hostname.trim().slice(4) || "example.com" : `www.${hostname.trim() || "example.com"}`}</Mono> to it
          </label>
          {add.error && <p className="text-sm text-err">{add.error.message}</p>}
        </form>
      </Card>

      {domains.isLoading ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : !domains.data?.length ? (
        <EmptyState
          icon="globe"
          title="No domains yet"
          action={
            !apps?.length ? (
              <ButtonLink href="/dashboard/applications/new" variant="primary" size="md" icon="plus">
                Deploy an app
              </ButtonLink>
            ) : undefined
          }
        >
          Add a hostname above and point its DNS at your server. VPSPilot&apos;s proxy serves it with HTTPS and renews the certificate automatically.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {domains.data.map((d) => (
            <DomainCard key={d.id} d={d} />
          ))}
        </div>
      )}

      <StatusPagesSection domains={domains.data ?? []} />

      <p className="flex items-start gap-2 text-xs leading-relaxed text-subtle">
        <Icon name="shield-check" size={14} className="mt-px shrink-0" />
        Each server runs a VPSPilot proxy (Caddy) on ports 80 and 443. Every change is validated before it&apos;s loaded and rolled back if the proxy rejects it; other
        sites and services on the server aren&apos;t touched.
      </p>
    </Container>
  );
}

function DomainCard({ d }: { d: Domain }) {
  const check = useCheckDomain();
  const update = useUpdateDomain();
  const remove = useRemoveDomain();
  const [confirm, setConfirm] = useState(false);
  const [protecting, setProtecting] = useState(false);
  const publicIps = d.server_ips.filter((ip) => !PRIVATE_IP.test(ip));
  const dnsOk = d.dns_status === "ok";

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <a href={domainUrl(d)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[17px] font-semibold tracking-tight hover:underline">
            {d.hostname} <Icon name="external-link" size={14} className="text-subtle" />
          </a>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className={cn("flex items-center gap-1.5", d.status === "error" ? "text-err" : d.status === "pending" ? "text-warn" : "text-ok")}>
              <Icon name={d.status === "error" ? "x-circle" : d.status === "pending" ? "clock" : "check-circle"} size={16} />
              {d.status === "error" ? "Not applied" : d.status === "pending" ? "Applying…" : "Live on the proxy"}
            </span>
            {d.redirect_to ? (
              <span className="flex items-center gap-1.5 text-muted">
                <Icon name="arrow-right" size={14} /> Redirects to <span className="text-fg">{d.redirect_to}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted">
                <Icon name="box" size={14} />
                <Link href={`/dashboard/applications/${d.application_id}`} className="text-fg hover:underline">
                  {d.application_name}
                </Link>
                <span className="text-subtle">on {d.server_name}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Icon name="lock" size={14} className="text-subtle" />
              <Certificate d={d} />
            </span>
            {d.uptime?.up != null && (
              <span className={cn("flex items-center gap-1.5", d.uptime.up ? "text-muted" : "text-err")} title={d.uptime.error ?? undefined}>
                <Icon name="activity" size={14} className={d.uptime.up ? "text-ok" : "text-err"} />
                {d.uptime.up ? "Up" : `Down: ${d.uptime.error}`}
                {d.uptime.uptime_24h != null && <span className="text-subtle">· {d.uptime.uptime_24h}% today</span>}
                {d.uptime.up && d.uptime.ms != null && <span className="text-subtle">· {Math.round(d.uptime.ms)} ms</span>}
              </span>
            )}
          </div>
          {(d.access.password || d.access.allow.length > 0) && (
            <p className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
              {d.access.password && <span>Password required (user {d.access.user})</span>}
              {d.access.allow.length > 0 && <span>Only from {d.access.allow.join(", ")}</span>}
            </p>
          )}
          {d.status === "error" && d.error && <p className="mt-2 text-sm text-err">{d.error}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Select value={d.tls_mode} onChange={(e) => update.mutate({ id: d.id, tls_mode: e.target.value as TlsMode })} className="w-44" aria-label={`HTTPS for ${d.hostname}`}>
            <option value="auto">Automatic HTTPS</option>
            <option value="internal">Internal cert</option>
            <option value="off">No HTTPS</option>
          </Select>
          <Button variant="secondary" size="md" icon="refresh" disabled={check.isPending} onClick={() => check.mutate(d.id)}>
            Check
          </Button>
          {!d.redirect_to && (
            <Button variant="secondary" size="md" icon="lock" onClick={() => setProtecting(true)}>
              {d.access.password || d.access.allow.length ? "Protected" : "Protect"}
            </Button>
          )}
          <Button variant="secondary" size="md" icon="trash" aria-label={`Remove ${d.hostname}`} onClick={() => setConfirm(true)} />
        </div>
      </div>

      {!dnsOk && d.dns_status && (
        <div className="border-t border-line bg-bg px-5 py-4">
          <p className="text-sm text-muted">
            {d.dns_status === "missing" ? "No DNS record found yet." : `DNS points to ${d.dns_addresses.join(", ")}, not this server.`} Add this record at your DNS
            provider:
          </p>
          <div className="thin-scrollbar mt-3 overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left text-xs text-subtle">
                  <th className="border-b border-line px-4 py-2 font-normal">Type</th>
                  <th className="border-b border-line px-4 py-2 font-normal">Name</th>
                  <th className="border-b border-line px-4 py-2 font-normal">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2.5 font-mono">A</td>
                  <td className="px-4 py-2.5 font-mono">{d.hostname}</td>
                  <td className="px-4 py-2.5 font-mono">{publicIps[0] ?? "your server's public IP"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-xs text-subtle">
            <Icon name="info" size={13} className="mt-px shrink-0" />
            {publicIps.length
              ? "Certificates are issued once the record resolves; that can take a few minutes. Press Check to look again."
              : `${d.server_name} only reports private addresses (${d.server_ips.join(", ") || "none"}); use the public IP your provider gave the server.`}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line bg-bg-200 px-5 py-2.5 text-xs text-subtle">
        <span>{dnsOk ? "DNS points to this server" : d.dns_status ? "DNS needs attention" : "DNS not checked yet"}</span>
        <span>Served by vpspilot-proxy on {d.server_name}</span>
        {d.cert_checked_at && <span>Certificate checked {timeAgo(d.cert_checked_at)}</span>}
        <span>Added {timeAgo(d.created_at)}</span>
      </div>

      {protecting && <ProtectDialog d={d} onClose={() => setProtecting(false)} />}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Remove ${d.hostname}`}
        confirmText={d.hostname}
        action="Remove"
        onConfirm={() => {
          setConfirm(false);
          remove.mutate(d.id);
        }}
      >
        The proxy stops serving it{d.redirect_to ? "" : ", along with redirects to it"}. The app keeps running.
      </ConfirmDialog>
    </Card>
  );
}

function Certificate({ d }: { d: Domain }) {
  if (d.tls_mode === "off") return <span className="text-muted">HTTP only</span>;
  if (d.tls_mode === "internal") return <span className="text-muted">Internal certificate · browsers will warn</span>;
  if (d.cert_expires_at && d.cert_days_left !== null) {
    const warn = d.cert_days_left < 14;
    return warn ? (
      <Badge tone="warn">Expires in {d.cert_days_left} days</Badge>
    ) : (
      <span className="text-muted" title={formatDate(d.cert_expires_at)}>
        {d.cert_issuer ?? "Certificate"} · renews automatically, valid {d.cert_days_left} more days
      </span>
    );
  }
  if (d.cert_error) return <Badge tone={d.dns_status === "ok" ? "err" : "neutral"}>{d.dns_status === "ok" ? "Issuance pending or failed" : "Waiting for DNS"}</Badge>;
  return <Badge tone="blue">Issuing…</Badge>;
}

function ProtectDialog({ d, onClose }: { d: Domain; onClose: () => void }) {
  const save = useDomainAccess();
  const [user, setUser] = useState(d.access.user ?? "admin");
  const [password, setPassword] = useState("");
  const [removePassword, setRemovePassword] = useState(false);
  const [allow, setAllow] = useState(d.access.allow.join("\n"));
  const ranges = allow
    .split(/[\s,]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const valid = (!password || password.length >= 8) && /^[A-Za-z0-9._@-]{1,64}$/.test(user);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Protect ${d.hostname}`}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] animate-fade-up overflow-hidden rounded-t-xl border border-line-strong bg-bg-100 shadow-2xl sm:rounded-xl"
      >
        <div className="space-y-4 p-6">
          <h2 className="text-xl font-semibold tracking-tight">Protect {d.hostname}</h2>
          <p className="text-sm text-muted">For staging sites and admin panels. Uptime checks keep working (a password prompt counts as up).</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pu">User</Label>
              <Input id="pu" value={user} onChange={(e) => setUser(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pp" hint={d.access.password ? "leave empty to keep" : "8+ characters"}>
                Password
              </Label>
              <Input id="pp" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          {d.access.password && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={removePassword} onChange={(e) => setRemovePassword(e.target.checked)} className="accent-[var(--color-accent)]" />
              Remove the password
            </label>
          )}
          <div>
            <Label htmlFor="pa" hint="one per line; empty lets everyone in">
              Only allow these IP addresses or ranges
            </Label>
            <textarea
              id="pa"
              rows={3}
              value={allow}
              onChange={(e) => setAllow(e.target.value)}
              spellCheck={false}
              placeholder={"203.0.113.7\n198.51.100.0/24"}
              className="w-full rounded-md border border-line bg-bg px-3 py-2 font-mono text-[12px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
            />
            <p className="mt-1 text-xs text-subtle">Behind Cloudflare&apos;s proxy (orange cloud) visitors arrive from Cloudflare&apos;s addresses, so use a password there instead.</p>
          </div>
          {save.error && <p className="text-sm text-err">{save.error.message}</p>}
        </div>
        <div className="flex justify-between gap-2 border-t border-line bg-bg-200 px-6 py-4">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!valid || save.isPending}
            onClick={() =>
              save.mutate(
                { id: d.id, user, allow: ranges, ...(removePassword ? { remove_password: true } : password ? { password } : {}) },
                { onSuccess: onClose },
              )
            }
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
