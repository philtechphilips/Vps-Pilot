"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandChip } from "@/components/brand-chip";
import { Icon } from "@/components/icons";
import { Button, Callout, Card, Input, Label, Select } from "@/components/ui";
import { DEFAULT_PORTS, ENGINE_BRAND, ENGINE_VERSIONS, type Engine, type TlsMode, useCreateDatabase } from "@/lib/api/databases";
import { CA_PATTERN, TlsFields } from "../[id]/extras";
import { useServers } from "@/lib/api/servers";
import { cn } from "@/lib/utils";

const NAME = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
const IDENT = /^[a-z_][a-z0-9_]{0,62}$/;
// Traffic to the server's own localhost never leaves it: TLS isn't needed.
const LOCAL = /^(127\.\d+\.\d+\.\d+|localhost|\[?::1\]?)$/i;

export function RegisterForm() {
  const router = useRouter();
  const { data: servers } = useServers();
  const create = useCreateDatabase();
  const [mode, setMode] = useState<"managed" | "external">("managed");
  const [engine, setEngine] = useState<Engine>("postgres");
  const [name, setName] = useState("main");
  const [serverId, setServerId] = useState("");
  const [version, setVersion] = useState("");
  const [database, setDatabase] = useState("");
  const [localPort, setLocalPort] = useState("");
  const [host, setHost] = useState("127.0.0.1");
  const [port, setPort] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [tlsChoice, setTls] = useState<Exclude<TlsMode, "prefer"> | null>(null);
  const [ca, setCa] = useState("");
  const tls = tlsChoice ?? (LOCAL.test(host.trim()) ? "disable" : "verify");

  const usable = (servers ?? []).filter((s) => s.enrolled_at && s.status !== "revoked");
  const target = serverId || usable.find((s) => s.status === "online")?.id || usable[0]?.id || "";
  const redis = engine === "redis";
  const defaultDb = name.replace(/-/g, "_");

  const problem = !NAME.test(name)
    ? "Name: lowercase letters, numbers and dashes"
    : !target
      ? "Enroll a server first"
      : mode === "managed" && !redis && database && !IDENT.test(database)
        ? "Database names use lowercase letters, numbers and _"
        : mode === "external" && !host.trim()
          ? "Enter the host"
          : mode === "external" && tls === "verify" && ca.trim() && !CA_PATTERN.test(ca.trim())
            ? "The CA certificate isn't valid PEM"
            : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problem) return;
    const body =
      mode === "managed"
        ? {
            mode,
            name,
            server_id: target,
            engine,
            version: version || ENGINE_VERSIONS[engine][0],
            ...(redis ? {} : { database: database || defaultDb }),
            ...(localPort ? { local_port: Number(localPort) } : {}),
          }
        : {
            mode,
            name,
            server_id: target,
            engine,
            host: host.trim(),
            port: Number(port) || DEFAULT_PORTS[engine],
            ...(redis ? {} : { user: user.trim() || (engine === "postgres" ? "postgres" : "root"), database: database || undefined }),
            ...(password ? { password } : {}),
            tls_mode: tls,
            ...(tls === "verify" && ca.trim() ? { ca: ca.trim() } : {}),
          };
    create.mutate(body, { onSuccess: (r) => router.push(`/dashboard/databases/${r.database.id}`) });
  };

  return (
    <form className="space-y-6" onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["managed", "sparkles", "Create a new database", "VPSPilot runs it in Docker on your server, private by default, and gives your apps their connection details."],
            ["external", "link", "Connect an existing one", "A database you already run on a server (installed with apt, in Docker, or elsewhere it can reach)."],
          ] as const
        ).map(([value, icon, title, desc]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              mode === value ? "border-accent/60 bg-accent/10" : "border-line bg-bg-100 hover:border-line-strong",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Icon name={icon} size={15} className="text-accent-fg" /> {title}
            </span>
            <span className="mt-1.5 block text-xs leading-relaxed text-muted">{desc}</span>
          </button>
        ))}
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="font-medium">Engine</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(ENGINE_BRAND) as Engine[]).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                setEngine(e);
                setVersion("");
              }}
              className={cn(
                "flex items-center gap-3 rounded-md border p-3 text-left transition-colors",
                engine === e ? "border-fg bg-ink/[0.04]" : "border-line hover:border-line-strong",
              )}
            >
              <BrandChip name={ENGINE_BRAND[e]} size={26} />
              <span className="text-sm">{ENGINE_BRAND[e]}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-5 p-5 sm:p-6">
        <h2 className="font-medium">{mode === "managed" ? "Details" : "Connection"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="dbname" hint="shown in VPSPilot">
              Name
            </Label>
            <Input id="dbname" value={name} onChange={(e) => setName(e.target.value.toLowerCase())} className="font-mono" />
          </div>
          <div>
            <Label htmlFor="server">{mode === "managed" ? "Run it on" : "Reach it from"}</Label>
            {usable.length ? (
              <Select id="server" value={target} onChange={(e) => setServerId(e.target.value)}>
                {usable.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.status === "online" ? "" : `(${s.status})`}
                  </option>
                ))}
              </Select>
            ) : (
              <Link href="/dashboard/servers/new" className="flex h-10 items-center gap-2 rounded-md border border-dashed border-line-strong px-3 text-sm text-muted hover:text-fg">
                <Icon name="plus" size={14} /> Enroll a server
              </Link>
            )}
          </div>
        </div>

        {mode === "managed" ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="ver">Version</Label>
              <Select id="ver" value={version || ENGINE_VERSIONS[engine][0]} onChange={(e) => setVersion(e.target.value)}>
                {ENGINE_VERSIONS[engine].map((v) => (
                  <option key={v} value={v}>
                    {ENGINE_BRAND[engine]} {v}
                  </option>
                ))}
              </Select>
            </div>
            {!redis && (
              <div>
                <Label htmlFor="defdb">First database</Label>
                <Input id="defdb" placeholder={defaultDb} value={database} onChange={(e) => setDatabase(e.target.value.toLowerCase())} className="font-mono" />
              </div>
            )}
            <div>
              <Label htmlFor="lp" hint="optional">
                Port on the server
              </Label>
              <Input id="lp" inputMode="numeric" placeholder="none" value={localPort} onChange={(e) => setLocalPort(e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="host" hint="as seen from the server">
                Host
              </Label>
              <Input id="host" value={host} onChange={(e) => setHost(e.target.value)} className="font-mono" />
            </div>
            <div>
              <Label htmlFor="port">Port</Label>
              <Input id="port" inputMode="numeric" placeholder={String(DEFAULT_PORTS[engine])} value={port} onChange={(e) => setPort(e.target.value.replace(/\D/g, ""))} className="font-mono" />
            </div>
            {!redis && (
              <div>
                <Label htmlFor="user">User</Label>
                <Input id="user" placeholder={engine === "postgres" ? "postgres" : "root"} value={user} onChange={(e) => setUser(e.target.value)} className="font-mono" />
              </div>
            )}
            <div>
              <Label htmlFor="pw" hint="encrypted, never shown again in logs">
                Password
              </Label>
              <Input id="pw" type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {!redis && (
              <div>
                <Label htmlFor="db2" hint="optional">
                  Database
                </Label>
                <Input id="db2" value={database} onChange={(e) => setDatabase(e.target.value.toLowerCase())} className="font-mono" />
              </div>
            )}
            <div className="sm:col-span-2">
              <Label>Connection security</Label>
              <TlsFields mode={tls} onMode={setTls} ca={ca} onCa={setCa} />
            </div>
          </div>
        )}

        <div className="rounded-md border border-line bg-bg p-3 text-xs leading-relaxed text-muted">
          {mode === "managed" ? (
            <>
              <span className="text-fg">Private by default.</span> It runs as the container <span className="font-mono text-fg">vpdb-{name || "name"}</span> on a private network.
              Apps on the same server reach it by that name; nothing is exposed to the internet.
              {localPort && " The port above is opened on 127.0.0.1 only, for SSH tunnels and tools on the server."}
            </>
          ) : (
            <>
              VPSPilot connects from the server, using a short-lived client container, so nothing needs installing. For a database installed on the server itself,
              use <span className="font-mono text-fg">127.0.0.1</span>. It tests the connection right away.
            </>
          )}
        </div>

        {create.error && (
          <Callout tone="err" icon="x-circle">
            {create.error.message}
          </Callout>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-subtle">{problem}</span>
          <Button type="submit" variant="primary" size="md" disabled={!!problem || create.isPending}>
            {create.isPending ? "Working…" : mode === "managed" ? `Create ${ENGINE_BRAND[engine]}` : "Connect"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
