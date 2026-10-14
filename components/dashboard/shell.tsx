"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { tabs } from "@/components/dashboard/nav";
import { useServers } from "@/lib/api/servers";
import { Icon } from "@/components/icons";
import { Logotype } from "@/components/logo";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarBrand() {
  return (
    <Link href="/dashboard" className="flex flex-col gap-1.5 px-4 pt-5 pb-6" aria-label="Dashboard home">
      <Logotype className="text-[18px]" />
      <span className="text-[11px] text-subtle">Self-hosted control plane</span>
    </Link>
  );
}

function SidebarLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-0.5 px-2">
      {tabs.map((t) => {
        const active = pathname ? isActive(pathname, t.href) : false;
        return (
          <Link
            key={t.href}
            href={t.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors",
              active ? "bg-panel text-fg shadow-[inset_0_0_0_1px_rgb(255_255_255/0.04)]" : "text-muted hover:bg-white/[0.04] hover:text-fg",
            )}
          >
            <Icon name={t.icon} size={16} className={active ? "text-fg" : "text-subtle"} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Live control-plane health: API reachability and agents reporting. */
function ControlPlaneStatus() {
  const servers = useServers();
  const list = servers.data ?? [];
  const enrolled = list.filter((s) => s.status === "online" || s.status === "offline");
  const online = enrolled.filter((s) => s.status === "online").length;
  const healthy = !servers.error;
  return (
    <div className="mx-1 rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="relative flex size-2">
          {healthy && <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-50" />}
          <span className={cn("relative inline-flex size-2 rounded-full", healthy ? "bg-ok" : "bg-err")} />
        </span>
        <span className="text-fg">{healthy ? "Control plane healthy" : "Can’t reach the API"}</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-subtle">
        {!servers.data
          ? healthy
            ? "Checking agents…"
            : servers.error?.message
          : enrolled.length === 0
            ? "No agents enrolled yet"
            : `${online} of ${enrolled.length} agent${enrolled.length === 1 ? "" : "s"} reporting`}
      </p>
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="mt-auto space-y-3 px-2 pb-4">
      <ControlPlaneStatus />
      <div className="flex flex-col gap-0.5">
        <Link href="/#changelog" className="flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] text-muted hover:bg-white/[0.04] hover:text-fg">
          <Icon name="file-text" className="text-subtle" /> Changelog
        </Link>
        <Link href="/#docs" className="flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] text-muted hover:bg-white/[0.04] hover:text-fg">
          <Icon name="book" className="text-subtle" /> Docs
        </Link>
      </div>
    </div>
  );
}

/** Static sidebar shell used while the pathname is not yet known. */
export function SidebarFallback() {
  return (
    <>
      <SidebarBrand />
      <SidebarLinks pathname={null} />
      <SidebarFooter />
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <>
      <SidebarBrand />
      <SidebarLinks pathname={pathname} />
      <SidebarFooter />
    </>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the drawer after navigating (adjusting state during render, not in an effect).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-white/[0.06] hover:text-fg lg:hidden"
      >
        <Icon name="menu" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[260px] animate-fade-up flex-col overflow-y-auto border-r border-white/[0.06] bg-black">
            <SidebarBrand />
            <SidebarLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            <SidebarFooter />
          </div>
        </div>
      )}
    </>
  );
}

const sectionLabel = (pathname: string) => {
  const t = [...tabs].reverse().find((x) => isActive(pathname, x.href));
  return t ?? tabs[0];
};

export function SectionCrumb() {
  const pathname = usePathname();
  const t = sectionLabel(pathname);
  return (
    <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-fg hover:bg-white/[0.06]">
      <Icon name={t.icon} size={14} className="text-subtle" />
      {t.label}
      <Icon name="chevrons-up-down" size={12} className="text-subtle" />
    </span>
  );
}

export function SectionCrumbFallback() {
  return <span className="h-6 w-20 rounded-md bg-white/[0.04]" />;
}
