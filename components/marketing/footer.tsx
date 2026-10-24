import Link from "next/link";
import { Logotype } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Dot } from "@/components/ui";

const columns = [
  { title: "Product", links: ["Servers", "Deployments", "Database Center", "Monitoring", "Domains & TLS", "Backups"] },
  { title: "Databases", links: ["PostgreSQL", "MySQL", "MariaDB", "Redis", "MongoDB (soon)", "SQLite (soon)"] },
  { title: "Resources", links: ["Docs", "Install guide", "Agent protocol", "Threat model", "Changelog", "Upgrade notes"] },
  { title: "Project", links: ["GitHub", "Releases", "Roadmap", "Security policy", "License"] },
];

const docLinks: Record<string, string> = {
  Docs: "/docs",
  "Install guide": "/docs/getting-started/install",
  "Agent protocol": "/docs/reference/agent#agent-protocol",
  "Threat model": "/docs/concepts/security",
};

export function MarketingFooter() {
  return (
    <footer className="border-t border-ink/[0.06] bg-bg">
      <div className="mx-auto max-w-[1080px] px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-[1.2fr_repeat(4,1fr)]">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="inline-flex" aria-label="VPSPilot home">
              <Logotype className="text-[22px]" />
            </Link>
            <p className="mt-4 max-w-56 text-sm text-muted">Self-hosted control plane for the servers you already own.</p>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <h3 className="text-sm font-medium text-fg">{c.title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href={docLinks[l] ?? "#"} className="transition-colors hover:text-fg">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-ink/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <a href="#" className="inline-flex w-fit items-center gap-2 rounded-full border border-ink/[0.06] bg-bg-100 px-3 py-1.5 text-[13px] text-muted hover:text-fg">
            <Dot tone="ok" pulse />
            All systems normal
          </a>
          <div className="flex items-center gap-4 text-sm text-subtle">
            <span>© 2026 VPSPilot</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
