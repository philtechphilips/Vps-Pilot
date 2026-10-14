"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Icon } from "@/components/icons";
import { Badge, Button, buttonClass, Callout, FormCard, Input, Label } from "@/components/ui";
import { useDisconnectGitHub, useGitHubStatus, useStartGitHubConnect } from "@/lib/api/github";
import { cn } from "@/lib/utils";

/** GitHub connection: create the app, install it, see where it's installed. */
export function GitHubCard() {
  const status = useGitHubStatus();
  const start = useStartGitHubConnect();
  const disconnect = useDisconnectGitHub();
  const [target, setTarget] = useState<"personal" | "org">("personal");
  const [org, setOrg] = useState("");
  const [confirm, setConfirm] = useState(false);

  if (status.isLoading) return <div className="skeleton h-56 rounded-xl" />;
  if (status.error) {
    return (
      <Callout tone="err" icon="x-circle" title="Couldn't load the GitHub connection">
        {status.error.message}
      </Callout>
    );
  }
  const s = status.data!;

  if (!s.connected || !s.app) {
    return (
      <FormCard
        title="GitHub"
        description="Connect GitHub to import repositories (including private ones) and deploy automatically when you push. VPSPilot creates a private GitHub App just for this control plane, with read-only access to code."
        footer={start.error ? <span className="text-err">{start.error.message}</span> : "You'll confirm on GitHub, then choose which repositories it can see."}
        action={
          <Button
            variant="primary"
            size="sm"
            icon="github"
            disabled={start.isPending || (target === "org" && !org.trim())}
            onClick={() => start.mutate(target === "org" ? org.trim() : null)}
          >
            {start.isPending ? "Opening GitHub…" : "Connect GitHub"}
          </Button>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["personal", "Personal account", "Repositories you own or collaborate on."],
              ["org", "Organization", "Created in an organization you administer."],
            ] as const
          ).map(([value, title, desc]) => (
            <label
              key={value}
              className={cn(
                "cursor-pointer rounded-md border p-3 transition-colors",
                target === value ? "border-accent/60 bg-accent/10" : "border-line hover:border-line-strong",
              )}
            >
              <input type="radio" name="gh-target" className="sr-only" checked={target === value} onChange={() => setTarget(value)} />
              <span className="text-sm font-medium">{title}</span>
              <span className="mt-1 block text-xs text-muted">{desc}</span>
            </label>
          ))}
        </div>
        {target === "org" && (
          <div className="mt-4 max-w-sm">
            <Label htmlFor="gh-org">Organization name</Label>
            <Input id="gh-org" placeholder="acme" value={org} onChange={(e) => setOrg(e.target.value)} className="font-mono" />
          </div>
        )}
        {!s.webhooks_available && (
          <p className="mt-4 flex gap-2 text-xs text-subtle">
            <Icon name="info" size={14} className="mt-px shrink-0" />
            Deploy-on-push needs a public https address for this API (set PUBLIC_API_URL, e.g. your domain or a tunnel) before connecting. Importing and deploying work without it.
          </p>
        )}
      </FormCard>
    );
  }

  const app = s.app;
  const settingsUrl =
    app.owner_type === "Organization" ? `https://github.com/organizations/${app.owner_login}/settings/apps/${app.slug}` : `https://github.com/settings/apps/${app.slug}`;

  return (
    <>
      <FormCard
        title="GitHub"
        description={
          <>
            Connected through the GitHub App <span className="text-fg">{app.name}</span> owned by <span className="text-fg">{app.owner_login}</span>.
          </>
        }
        footer={
          app.webhook_url ? (
            <span className="flex items-center gap-1.5">
              <Icon name="zap" size={13} className="text-ok" /> Deploy on push is on
            </span>
          ) : (
            "Deploy on push is off: this API had no public URL when GitHub was connected."
          )
        }
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirm(true)}>
              Disconnect
            </Button>
            <a href={app.install_url} className={buttonClass("primary", "sm")}>
              <Icon name="plus" size={14} /> Add account or repos
            </a>
          </div>
        }
      >
        {s.installations.length ? (
          <div className="overflow-hidden rounded-md border border-line">
            {s.installations.map((inst) => (
              <div key={inst.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                {inst.account_avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={inst.account_avatar_url} alt="" className="size-7 rounded-full" />
                ) : (
                  <Icon name="github" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{inst.account_login}</div>
                  <div className="text-xs text-subtle">{inst.repository_selection === "all" ? "All repositories" : "Selected repositories"}</div>
                </div>
                {inst.suspended && <Badge tone="warn">Suspended</Badge>}
                <a
                  href={`https://github.com/settings/installations/${inst.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg"
                >
                  Configure <Icon name="external-link" size={12} />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md border border-dashed border-line-strong p-4 text-sm text-muted">
            <Icon name="github" />
            <span className="flex-1">The app isn&apos;t installed anywhere yet. Install it to choose which repositories VPSPilot can see.</span>
            <a href={app.install_url} className={buttonClass("secondary", "sm")}>
              Install
            </a>
          </div>
        )}
      </FormCard>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Disconnect GitHub"
        confirmText={app.owner_login}
        action="Disconnect"
        onConfirm={() => {
          setConfirm(false);
          disconnect.mutate();
        }}
      >
        VPSPilot forgets the app&apos;s keys. Linked apps keep their repository URL, but private repositories can&apos;t be fetched and pushes no longer deploy. Afterwards, delete the app on GitHub too:{" "}
        <a href={settingsUrl} target="_blank" rel="noreferrer" className="text-fg underline underline-offset-2">
          {app.name} settings
        </a>
        .
      </ConfirmDialog>
    </>
  );
}
