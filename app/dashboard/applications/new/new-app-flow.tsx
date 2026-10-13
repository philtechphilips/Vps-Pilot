"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandChip, type Brand } from "@/components/brand-chip";
import { Icon } from "@/components/icons";
import { Badge, Button, Card, Input, Label, Select } from "@/components/ui";
import { servers } from "@/lib/data";
import { cn } from "@/lib/utils";

const repos: { name: string; fw: Brand; updated: string }[] = [
  { name: "billing-service", fw: "FastAPI", updated: "2h ago" },
  { name: "docs", fw: "Next.js", updated: "1d ago" },
  { name: "image-resizer", fw: "Go", updated: "3d ago" },
  { name: "admin-panel", fw: "Node.js", updated: "5d ago" },
  { name: "ml-scoring", fw: "Python", updated: "1w ago" },
];

const runtimes = [
  { id: "Docker", title: "Docker", desc: "Build from Dockerfile or Compose, or pull a pinned image." },
  { id: "systemd", title: "Native · systemd", desc: "Versioned release directories for Node.js and Python." },
  { id: "PM2", title: "Native · PM2", desc: "Optional compatibility for existing PM2 setups." },
] as const;

export function NewAppFlow() {
  const router = useRouter();
  const [repo, setRepo] = useState<string | null>("billing-service");
  const [runtime, setRuntime] = useState<(typeof runtimes)[number]["id"]>("Docker");
  const [deploying, setDeploying] = useState(false);
  const selected = repos.find((r) => r.name === repo);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <Card className="h-fit p-5 sm:p-6">
        <h2 className="text-xl font-semibold tracking-tight">Import Git Repository</h2>
        <div className="mt-5 flex gap-2">
          <button type="button" className="flex h-10 items-center gap-2 rounded-md border border-line-strong bg-bg px-3 text-sm">
            <Icon name="github" /> acme <Icon name="chevron-down" size={14} className="text-subtle" />
          </button>
          <Input icon="search" placeholder="Search…" className="flex-1" />
        </div>
        <div className="mt-4 overflow-hidden rounded-md border border-line">
          {repos.map((r) => (
            <div key={r.name} className={cn("flex items-center gap-3 border-b border-line px-4 py-3 last:border-0", repo === r.name && "bg-white/[0.03]")}>
              <BrandChip name={r.fw} size={24} className="rounded-full" />
              <span className="min-w-0 flex-1 truncate text-sm">
                {r.name} <span className="text-subtle">· {r.updated}</span>
              </span>
              <Button variant={repo === r.name ? "primary" : "secondary"} size="xs" onClick={() => setRepo(r.name)}>
                {repo === r.name ? "Selected" : "Import"}
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-md border border-dashed border-line-strong p-4 text-sm text-muted">
          <Icon name="container" />
          <span className="flex-1">Deploy a container image by digest instead</span>
          <Icon name="arrow-right" size={14} />
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold tracking-tight">Configure</h2>
        {selected ? (
          <form
            className="mt-5 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              setDeploying(true);
              setTimeout(() => router.push("/dashboard/deployments/dpl_7Hq2kPz9"), 900);
            }}
          >
            <div className="flex items-center gap-2 rounded-md bg-bg-200 px-3 py-2.5 text-sm">
              <Icon name="github" />
              acme/{selected.name}
              <Icon name="git-branch" size={14} className="ml-2 text-subtle" />
              <span className="text-muted">main</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="appname">Application name</Label>
                <Input id="appname" defaultValue={selected.name} />
              </div>
              <div>
                <Label htmlFor="server">Target server</Label>
                <Select id="server" defaultValue="web-prod-02">
                  {servers
                    .filter((s) => s.status !== "offline")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.region}
                      </option>
                    ))}
                </Select>
              </div>
            </div>

            <fieldset>
              <legend className="mb-2 text-[13px] text-muted">Runtime</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {runtimes.map((r) => (
                  <label
                    key={r.id}
                    className={cn(
                      "cursor-pointer rounded-md border p-3 transition-colors",
                      runtime === r.id ? "border-fg bg-white/[0.04]" : "border-line hover:border-line-strong",
                    )}
                  >
                    <input type="radio" name="runtime" value={r.id} checked={runtime === r.id} onChange={() => setRuntime(r.id)} className="sr-only" />
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <BrandChip name={r.id} size={18} />
                      {r.title}
                    </span>
                    <span className="mt-1.5 block text-xs text-muted">{r.desc}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <details className="group rounded-md border border-line" open>
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
                Build and Output Settings
                <Icon name="chevron-down" size={14} className="transition-transform group-open:rotate-180" />
              </summary>
              <div className="grid gap-4 border-t border-line p-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ctx">{runtime === "Docker" ? "Dockerfile" : "Build command"}</Label>
                  <Input id="ctx" className="font-mono" defaultValue={runtime === "Docker" ? "./Dockerfile" : "pip install -r requirements.txt"} />
                </div>
                <div>
                  <Label htmlFor="start">{runtime === "Docker" ? "Exposed port" : "Start command"}</Label>
                  <Input id="start" className="font-mono" defaultValue={runtime === "Docker" ? "8000" : "uvicorn app.main:app --port 8000"} />
                </div>
                <div>
                  <Label htmlFor="hc">Health check</Label>
                  <Input id="hc" className="font-mono" defaultValue="GET /healthz" />
                </div>
                <div>
                  <Label htmlFor="lim">Limits</Label>
                  <Input id="lim" defaultValue="1 vCPU · 512 MB" />
                </div>
              </div>
            </details>

            <details className="group rounded-md border border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
                <span className="flex items-center gap-2">
                  Environment Variables <Badge>2</Badge>
                </span>
                <Icon name="chevron-down" size={14} className="transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-2 border-t border-line p-4">
                {[
                  ["DATABASE_URL", "Reference: pg-main / billing_app"],
                  ["SENTRY_DSN", "••••••••••••"],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-2 gap-2">
                    <Input defaultValue={k} className="font-mono" aria-label="Key" />
                    <Input defaultValue={v} aria-label="Value" type={v.startsWith("•") ? "password" : "text"} />
                  </div>
                ))}
              </div>
            </details>

            <Button type="submit" variant="primary" size="md" className="w-full" disabled={deploying}>
              {deploying ? "Queuing deployment…" : "Deploy"}
            </Button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted">Select a repository to continue.</p>
        )}
      </Card>
    </div>
  );
}
