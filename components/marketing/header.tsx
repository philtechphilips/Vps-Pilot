"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Logotype } from "@/components/logo";
import { cn } from "@/lib/utils";

const product = [
  { title: "Servers", desc: "Enroll Ubuntu & Debian hosts", icon: "server", href: "#product" },
  { title: "Deployments", desc: "Docker or systemd from Git", icon: "rocket", href: "#product" },
  { title: "Databases", desc: "PostgreSQL, MySQL, Redis", icon: "database", href: "#product" },
  { title: "Monitoring", desc: "Metrics, alerts and logs", icon: "activity", href: "#features" },
  { title: "Domains & TLS", desc: "Validated proxy config", icon: "globe", href: "#features" },
  { title: "Backups", desc: "Encrypted, restore-tested", icon: "archive", href: "#features" },
] as const;

const links = [
  { label: "Docs", href: "/docs" },
  { label: "Security", href: "#security" },
  { label: "Changelog", href: "#changelog" },
];

/** Floating glass navbar that tightens once the page scrolls. */
export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
      <div
        className={cn(
          "mx-auto flex h-14 animate-[slide-down_0.8s_var(--ease-out-expo)_both] items-center gap-2 rounded-2xl border px-2.5 transition-all duration-300",
          scrolled
            ? "max-w-[980px] border-white/10 bg-[#0a0a0a]/75 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.8)] backdrop-blur-xl"
            : "max-w-[1180px] border-transparent bg-transparent",
        )}
      >
        <Link href="/" className="flex h-9 items-center rounded-xl px-2" aria-label="VPSPilot home">
          <Logotype className="text-[19px]" />
        </Link>

        <nav className="mx-auto hidden items-center gap-0.5 text-[13px] text-muted md:flex">
          <div className="relative" onMouseEnter={() => setMenu(true)} onMouseLeave={() => setMenu(false)}>
            <button
              type="button"
              className="flex h-9 items-center gap-1 rounded-xl px-3.5 transition-colors hover:bg-white/[0.06] hover:text-fg"
              aria-expanded={menu}
              onClick={() => setMenu((m) => !m)}
            >
              Product <Icon name="chevron-down" size={13} className={cn("transition-transform", menu && "rotate-180")} />
            </button>
            {menu && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3">
                <div className="grid w-[540px] animate-fade-up grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-[#0a0a0a]/95 p-2 shadow-[0_24px_60px_-12px_rgb(0_0_0/0.9)] backdrop-blur-xl">
                  {product.map((p) => (
                    <a key={p.title} href={p.href} onClick={() => setMenu(false)} className="group flex gap-3 rounded-xl p-3 transition-colors hover:bg-white/[0.05]">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-muted transition-colors group-hover:text-fg">
                        <Icon name={p.icon} />
                      </span>
                      <span>
                        <span className="block text-sm text-fg">{p.title}</span>
                        <span className="block text-[13px] text-muted">{p.desc}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          {links.map((l) => (
            <a key={l.label} href={l.href} className="flex h-9 items-center rounded-xl px-3.5 transition-colors hover:bg-white/[0.06] hover:text-fg">
              {l.label}
            </a>
          ))}
          <Link href="/dashboard" className="flex h-9 items-center rounded-xl px-3.5 transition-colors hover:bg-white/[0.06] hover:text-fg">
            Demo
          </Link>
        </nav>

        <div className="ml-auto hidden items-center gap-1.5 md:ml-0 md:flex">
          <a href="#" aria-label="GitHub repository" className="flex size-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-white/[0.06] hover:text-fg">
            <Icon name="github" />
          </a>
          <Link href="/login" className="flex h-9 items-center rounded-xl px-3.5 text-[13px] text-muted transition-colors hover:bg-white/[0.06] hover:text-fg">
            Log in
          </Link>
          <Link
            href="/docs/getting-started/install"
            className="btn-primary group flex h-9 items-center gap-1.5 rounded-xl pr-3 pl-4 text-[13px] font-medium"
          >
            Get started
            <Icon name="arrow-right" size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? "x" : "menu"} />
        </button>
      </div>

      {open && (
        <div className="mx-auto mt-2 max-w-[980px] animate-fade-up rounded-2xl border border-white/10 bg-[#0a0a0a]/95 p-3 backdrop-blur-xl md:hidden">
          <nav className="grid grid-cols-2 gap-1">
            {product.map((p) => (
              <a key={p.title} href={p.href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl p-3 text-sm text-muted hover:bg-white/[0.05]">
                <Icon name={p.icon} /> {p.title}
              </a>
            ))}
          </nav>
          <div className="my-2 h-px bg-white/[0.06]" />
          <nav className="flex flex-col">
            {links.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-white/[0.05]">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link href="/login" className="flex h-11 items-center justify-center rounded-xl border border-white/10 text-sm">
              Log in
            </Link>
            <Link href="/docs/getting-started/install" className="btn-primary flex h-11 items-center justify-center rounded-xl text-sm font-medium">
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
