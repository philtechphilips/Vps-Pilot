"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Icon } from "@/components/icons";
import { Badge, Button, Card, Input, Mono, SectionTitle, Select } from "@/components/ui";
import { isActive, useJob, useRunAction } from "@/lib/api/jobs";
import { cn } from "@/lib/utils";

type Check = { id: string; status: "ok" | "warn" | "bad" | "info"; title: string; detail: string; fix: string | null };
type Report = {
  checks: Check[];
  firewall: { installed: boolean; active: boolean; rules: { number: number; to: string; action: string; from: string }[] };
  ssh_ports: number[];
};

const ICON = { ok: "check-circle", warn: "alert", bad: "x-circle", info: "info" } as const;
const TONE = { ok: "text-ok", warn: "text-warn", bad: "text-err", info: "text-muted" };

function parse(output: string | null | undefined): Report | null {
  try {
    return output ? (JSON.parse(output) as Report) : null;
  } catch {
    return null;
  }
}

/** A short security review of the server, with the fixes that are safe to apply. */
export function SecuritySection({ serverId, live }: { serverId: string; live: boolean }) {
  const run = useRunAction(serverId);
  const [checkJob, setCheckJob] = useState<string | null>(null);
  const [fixJob, setFixJob] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [port, setPort] = useState("");
  const [proto, setProto] = useState("tcp");
  const [source, setSource] = useState("");
  const report = useJob(checkJob);
  const fix = useJob(fixJob);
  const data = parse(report.data?.output);
  const checking = !!checkJob && (!report.data || isActive(report.data.status));
  const fixing = !!fixJob && (!fix.data || isActive(fix.data.status));
  const protectedPorts = new Set([...(data?.ssh_ports ?? [22]), 80, 443]);

  const check = () => run.mutate({ type: "security.check", payload: {} }, { onSuccess: (job) => setCheckJob(job.id) });
  const apply = (type: "firewall.apply" | "security.auto_updates", payload: Record<string, unknown>) =>
    run.mutate({ type, payload }, { onSuccess: (job) => setFixJob(job.id) });

  // Re-check once a fix has finished, so the list shows the new state.
  const fixDone = fix.data && !isActive(fix.data.status) ? fix.data.id : null;
  useEffect(() => {
    if (fixDone) run.mutate({ type: "security.check", payload: {} }, { onSuccess: (job) => setCheckJob(job.id) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixDone]);

  return (
    <section>
      <SectionTitle
        action={
          <Button variant="secondary" size="xs" icon="shield" disabled={!live || checking} onClick={check}>
            {checking ? "Checking…" : data ? "Check again" : "Run security check"}
          </Button>
        }
      >
        Security
      </SectionTitle>
      <Card className="overflow-hidden">
        {!data ? (
          <p className="p-4 text-sm text-muted">
            {report.data?.status === "failed" ? report.data.error : "Checks SSH login settings, the firewall, databases and ports open to the internet, and automatic security updates."}
          </p>
        ) : (
          <>
            {data.checks.map((c) => (
              <div key={c.id} className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-0">
                <Icon name={ICON[c.status]} size={16} className={cn("mt-0.5 shrink-0", TONE[c.status])} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{c.title}</div>
                  <div className="text-xs text-subtle">{c.detail}</div>
                </div>
                {c.fix === "firewall_enable" && (
                  <Button variant="primary" size="xs" disabled={!live || fixing} onClick={() => setConfirm(true)}>
                    Turn on
                  </Button>
                )}
                {c.fix === "auto_updates" && (
                  <Button variant="secondary" size="xs" disabled={!live || fixing} onClick={() => apply("security.auto_updates", {})}>
                    Turn on
                  </Button>
                )}
              </div>
            ))}
            {data.firewall.active && (
              <div className="border-t border-line bg-bg p-4">
                <div className="mb-2 text-xs font-medium text-muted">Firewall rules</div>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {data.firewall.rules.map((r) => {
                    const rulePort = Number(r.to.split("/")[0]);
                    return (
                      <span key={r.number} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-[12px]">
                        <Mono>{r.to}</Mono>
                        <span className="text-subtle">
                          {r.action.toLowerCase()} from {r.from === "Anywhere" || r.from === "Anywhere (v6)" ? "anywhere" : r.from}
                        </span>
                        {!protectedPorts.has(rulePort) && !Number.isNaN(rulePort) && r.action === "ALLOW" && (
                          <button
                            type="button"
                            aria-label={`Close ${r.to}`}
                            className="text-subtle hover:text-err"
                            disabled={fixing}
                            onClick={() =>
                              apply("firewall.apply", {
                                action: "remove",
                                port: rulePort,
                                proto: r.to.includes("/udp") ? "udp" : "tcp",
                                ...(r.from.startsWith("Anywhere") ? {} : { source: r.from }),
                              })
                            }
                          >
                            <Icon name="x" size={12} />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    apply("firewall.apply", { action: "allow", port: Number(port), proto, ...(source.trim() ? { source: source.trim() } : {}) });
                    setPort("");
                  }}
                >
                  <Input aria-label="Port" className="w-24 font-mono" placeholder="port" inputMode="numeric" value={port} onChange={(e) => setPort(e.target.value.replace(/\D/g, ""))} />
                  <Select aria-label="Protocol" className="w-24" value={proto} onChange={(e) => setProto(e.target.value)}>
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                  </Select>
                  <Input aria-label="From" className="w-48 font-mono" placeholder="from anywhere, or an IP" value={source} onChange={(e) => setSource(e.target.value)} />
                  <Button type="submit" variant="secondary" size="md" disabled={!port || fixing || Number(port) > 65535}>
                    Open port
                  </Button>
                </form>
                <p className="mt-2 text-xs text-subtle">
                  SSH ({[...(data.ssh_ports ?? [22])].join(", ")}), 80 and 443 always stay open. Docker-published ports aren&apos;t filtered by the firewall: use
                  an app&apos;s <Badge>Private port</Badge> setting for those.
                </p>
              </div>
            )}
          </>
        )}
        {(run.error || (fix.data?.status === "failed" && fix.data.error)) && (
          <p className="border-t border-line px-4 py-2 text-xs text-err">{run.error?.message ?? fix.data?.error}</p>
        )}
      </Card>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        danger={false}
        title="Turn on the firewall"
        confirmText="firewall"
        action="Turn on"
        onConfirm={() => {
          setConfirm(false);
          apply("firewall.apply", { action: "enable" });
        }}
      >
        SSH, 80 and 443 are allowed first, then everything else coming in is blocked unless you open it here. If you reach the server on another port
        (a VPN, a custom SSH port not in sshd&apos;s config), open it before turning the firewall on.
      </ConfirmDialog>
    </section>
  );
}
