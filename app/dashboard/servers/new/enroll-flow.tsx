"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Icon } from "@/components/icons";
import { osLabel } from "@/components/servers/server-ui";
import { Badge, Button, ButtonLink, Callout, Input, Label } from "@/components/ui";
import { useCreateEnrollment, useServer } from "@/lib/api/servers";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

function useSecondsLeft(expiresAt: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
}

export function EnrollFlow() {
  const create = useCreateEnrollment();
  const enrollment = create.data;
  const server = useServer(enrollment?.server.id);
  const secondsLeft = useSecondsLeft(enrollment?.expires_at);
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");

  const connected = server.data && server.data.status !== "pending";
  const step = !enrollment ? 0 : connected ? 2 : 1;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <ol className="relative">
      <Step n={1} title="Name the server" state={step === 0 ? "active" : "done"}>
        {step === 0 ? (
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate({ name, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) });
            }}
          >
            <div>
              <Label htmlFor="sname" hint="lowercase, numbers, dashes">
                Server name
              </Label>
              <Input
                id="sname"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                placeholder="web-prod-01"
                pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
                required
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="tags" hint="Optional, comma separated">
                Tags
              </Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="production, web" />
            </div>
            {create.error && (
              <p className="text-sm text-err sm:col-span-2" role="alert">
                {create.error.message}
              </p>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" variant="primary" size="md" icon="key" disabled={create.isPending}>
                {create.isPending ? "Creating…" : "Create install command"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted">
            <span className="text-fg">{enrollment!.server.name}</span>
            {enrollment!.server.tags.length > 0 && <> · {enrollment!.server.tags.join(", ")}</>}
          </p>
        )}
      </Step>

      <Step n={2} title="Run the installer on the server" state={step === 0 ? "pending" : step === 1 ? "active" : "done"}>
        {enrollment && step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              SSH into the server once and run this. It installs the agent as an unprivileged systemd service. The token works once.
            </p>
            <div className="overflow-hidden rounded-xl border border-line-strong bg-[#0d0d0d]">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <span className="text-xs text-subtle">bash · as root or with sudo</span>
                <span className="flex items-center gap-3">
                  <Badge tone={secondsLeft === 0 ? "err" : secondsLeft < 120 ? "warn" : "neutral"}>
                    <Icon name="clock" size={11} /> {secondsLeft === 0 ? "Expired" : `Expires in ${mm}:${ss}`}
                  </Badge>
                  <CopyButton value={enrollment.install_command} />
                </span>
              </div>
              <pre className="thin-scrollbar overflow-x-auto p-4 font-mono text-[12.5px] leading-6 whitespace-pre-wrap text-fg">
                <span className="text-subtle select-none">$ </span>
                {enrollment.install_command}
              </pre>
            </div>
            {secondsLeft === 0 && (
              <Callout tone="warn" icon="clock" title="This token expired">
                Open the server from the list and create a new install command.
              </Callout>
            )}
            <div className="grid gap-3 text-xs text-muted sm:grid-cols-3">
              {[
                ["Supported", "Ubuntu 22.04, 24.04 · Debian 12"],
                ["Network", "Outbound HTTPS only"],
                ["Installs", "vpspilot-agent.service (unprivileged)"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line bg-bg p-3">
                  <div className="text-subtle">{k}</div>
                  <div className="mt-0.5 text-fg">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Step>

      <Step n={3} title="Wait for the first heartbeat" state={step === 2 ? "done" : step === 1 ? "active" : "pending"} last>
        {step === 1 && (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong p-4 text-sm text-muted">
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-fg opacity-60" />
              <span className="relative inline-flex size-3 rounded-full bg-accent-fg" />
            </span>
            Listening for <span className="font-mono text-fg">{enrollment?.server.name}</span>…
            <Link href="/dashboard/servers" className="ml-auto text-xs hover:text-fg">
              Do this later
            </Link>
          </div>
        )}
        {step === 2 && server.data && (
          <div className="space-y-4">
            <Callout tone="ok" icon="check-circle" title={`${server.data.name} is connected`}>
              {osLabel(server.data)} · {server.data.arch} · {server.data.cpu_count} vCPU · {formatBytes(server.data.memory_total, 1)} RAM · agent{" "}
              {server.data.agent_version}
            </Callout>
            <div className="flex gap-2">
              <ButtonLink href={`/dashboard/servers/${server.data.id}`} variant="primary" size="md" iconRight="arrow-right">
                View server
              </ButtonLink>
              <Button variant="secondary" size="md" onClick={() => create.reset()}>
                Enroll another
              </Button>
            </div>
          </div>
        )}
      </Step>
    </ol>
  );
}

function Step({
  n,
  title,
  state,
  last,
  children,
}: {
  n: number;
  title: string;
  state: "pending" | "active" | "done";
  last?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li className="relative flex gap-5 pb-10">
      {!last && <span className="absolute top-9 bottom-0 left-[15px] w-px bg-line-strong" aria-hidden="true" />}
      <span
        className={cn(
          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
          state === "done" && "border-ok/40 bg-ok/15 text-ok",
          state === "active" && "btn-primary border-transparent",
          state === "pending" && "border-line-strong bg-bg-100 text-subtle",
        )}
      >
        {state === "done" ? <Icon name="check" size={15} strokeWidth={2.5} /> : n}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <h2 className={cn("font-medium", state === "pending" ? "text-subtle" : "text-fg")}>{title}</h2>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </li>
  );
}
