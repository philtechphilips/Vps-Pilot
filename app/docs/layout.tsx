import type { Metadata } from "next";
import Link from "next/link";
import { DocsSearch } from "@/components/docs/search";
import { DocsMobileNav, DocsSidebar } from "@/components/docs/sidebar";
import { Icon } from "@/components/icons";
import { Logotype } from "@/components/logo";

export const metadata: Metadata = {
  title: { default: "Documentation", template: "%s – VPSPilot Docs" },
};

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-3 sm:px-4">
          <DocsMobileNav />
          <Link href="/docs" className="flex shrink-0 items-center gap-2.5" aria-label="VPSPilot documentation home">
            <Logotype className="text-[17px]" />
            <span className="rounded-md border border-black/10 bg-black/[0.04] px-1.5 py-0.5 text-[11px] font-medium tracking-wide text-muted uppercase">Docs</span>
          </Link>
          <div className="mx-auto w-full max-w-md min-w-0 pl-2">
            <DocsSearch />
          </div>
          <nav className="hidden shrink-0 items-center gap-1 text-[13px] text-muted md:flex">
            <Link href="/" className="flex h-9 items-center rounded-lg px-3 transition-colors hover:bg-black/[0.06] hover:text-fg">
              Home
            </Link>
            <Link href="/dashboard" className="flex h-9 items-center gap-1.5 rounded-lg px-3 transition-colors hover:bg-black/[0.06] hover:text-fg">
              Dashboard <Icon name="arrow-up-right" size={13} />
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        <DocsSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
