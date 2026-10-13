"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { Avatar, Kbd } from "@/components/ui";
import { apps, databases, servers } from "@/lib/data";
import { cn } from "@/lib/utils";

export const tabs: { label: string; href: string; icon: IconName }[] = [
  { label: "Overview", href: "/dashboard", icon: "grid" },
  { label: "Servers", href: "/dashboard/servers", icon: "server" },
  { label: "Applications", href: "/dashboard/applications", icon: "box" },
  { label: "Deployments", href: "/dashboard/deployments", icon: "rocket" },
  { label: "Databases", href: "/dashboard/databases", icon: "database" },
  { label: "Domains", href: "/dashboard/domains", icon: "globe" },
  { label: "Monitoring", href: "/dashboard/monitoring", icon: "activity" },
  { label: "Logs", href: "/dashboard/logs", icon: "file-text" },
  { label: "Backups", href: "/dashboard/backups", icon: "archive" },
  { label: "Audit", href: "/dashboard/audit", icon: "shield" },
  { label: "Settings", href: "/dashboard/settings", icon: "settings" },
];

/* ------------------------------------------------------------------ */
/* Command menu (⌘K)                                                   */
/* ------------------------------------------------------------------ */

type Cmd = { group: string; label: string; href: string; icon: IconName; hint?: string };

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const all = useMemo<Cmd[]>(
    () => [
      { group: "Actions", label: "Enroll a server", href: "/dashboard/servers/new", icon: "plus" },
      { group: "Actions", label: "Register a database", href: "/dashboard/databases/new", icon: "plus" },
      { group: "Actions", label: "New application", href: "/dashboard/applications/new", icon: "plus" },
      ...tabs.map((t) => ({ group: "Navigation", label: t.label, href: t.href, icon: t.icon })),
      ...servers.map((s) => ({ group: "Servers", label: s.name, href: `/dashboard/servers/${s.id}`, icon: "server" as const, hint: s.ip })),
      ...apps.map((a) => ({ group: "Applications", label: a.name, href: `/dashboard/applications/${a.id}`, icon: "box" as const, hint: a.runtime })),
      ...databases.map((d) => ({ group: "Databases", label: d.name, href: `/dashboard/databases/${d.id}`, icon: "database" as const, hint: d.engine })),
    ],
    [],
  );

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? all.filter((c) => `${c.label} ${c.hint ?? ""} ${c.group}`.toLowerCase().includes(s)) : all.slice(0, 14);
  }, [all, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-menu", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-menu", onOpen);
    };
  }, []);

  if (!open) return null;

  const go = (c: Cmd | undefined) => {
    if (!c) return;
    setOpen(false);
    setQ("");
    router.push(c.href);
  };

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-[2px]" onMouseDown={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-[640px] animate-fade-up overflow-hidden rounded-xl border border-line-strong bg-bg-100 shadow-[0_24px_80px_rgb(0_0_0/0.7)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Icon name="search" className="text-subtle" />
          <input
            ref={inputRef}
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIdx((i) => Math.min(results.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIdx((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                go(results[idx]);
              }
            }}
            placeholder="Search servers, apps, databases or jump to…"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-subtle"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div className="thin-scrollbar max-h-[380px] overflow-y-auto p-2">
          {results.length === 0 && <p className="px-3 py-10 text-center text-sm text-muted">No results for “{q}”</p>}
          {results.map((c, i) => {
            const header = c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            return (
              <div key={`${c.group}-${c.href}`}>
                {header && <div className="px-3 pt-3 pb-1.5 text-xs text-subtle">{header}</div>}
                <button
                  type="button"
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => go(c)}
                  className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm", i === idx ? "bg-white/[0.08] text-fg" : "text-muted")}
                >
                  <Icon name={c.icon} />
                  <span className="flex-1">{c.label}</span>
                  {c.hint && <span className="font-mono text-xs text-subtle">{c.hint}</span>}
                  {i === idx && <Icon name="arrow-right" size={14} />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 border-t border-line bg-bg-200 px-4 py-2.5 text-xs text-subtle">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↵</Kbd> open
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Menus                                                               */
/* ------------------------------------------------------------------ */

export function Dropdown({
  trigger,
  children,
  align = "right",
  width = "w-60",
  label,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  width?: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" aria-label={label} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)} className="flex items-center">
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className={cn(
            "absolute top-full z-50 mt-2 animate-fade-up rounded-xl border border-line-strong bg-bg-100 p-1.5 shadow-[0_16px_48px_rgb(0_0_0/0.6)]",
            align === "right" ? "right-0" : "left-0",
            width,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ href, icon, children, danger, hint }: { href: string; icon?: IconName; children: React.ReactNode; danger?: boolean; hint?: string }) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-white/[0.06]",
        danger ? "text-err" : "text-muted hover:text-fg",
      )}
    >
      {icon && <Icon name={icon} />}
      <span className="flex-1">{children}</span>
      {hint && <span className="text-xs text-subtle">{hint}</span>}
    </Link>
  );
}

export function AccountMenu() {
  return (
    <Dropdown label="Account menu" trigger={<Avatar name="owner" size={30} />}>
      <div className="px-2.5 pt-2 pb-2.5">
        <p className="text-sm font-medium text-fg">Owner</p>
        <p className="text-[13px] text-muted">owner@example.com</p>
      </div>
      <div className="my-1 h-px bg-line" />
      <MenuItem href="/dashboard" icon="grid">Dashboard</MenuItem>
      <MenuItem href="/dashboard/settings" icon="settings">Account Settings</MenuItem>
      <MenuItem href="/dashboard/settings#sessions" icon="key">Sessions</MenuItem>
      <MenuItem href="/dashboard/audit" icon="shield">Audit Log</MenuItem>
      <div className="my-1 h-px bg-line" />
      <MenuItem href="/" icon="external-link">Home Page</MenuItem>
      <MenuItem href="/login" icon="log-out">Log Out</MenuItem>
    </Dropdown>
  );
}

export function AddNewMenu() {
  return (
    <Dropdown
      label="Add new"
      width="w-56"
      trigger={
        <span className="btn-primary inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium">
          Add New… <Icon name="chevron-down" size={14} />
        </span>
      }
    >
      <MenuItem href="/dashboard/servers/new" icon="server">Server</MenuItem>
      <MenuItem href="/dashboard/applications/new" icon="box">Application</MenuItem>
      <MenuItem href="/dashboard/databases/new" icon="database">Database</MenuItem>
      <MenuItem href="/dashboard/domains" icon="globe">Domain</MenuItem>
      <MenuItem href="/dashboard/backups" icon="archive">Backup</MenuItem>
    </Dropdown>
  );
}

export function NotificationsMenu() {
  return (
    <Dropdown
      label="Notifications"
      width="w-[340px]"
      trigger={
        <span className="relative inline-flex size-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-fg">
          <Icon name="bell" />
          <span className="absolute top-1 right-1 size-2 rounded-full border-2 border-bg bg-blue-fg" />
        </span>
      }
    >
      <div className="flex items-center justify-between px-2.5 py-2">
        <p className="text-sm font-medium">Inbox</p>
        <Link href="/dashboard/monitoring" className="text-xs text-muted hover:text-fg">
          View all
        </Link>
      </div>
      {[
        { t: "staging-01 agent is offline", s: "18m ago", tone: "bg-err" },
        { t: "metabase deployment failed health check", s: "26m ago", tone: "bg-err" },
        { t: "db-primary memory above 85%", s: "42m ago", tone: "bg-warn" },
        { t: "pg-main restore verified on pg-restore-test", s: "11m ago", tone: "bg-ok" },
      ].map((n) => (
        <Link key={n.t} href="/dashboard/monitoring" className="flex gap-3 rounded-md px-2.5 py-2.5 hover:bg-white/[0.05]">
          <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.tone)} />
          <span className="min-w-0">
            <span className="block text-[13px] text-fg">{n.t}</span>
            <span className="block text-xs text-subtle">{n.s}</span>
          </span>
        </Link>
      ))}
    </Dropdown>
  );
}
