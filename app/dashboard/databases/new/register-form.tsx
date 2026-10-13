"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandChip, type Brand } from "@/components/brand-chip";
import { Icon } from "@/components/icons";
import { Badge, Button, Callout, Card, Input, Label, Select } from "@/components/ui";
import { servers } from "@/lib/data";
import { cn } from "@/lib/utils";

const engines: { name: Brand; port: string; planned?: boolean }[] = [
  { name: "PostgreSQL", port: "5432" },
  { name: "MySQL", port: "3306" },
  { name: "MariaDB", port: "3306" },
  { name: "Redis", port: "6379" },
  { name: "MongoDB", port: "27017", planned: true },
  { name: "SQLite", port: "", planned: true },
  { name: "SQL Server", port: "1433", planned: true },
];

const modes = [
  { id: "local", title: "Local service", desc: "Installed on an enrolled server (systemd).", icon: "server" },
  { id: "docker", title: "Docker container", desc: "Running in a container on an enrolled server.", icon: "container" },
  { id: "remote", title: "Remote endpoint", desc: "Managed or external host, reached over TLS.", icon: "globe" },
] as const;

type TestState = "idle" | "testing" | "ok";

export function RegisterForm() {
  const router = useRouter();
  const [engine, setEngine] = useState<Brand>("PostgreSQL");
  const [mode, setMode] = useState<(typeof modes)[number]["id"]>("local");
  const [test, setTest] = useState<TestState>("idle");
  const port = engines.find((e) => e.name === engine)?.port ?? "";
  const isRedis = engine === "Redis";

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        router.push("/dashboard/databases/pg-main");
      }}
    >
      <Card className="p-5 sm:p-6">
        <h2 className="font-medium">Engine</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {engines.map((e) => (
            <button
              key={e.name}
              type="button"
              disabled={e.planned}
              onClick={() => {
                setEngine(e.name);
                setTest("idle");
              }}
              className={cn(
                "flex items-center gap-3 rounded-md border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                engine === e.name ? "border-fg bg-white/[0.04]" : "border-line hover:border-line-strong",
              )}
            >
              <BrandChip name={e.name} size={26} />
              <span className="min-w-0">
                <span className="block truncate text-sm">{e.name}</span>
                {e.planned && <span className="block text-[11px] text-subtle">Later release</span>}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="font-medium">Connection mode</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {modes.map((m) => (
            <label
              key={m.id}
              className={cn("cursor-pointer rounded-md border p-4 transition-colors", mode === m.id ? "border-fg bg-white/[0.04]" : "border-line hover:border-line-strong")}
            >
              <input type="radio" name="mode" className="sr-only" checked={mode === m.id} onChange={() => setMode(m.id)} />
              <Icon name={m.icon} />
              <span className="mt-3 block text-sm font-medium">{m.title}</span>
              <span className="mt-1 block text-xs text-muted">{m.desc}</span>
            </label>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="dbname">Display name</Label>
            <Input id="dbname" placeholder={isRedis ? "redis-sessions" : "pg-orders"} required />
          </div>
          <div>
            <Label htmlFor="env">Environment</Label>
            <Select id="env" defaultValue="production">
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="internal">Internal</option>
            </Select>
          </div>
          {mode !== "remote" ? (
            <>
              <div>
                <Label htmlFor="srv">Server</Label>
                <Select id="srv" defaultValue="db-primary">
                  {servers
                    .filter((s) => s.status !== "offline")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="target">{mode === "docker" ? "Container" : "Socket or local address"}</Label>
                <Input id="target" className="font-mono" defaultValue={mode === "docker" ? "" : `127.0.0.1:${port}`} placeholder={mode === "docker" ? "postgres-main" : ""} />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="host">Host</Label>
                <Input id="host" className="font-mono" placeholder="db.example.net" />
              </div>
              <div>
                <Label htmlFor="port">Port</Label>
                <Input id="port" className="font-mono" defaultValue={port} />
              </div>
            </>
          )}
        </div>

        {mode === "remote" && (
          <div className="mt-4">
            <Callout tone="warn" icon="shield" title="Trusted target registration">
              Remote endpoints must resolve to a public address or an explicitly trusted private range. TLS certificates are validated; plaintext connections are refused.
            </Callout>
          </div>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Credentials</h2>
          <Badge tone="ok">
            <Icon name="lock" size={11} /> Encrypted at rest
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted">Use a dedicated least-privileged account. Superuser credentials are not required for monitoring or browsing.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {!isRedis && (
            <div>
              <Label htmlFor="user">Username</Label>
              <Input id="user" className="font-mono" defaultValue="vpspilot_monitor" autoComplete="off" />
            </div>
          )}
          {isRedis && (
            <div>
              <Label htmlFor="acl">ACL user</Label>
              <Input id="acl" className="font-mono" defaultValue="vpspilot-ro" autoComplete="off" />
            </div>
          )}
          <div>
            <Label htmlFor="secret" hint="Write-only">
              Password
            </Label>
            <Input id="secret" type="password" autoComplete="new-password" placeholder="••••••••••••" />
          </div>
          {!isRedis && (
            <div>
              <Label htmlFor="defaultdb">Default database</Label>
              <Input id="defaultdb" className="font-mono" placeholder={engine === "PostgreSQL" ? "postgres" : "mysql"} />
            </div>
          )}
          <div>
            <Label htmlFor="tls">TLS</Label>
            <Select id="tls" defaultValue={mode === "remote" ? "verify-full" : "prefer"}>
              <option value="verify-full">Require & verify certificate</option>
              <option value="require">Require</option>
              <option value="prefer" disabled={mode === "remote"}>
                Prefer (local only)
              </option>
            </Select>
          </div>
        </div>
        <div className="mt-5 grid gap-3 text-xs sm:grid-cols-3">
          {[
            ["Query timeout", "30 seconds"],
            ["Result limit", "1,000 rows · 5 MB"],
            ["Default access", "Read-only"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-line bg-bg p-3">
              <div className="text-subtle">{k}</div>
              <div className="mt-0.5 text-fg">{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-3 rounded-lg border border-line bg-bg p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3 text-sm">
          {test === "idle" && (
            <>
              <Icon name="info" className="text-subtle" />
              <span className="text-muted">Test the connection through the agent before saving.</span>
            </>
          )}
          {test === "testing" && (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <span className="text-muted">Connecting via agent on db-primary…</span>
            </>
          )}
          {test === "ok" && (
            <>
              <Icon name="check-circle" className="text-ok" />
              <span>
                Connected · {engine} {isRedis ? "7.4.1" : engine === "PostgreSQL" ? "16.4" : "8.0.39"} · 12 ms · TLS 1.3
              </span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="md"
            icon="zap"
            onClick={() => {
              setTest("testing");
              setTimeout(() => setTest("ok"), 1200);
            }}
          >
            Test Connection
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={test !== "ok"}>
            Register
          </Button>
        </div>
      </div>
    </form>
  );
}
