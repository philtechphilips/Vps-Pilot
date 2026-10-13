import type { Metadata } from "next";
import Link from "next/link";
import { BrandChip } from "@/components/brand-chip";
import { Sparkline } from "@/components/charts";
import { Icon } from "@/components/icons";
import { Badge, ButtonLink, Container, Dot, PageHeader, SearchBar } from "@/components/ui";
import { apps, deployLabel, deployTone, getServer } from "@/lib/data";

export const metadata: Metadata = { title: "Applications" };

export default function ApplicationsPage() {
  return (
    <>
      <PageHeader
        title="Applications"
        description="Docker, systemd and PM2 apps deployed from Git or pinned images."
        actions={
          <ButtonLink href="/dashboard/applications/new" variant="primary" size="md" icon="plus">
            New Application
          </ButtonLink>
        }
      />
      <Container>
        <SearchBar placeholder="Search applications…" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((a) => {
            const server = getServer(a.serverId);
            return (
              <Link
                key={a.id}
                href={`/dashboard/applications/${a.id}`}
                className="group flex flex-col rounded-xl border border-line bg-bg-100 p-4 transition-colors hover:border-line-strong"
              >
                <div className="flex items-start gap-3">
                  <BrandChip name={a.framework} size={34} className="rounded-full" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{a.name}</div>
                    <div className="truncate text-[13px] text-muted">{a.domains[0] ?? `${server?.name}:${a.port || "—"}`}</div>
                  </div>
                  <span className="inline-flex size-8 items-center justify-center rounded-full border border-line text-subtle">
                    <Icon name="activity" size={14} />
                  </span>
                </div>

                <span className="mt-4 inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-fg">
                  <Icon name={a.branch === "image" ? "container" : "github"} size={13} />
                  <span className="truncate">{a.repo}</span>
                </span>

                <Sparkline data={a.requests} height={30} className="mt-4" color={a.status === "error" ? "err" : "blue"} />

                <div className="mt-3 truncate text-[13px] text-fg">{a.commitMessage}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
                  <span>{a.updated} on</span>
                  <Icon name="git-branch" size={13} />
                  <span className="truncate">{a.branch}</span>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-muted">
                  <Dot tone={deployTone[a.status]} pulse={a.status === "building"} />
                  {deployLabel[a.status]}
                  <Badge className="ml-auto">{a.runtime}</Badge>
                  <span className="truncate text-subtle">{server?.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </>
  );
}
