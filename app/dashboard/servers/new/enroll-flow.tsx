"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Icon } from "@/components/icons";
import { Badge, Button, ButtonLink, Callout, Input, Label, Select } from "@/components/ui";
import { cn } from "@/lib/utils";

// Placeholder shown in the UI mock; real tokens come from the API.
const TOKEN = "ept_demo_enrollment_token_3f9a";

export function EnrollFlow() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("web-prod-03");
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (step !== 1) return;
    const tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    const hb = setTimeout(() => setConnected(true), 6000);
    return () => {
      clearInterval(tick);
      clearTimeout(hb);
    };
  }, [step]);

  const cmd = `curl -fsSL https://pilot.example.com/agent/install.sh | sudo sh -s -- --token ${TOKEN}`;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <ol className="relative space-y-0">
      <Step n={1} title="Describe the server" state={step === 0 ? "active" : "done"}>
        {step === 0 ? (
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              setStep(1);
            }}
          >
            <div>
              <Label htmlFor="sname">Server name</Label>
              <Input id="sname" value={name} onChange={(e) => setName(e.target.value)} pattern="[a-z0-9-]+" required />
            </div>
            <div>
              <Label htmlFor="tags" hint="Optional">
                Tags
              </Label>
              <Input id="tags" placeholder="production, web" />
            </div>
            <div>
              <Label htmlFor="ttl">Token expires after</Label>
              <Select id="ttl" defaultValue="15">
                <option value="15">15 minutes</option>
                <option value="60">1 hour</option>
                <option value="1440">24 hours</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="caps">Allowed capabilities</Label>
              <Select id="caps" defaultValue="standard">
                <option value="standard">Standard — metrics, Docker, systemd, proxy</option>
                <option value="metrics">Metrics only (read-only)</option>
                <option value="full">Standard + database adapters</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="primary" size="md" icon="key">
                Generate enrollment token
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted">
            <span className="text-fg">{name}</span> · standard capabilities · 15 minute token
          </p>
        )}
      </Step>

      <Step n={2} title="Run the installer on the server" state={step === 0 ? "pending" : connected ? "done" : "active"}>
        {step >= 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              SSH into the server once and run this as a user with <code className="font-mono text-fg">sudo</code>. The token is single-use and stored hashed.
            </p>
            <div className="overflow-hidden rounded-lg border border-line-strong bg-bg">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <span className="text-xs text-subtle">bash</span>
                <span className="flex items-center gap-3">
                  <Badge tone={secondsLeft < 120 ? "warn" : "neutral"}>
                    <Icon name="clock" size={11} /> Expires in {mm}:{ss}
                  </Badge>
                  <CopyButton value={cmd} />
                </span>
              </div>
              <pre className="thin-scrollbar overflow-x-auto p-4 font-mono text-[12.5px] leading-6 text-fg">
                <span className="select-none text-subtle">$ </span>
                curl -fsSL https://pilot.example.com/agent/install.sh \{"\n"}
                {"    "}| sudo sh -s -- --token <span className="text-blue-fg">{TOKEN.slice(0, 8)}</span>
                <span className="text-subtle">••••••••••••••••••••••</span>
                <span className="text-blue-fg">{TOKEN.slice(-4)}</span>
              </pre>
            </div>
            <div className="grid gap-3 text-xs text-muted sm:grid-cols-3">
              {[
                ["Supported", "Ubuntu 22.04, 24.04 · Debian 12"],
                ["Network", "Outbound HTTPS 443 only"],
                ["Installs", "vpspilot-agent.service (unprivileged)"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md border border-line bg-bg p-3">
                  <div className="text-subtle">{k}</div>
                  <div className="mt-0.5 text-fg">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Step>

      <Step n={3} title="Wait for the first heartbeat" state={connected ? "done" : step >= 1 ? "active" : "pending"} last>
        {step >= 1 &&
          (connected ? (
            <div className="space-y-4">
              <Callout tone="ok" icon="check-circle" title={`${name} is online`}>
                Ubuntu 24.04 LTS · x86_64 · agent 0.4.2 · first heartbeat 1s ago. The enrollment token has been consumed.
              </Callout>
              <div className="flex gap-2">
                <ButtonLink href="/dashboard/servers/web-prod-01" variant="primary" size="md">
                  View server
                </ButtonLink>
                <ButtonLink href="/dashboard/applications/new" variant="secondary" size="md">
                  Deploy an app
                </ButtonLink>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-line-strong p-4 text-sm text-muted">
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-fg opacity-60" />
                <span className="relative inline-flex size-3 rounded-full bg-blue-fg" />
              </span>
              Listening for <span className="font-mono text-fg">{name}</span>…
              <Link href="/dashboard/servers" className="ml-auto text-xs hover:text-fg">
                Do this later
              </Link>
            </div>
          ))}
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
          state === "active" && "border-fg bg-fg text-black",
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
