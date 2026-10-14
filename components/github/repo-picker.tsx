"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Badge, Button, Input, Label, Select } from "@/components/ui";
import { type GitHubRepo, useGitHubBranches, useGitHubRepos, useGitHubStatus } from "@/lib/api/github";
import { timeAgo } from "@/lib/format";

type Props = {
  picked: GitHubRepo | null;
  onPick: (repo: GitHubRepo | null) => void;
  branch: string;
  onBranch: (branch: string) => void;
  url: string;
  onUrl: (url: string) => void;
  autoDeploy: boolean;
  onAutoDeploy: (on: boolean) => void;
};

/** Git source: import from the connected GitHub App, or type a public URL. */
export function RepoPicker({ picked, onPick, branch, onBranch, url, onUrl, autoDeploy, onAutoDeploy }: Props) {
  const status = useGitHubStatus();
  const connected = !!status.data?.connected && (status.data?.installations.length ?? 0) > 0;
  const repos = useGitHubRepos(connected);
  const branches = useGitHubBranches(picked?.installation_id, picked?.id);
  const [manual, setManual] = useState(false);
  const [q, setQ] = useState("");

  // Pick the default branch once branches load.
  useEffect(() => {
    if (picked && branches.data?.length && !branches.data.includes(branch)) onBranch(branches.data[0]);
  }, [picked, branches.data, branch, onBranch]);

  if (status.isLoading) return <div className="skeleton mt-5 h-64 rounded-md" />;

  if (connected && !manual) {
    if (picked) {
      return (
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3 rounded-md border border-line bg-bg-200 px-3 py-2.5">
            <Icon name="github" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 truncate text-sm">
                {picked.full_name} {picked.private && <Icon name="lock" size={12} className="text-subtle" />}
              </div>
              {picked.description && <div className="truncate text-xs text-subtle">{picked.description}</div>}
            </div>
            <Button variant="secondary" size="xs" onClick={() => onPick(null)}>
              Change
            </Button>
          </div>
          <div>
            <Label htmlFor="branch">Branch</Label>
            {branches.data?.length ? (
              <Select id="branch" value={branch} onChange={(e) => onBranch(e.target.value)}>
                {branches.data.map((b) => (
                  <option key={b} value={b}>
                    {b}
                    {b === picked.default_branch ? " (default)" : ""}
                  </option>
                ))}
              </Select>
            ) : (
              <Input id="branch" icon="git-branch" value={branch} onChange={(e) => onBranch(e.target.value)} className="font-mono" />
            )}
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3">
            <input
              type="checkbox"
              checked={autoDeploy && !!status.data?.app?.webhook_url}
              disabled={!status.data?.app?.webhook_url}
              onChange={(e) => onAutoDeploy(e.target.checked)}
              className="mt-0.5 accent-[var(--color-accent)]"
            />
            <span className="text-sm">
              Deploy on every push to <span className="font-mono">{branch}</span>
              <span className="mt-0.5 block text-xs text-subtle">
                {status.data?.app?.webhook_url ? "GitHub notifies VPSPilot through a signed webhook." : "Unavailable: this control plane had no public URL when GitHub was connected."}
              </span>
            </span>
          </label>
        </div>
      );
    }

    const term = q.trim().toLowerCase();
    const list = (repos.data ?? []).filter((r) => r.full_name.toLowerCase().includes(term)).slice(0, 8);
    return (
      <div className="mt-5">
        <Input icon="search" placeholder="Search repositories…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <div className="mt-3 overflow-hidden rounded-md border border-line">
          {repos.isLoading ? (
            <div className="space-y-px">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-12" />
              ))}
            </div>
          ) : repos.error ? (
            <p className="p-4 text-sm text-err">{repos.error.message}</p>
          ) : list.length ? (
            list.map((r) => (
              <div key={r.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                <Icon name="github" className="shrink-0 text-subtle" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {r.full_name}
                  {r.private && <Icon name="lock" size={12} className="ml-1.5 inline text-subtle" />}
                  <span className="text-subtle"> · {timeAgo(r.pushed_at)}</span>
                </span>
                {r.language && <Badge className="hidden sm:inline-flex">{r.language}</Badge>}
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => {
                    onPick(r);
                    onBranch(r.default_branch);
                  }}
                >
                  Import
                </Button>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-subtle">{term ? "No repositories match." : "No repositories are shared with the GitHub App yet."}</p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <a href={status.data?.app?.install_url} className="inline-flex items-center gap-1 hover:text-fg">
            Missing a repository? Adjust GitHub access <Icon name="arrow-up-right" size={12} />
          </a>
          <button type="button" onClick={() => setManual(true)} className="hover:text-fg">
            Enter a public Git URL instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      {connected ? (
        <button type="button" onClick={() => setManual(false)} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg">
          <Icon name="arrow-left" size={12} /> Back to your GitHub repositories
        </button>
      ) : (
        <Link
          href="/dashboard/settings/github"
          className="flex items-center gap-3 rounded-md border border-dashed border-line-strong p-3 text-sm text-muted transition-colors hover:border-accent/50 hover:text-fg"
        >
          <Icon name="github" />
          <span className="flex-1">
            <span className="text-fg">Connect GitHub</span> to import private repositories and deploy on push
          </span>
          <Icon name="arrow-right" size={14} />
        </Link>
      )}
      <div>
        <Label htmlFor="repo" hint="public, https">
          Repository URL
        </Label>
        <Input id="repo" icon="github" placeholder="https://github.com/acme/web" value={url} onChange={(e) => onUrl(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="branch" hint="or a tag / commit">
          Branch
        </Label>
        <Input id="branch" icon="git-branch" value={branch} onChange={(e) => onBranch(e.target.value)} className="font-mono" />
      </div>
    </div>
  );
}
