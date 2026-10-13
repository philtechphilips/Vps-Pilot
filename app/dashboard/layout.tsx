import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountMenu, CommandMenu, NotificationsMenu } from "@/components/dashboard/nav";
import { MobileNav, SectionCrumb, SectionCrumbFallback, Sidebar, SidebarFallback } from "@/components/dashboard/shell";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/ui";
import { SearchButton } from "@/components/dashboard/search-button";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s – VPSPilot" },
};

function Crumb({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] whitespace-nowrap text-fg transition-colors hover:bg-white/[0.06]">
      {children}
      <Icon name="chevrons-up-down" size={12} className="text-subtle" />
    </button>
  );
}

const Slash = () => <span className="text-[#3a3a3a] select-none">/</span>;

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="theme-console min-h-dvh bg-black">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] flex-col overflow-y-auto bg-black lg:flex">
        <Suspense fallback={<SidebarFallback />}>
          <Sidebar />
        </Suspense>
      </aside>

      <div className="flex min-h-dvh flex-col lg:pl-[220px]">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 bg-black px-3 sm:px-4">
          <Suspense fallback={null}>
            <MobileNav />
          </Suspense>
          <nav aria-label="Breadcrumb" className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto">
            <Crumb>
              <Avatar name="Pelumi" size={18} />
              <span className="hidden sm:inline">Pelumi’s Servers</span>
              <span className="rounded-full bg-accent px-1.5 py-px text-[10px] font-semibold text-white">Owner</span>
            </Crumb>
            <Slash />
            <Crumb>
              <Icon name="rocket" size={14} className="text-subtle" />
              Production
            </Crumb>
            <Slash />
            <Suspense fallback={<SectionCrumbFallback />}>
              <SectionCrumb />
            </Suspense>
          </nav>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <SearchButton />
            <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />
            <NotificationsMenu />
            <AccountMenu />
          </div>
        </header>

        <main className="flex flex-1 flex-col lg:pr-2">
          <div className="flex-1 border-t border-white/[0.06] bg-panel lg:rounded-tl-2xl lg:rounded-tr-2xl lg:border-x">{children}</div>
        </main>
      </div>
      <CommandMenu />
    </div>
  );
}
