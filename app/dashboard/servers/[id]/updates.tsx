"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Icon } from "@/components/icons";
import { Badge, Button, Card, Mono, SectionTitle } from "@/components/ui";
import type { JobType } from "@/lib/api/jobs";
import type { ServerUpdates } from "@/lib/api/servers";
import { timeAgo } from "@/lib/format";

/** Pending package updates, with buttons to install them and reboot. */
export function UpdatesSection({
  name,
  updates,
  live,
  busy,
  action,
}: {
  name: string;
  updates: ServerUpdates | undefined;
  live: boolean;
  busy: boolean;
  action: (type: JobType, payload: Record<string, unknown>) => void;
}) {
  const [confirm, setConfirm] = useState<"all" | "reboot" | null>(null);
  const [showAll, setShowAll] = useState(false);
  if (!updates) return null; // older agent, or not an apt-based system
  const packages = showAll ? updates.packages : updates.packages.slice(0, 8);

  return (
    <section>
      <SectionTitle
        action={<span className="text-xs text-subtle">Checked {timeAgo(new Date(updates.checked_at * 1000).toISOString())}</span>}
      >
        System Updates
      </SectionTitle>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <Icon name={updates.security ? "shield" : "shield-check"} className={updates.security ? "text-warn" : "text-ok"} />
          <span className="text-sm">
            {updates.total === 0 ? (
              "Everything is up to date."
            ) : (
              <>
                <span className={updates.security ? "font-medium text-warn" : ""}>
                  {updates.security} security update{updates.security === 1 ? "" : "s"}
                </span>{" "}
                <span className="text-muted">· {updates.total} pending in all</span>
              </>
            )}
          </span>
          {updates.reboot_required && <Badge tone="warn">Reboot required</Badge>}
          <span className="ml-auto flex flex-wrap gap-2">
            {updates.security > 0 && (
              <Button variant="primary" size="sm" icon="shield" disabled={!live || busy} onClick={() => action("os.upgrade", { mode: "security" })}>
                Install security updates
              </Button>
            )}
            {updates.total > 0 && (
              <Button variant="secondary" size="sm" disabled={!live || busy} onClick={() => setConfirm("all")}>
                Install all
              </Button>
            )}
            {updates.reboot_required && (
              <Button variant="secondary" size="sm" icon="refresh" disabled={!live || busy} onClick={() => setConfirm("reboot")}>
                Reboot
              </Button>
            )}
          </span>
        </div>
        {packages.map((p) => (
          <div key={p.name} className="flex items-center gap-3 border-b border-line px-4 py-2 text-sm last:border-0">
            <Mono className="truncate">{p.name}</Mono>
            {p.security && <Badge tone="warn">security</Badge>}
            <Mono className="ml-auto truncate text-muted">{p.version}</Mono>
          </div>
        ))}
        {updates.packages.length > 8 && (
          <button type="button" className="w-full px-4 py-2 text-left text-xs text-subtle hover:text-fg" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show fewer" : `Show all ${updates.packages.length}`}
          </button>
        )}
      </Card>
      <ConfirmDialog
        open={confirm === "all"}
        onClose={() => setConfirm(null)}
        danger={false}
        title="Install all updates"
        confirmText={name}
        action="Install"
        onConfirm={() => {
          setConfirm(null);
          action("os.upgrade", { mode: "all" });
        }}
      >
        Runs apt-get upgrade on {name}. Services whose packages change restart; an update to Docker restarts every container for a few seconds. Nothing is
        removed.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === "reboot"}
        onClose={() => setConfirm(null)}
        title={`Reboot ${name}`}
        confirmText={name}
        phrase="reboot this server"
        action="Reboot"
        onConfirm={() => {
          setConfirm(null);
          action("os.reboot", {});
        }}
      >
        {name} restarts in 10 seconds. Apps and databases are unavailable until it&apos;s back (usually a minute or two); VPSPilot starts them again by
        itself.
      </ConfirmDialog>
    </section>
  );
}
