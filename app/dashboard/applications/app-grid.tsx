"use client";

import Link from "next/link";
import { useState } from "react";
import { appUrl, DeploymentStatusLabel, shortSha, sourceLabel } from "@/components/apps/app-ui";
import { Icon } from "@/components/icons";
import { Badge, ButtonLink, Container, EmptyState, SearchBar } from "@/components/ui";
import { useApps } from "@/lib/api/apps";
import { useServers } from "@/lib/api/servers";
import { timeAgo } from "@/lib/format";

export function AppGrid() {
  const apps = useApps();
  const { data: servers } = useServers();
  const [q, setQ] = useState("");
  const list = (apps.data ?? []).filter((a) =>
    `${a.name} ${sourceLabel(a)} ${a.server_name ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <Container>
      <SearchBar placeholder="Search applications…" value={q} onChange={(e) => setQ(e.target.value)} />
      {apps.isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      ) : apps.error ? (
        <EmptyState icon="box" title="Couldn't load applications" className="mt-6">
          {apps.error.message}
        </EmptyState>
      ) : !apps.data?.length ? (
        <EmptyState
          icon="box"
          title="No applications yet"
          className="mt-6"
          action={
            <ButtonLink href="/dashboard/applications/new" variant="primary" size="md" icon="plus">
              Deploy your first app
            </ButtonLink>
          }
        >
          Point VPSPilot at a Git repository with a Dockerfile, or at a container image, and pick a server.
        </EmptyState>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => {
            const latest = a.latest_deployment;
            const shown = a.current_deployment ?? latest;
            const url = appUrl(a, servers);
            return (
              <Link
                key={a.id}
                href={`/dashboard/applications/${a.id}`}
                className="group flex flex-col rounded-xl border border-line bg-bg-100 p-4 transition-colors hover:border-line-strong"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full border border-line bg-bg-200 text-sm font-semibold uppercase">
                    {a.name[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{a.name}</div>
                    <div className="truncate text-[13px] text-muted">{url?.replace("http://", "") ?? `${a.server_name}:${a.host_port}`}</div>
                  </div>
                  <span className="inline-flex size-8 items-center justify-center rounded-full border border-line text-subtle">
                    <Icon name="activity" size={14} />
                  </span>
                </div>

                <span className="mt-4 inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-fg">
                  <Icon name={a.source_type === "git" ? "github" : "container"} size={13} />
                  <span className="truncate">{sourceLabel(a)}</span>
                </span>

                <div className="mt-4 truncate text-[13px] text-fg">
                  {shown?.commit_message ?? shown?.image_ref ?? (a.source_type === "git" ? "Not deployed yet" : a.image)}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
                  <span>{timeAgo(shown?.created_at ?? a.created_at)}</span>
                  {a.source_type === "git" && (
                    <>
                      <span>on</span>
                      <Icon name="git-branch" size={13} />
                      <span className="truncate">{a.branch}</span>
                      {shown?.commit_sha && <span className="font-mono text-xs text-subtle">{shortSha(shown.commit_sha)}</span>}
                    </>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-muted">
                  {latest ? <DeploymentStatusLabel status={latest.status} /> : <span className="text-subtle">Never deployed</span>}
                  <Badge className="ml-auto">{a.runtime}</Badge>
                  <span className="truncate text-subtle">{a.server_name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
