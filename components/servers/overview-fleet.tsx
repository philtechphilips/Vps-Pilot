"use client";

import Link from "next/link";
import { FleetMap } from "@/components/dashboard/fleet-map";
import { Icon } from "@/components/icons";
import { Card, Dot } from "@/components/ui";
import { useServers } from "@/lib/api/servers";
import { osLabel, statusTone } from "@/components/servers/server-ui";

/** "My Servers" stat value from the live fleet. */
export function ServerCount() {
  const servers = useServers();
  return <>{servers.data ? servers.data.length : "–"}</>;
}

/** Agents row: one ring per server, coloured by status. */
export function AgentsCard() {
  const servers = useServers();
  const list = servers.data ?? [];
  const online = list.filter((s) => s.status === "online").length;

  return (
    <Card className="flex flex-col p-3">
      <div className="flex items-center justify-between rounded-xl bg-[#141414] px-3 py-2.5">
        <span className="text-xs text-muted">
          Agents <span className="text-subtle">·</span>{" "}
          <span className="text-fg">{servers.data ? `${online} of ${list.length} online` : "loading…"}</span>
        </span>
        <Link href="/dashboard/servers/new" className="flex size-7 items-center justify-center rounded-full border border-line-strong text-muted hover:text-fg" aria-label="Enroll server">
          <Icon name="plus" size={14} />
        </Link>
      </div>
      {servers.data && list.length === 0 ? (
        <Link
          href="/dashboard/servers/new"
          className="m-1 mt-3 flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong p-4 text-sm text-muted transition-colors hover:border-accent/50 hover:text-fg"
        >
          <Icon name="plus" size={14} /> Enroll your first server
        </Link>
      ) : (
        <div className="grid flex-1 grid-cols-6 items-center gap-2 px-1 pt-4 pb-2">
          {list.slice(0, 12).map((s) => {
            const on = s.status === "online";
            return (
              <Link key={s.id} href={`/dashboard/servers/${s.id}`} title={`${s.name} · ${s.status}`} className="group flex flex-col items-center gap-2">
                <span
                  className={`relative flex size-12 items-center justify-center rounded-full border-2 bg-[#141414] transition-transform group-hover:scale-105 ${
                    on ? "border-accent/80 text-accent-fg" : s.status === "pending" ? "border-dashed border-white/20 text-subtle" : "border-white/10 text-subtle"
                  }`}
                >
                  <Icon name={s.status === "revoked" ? "lock" : s.is_control_plane ? "shield" : "server"} size={18} />
                  {on && <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-bg-100 bg-ok" />}
                  {s.status === "offline" && <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-bg-100 bg-err" />}
                </span>
                <span className="w-full truncate text-center text-[10px] text-subtle">{s.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/** Fleet panel: decorative world map plus the live server list.
 *  Server locations aren't known yet (no provider integration). */
export function FleetCard() {
  const servers = useServers();
  const list = servers.data ?? [];
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[11px] text-muted">Fleet</h2>
        <span className="text-[11px] text-subtle">
          {list.length} server{list.length === 1 ? "" : "s"}
        </span>
      </div>
      <FleetMap />
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        {list.map((s) => (
          <Link key={s.id} href={`/dashboard/servers/${s.id}`} className="flex items-center gap-2 hover:text-fg">
            <Dot tone={statusTone[s.status]} />
            {s.name}
            <span className="text-subtle">{s.status === "pending" ? "pending" : osLabel(s)}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
