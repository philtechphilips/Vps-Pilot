"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { docHref, sections } from "@/lib/docs/nav";
import { cn } from "@/lib/utils";

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  return (
    <nav aria-label="Documentation" className="space-y-5 pb-10 text-[13.5px]">
      {sections.map((s) => {
        const open = !closed[s.title];
        return (
          <div key={s.title}>
            <button
              type="button"
              onClick={() => setClosed((c) => ({ ...c, [s.title]: open }))}
              aria-expanded={open}
              className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left font-medium text-fg transition-colors hover:bg-ink/[0.04]"
            >
              {s.title}
              <Icon name="chevron-down" size={14} className={cn("text-subtle transition-transform", !open && "-rotate-90")} />
            </button>
            {open && (
              <ul className="mt-1 ml-2 space-y-px border-l border-ink/[0.08] pl-2">
                {s.pages.map((p) => {
                  const href = docHref(p.slug);
                  const active = pathname === href;
                  return (
                    <li key={p.slug}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block rounded-md px-2.5 py-[5px] transition-colors",
                          active ? "bg-accent/[0.07] font-medium text-accent" : "text-muted hover:bg-ink/[0.04] hover:text-fg",
                        )}
                      >
                        {p.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function DocsSidebar() {
  return (
    <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 border-r border-ink/[0.06] lg:block">
      <div className="thin-scrollbar h-full overflow-y-auto px-4 pt-6">
        <Nav />
      </div>
    </aside>
  );
}

/** Below lg the sidebar lives in a drawer opened from the header. */
export function DocsMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open documentation menu"
        className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-ink/[0.06] hover:text-fg lg:hidden"
      >
        <Icon name="menu" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Documentation menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] animate-[slide-in_0.25s_var(--ease-out-expo)] flex-col border-r border-ink/10 bg-bg">
            <div className="flex h-14 items-center justify-between border-b border-ink/[0.06] px-4">
              <span className="text-sm font-medium">Documentation</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-ink/[0.06] hover:text-fg"
              >
                <Icon name="x" />
              </button>
            </div>
            <div className="thin-scrollbar flex-1 overflow-y-auto px-3 pt-4">
              <Nav key={pathname} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
