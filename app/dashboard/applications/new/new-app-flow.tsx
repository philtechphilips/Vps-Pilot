"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EnvEditor, type EnvDraft, envPayload, envProblem, repoName } from "@/components/apps/app-ui";
import { RepoPicker } from "@/components/github/repo-picker";
import { Icon } from "@/components/icons";
import { Badge, Button, Callout, Card, Input, Label, Select } from "@/components/ui";
import { type Runtime, useCreateApp } from "@/lib/api/apps";
import type { GitHubRepo } from "@/lib/api/github";
import { useServers } from "@/lib/api/servers";
import { cn } from "@/lib/utils";

type SourceType = "git" | "image";

const GIT_URL = /^https:\/\/[A-Za-z0-9.-]+(:[0-9]+)?\/[A-Za-z0-9._~/-]+$/;
const IMAGE = /^[a-z0-9][a-z0-9._/:@-]{0,299}$/;
const NAME = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

const SERVICE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,62}$/;

const RUNTIMES: { value: Runtime; title: string; hint: string }[] = [
  { value: "docker", title: "Docker", hint: "Dockerfile, or a detected stack in a container" },
  { value: "systemd", title: "systemd", hint: "Node.js or Python on the server, no Docker" },
  { value: "compose", title: "Compose", hint: "Your compose.yaml, with its services" },
];

const STEPS: Record<Runtime, string[]> = {
  docker: [
    "Build or pull, then start a candidate on a private port.",
    "Health-check the candidate. If it fails, nothing changes.",
    "Swap it in on the app’s port. If that fails, the previous version is restored.",
  ],
  systemd: [
    "Build a new release folder as the app’s own user, in a sandbox.",
    "Start it on a spare port and health-check it. If it fails, nothing changes.",
    "Switch the service to it. If that fails, the previous release is restored.",
  ],
  compose: [
    "Check the compose file (no privileged or host access) and build its images.",
    "Start the services and health-check the public one.",
    "If that fails, the previous release is started again.",
  ],
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");

/** A sensible default app name from the repo or image. */
function suggestName(source: SourceType, repo: string, image: string) {
  if (source === "git") return slug(repoName(repo).split("/").pop() ?? "");
  return slug(image.split("/").pop()?.split(/[:@]/)[0] ?? "");
}

export function NewAppFlow() {
  const router = useRouter();
  const { data: servers, isLoading: loadingServers } = useServers();
  const create = useCreateApp();

  const [source, setSource] = useState<SourceType>("git");
  const [chosenRuntime, setRuntime] = useState<Runtime>("docker");
  const [composeFile, setComposeFile] = useState("");
  const [composeService, setComposeService] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [picked, setPicked] = useState<GitHubRepo | null>(null);
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [image, setImage] = useState("");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [serverId, setServerId] = useState("");
  const [port, setPort] = useState("3000");
  const [dockerfile, setDockerfile] = useState("Dockerfile");
  const [context, setContext] = useState(".");
  const [buildCommand, setBuildCommand] = useState("");
  const [startCommand, setStartCommand] = useState("");
  const [healthPath, setHealthPath] = useState("/");
  const [healthTimeout, setHealthTimeout] = useState("60");
  const [cpu, setCpu] = useState("");
  const [memory, setMemory] = useState("");
  const [env, setEnv] = useState<EnvDraft[]>([]);

  const usable = (servers ?? []).filter((s) => s.enrolled_at && s.status !== "revoked");
  const target = serverId || usable.find((s) => s.status === "online")?.id || usable[0]?.id || "";
  const appName = nameTouched ? name : suggestName(source, picked ? picked.clone_url : repo, image);
  const runtime: Runtime = source === "git" ? chosenRuntime : "docker";

  const problem =
    source === "git" && !picked && !GIT_URL.test(repo.trim())
      ? "Pick a repository or enter its https:// URL"
      : source === "image" && !IMAGE.test(image.trim())
        ? "Enter an image like nginx:1.27 or ghcr.io/acme/api:v2"
        : !NAME.test(appName)
          ? "Name: lowercase letters, numbers and dashes"
          : !target
            ? "Enroll a server first"
            : runtime !== "systemd" && !(Number(port) >= 1 && Number(port) <= 65535)
              ? "Enter the port your app listens on"
              : !healthPath.startsWith("/")
                ? "The health check path starts with /"
                : runtime === "compose" && composeService.trim() && !SERVICE.test(composeService.trim())
                  ? "Service names use letters, numbers, dots, dashes and underscores"
                  : envProblem(env);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problem) return;
    create.mutate(
      {
        name: appName,
        server_id: target,
        source:
          source === "image"
            ? { type: "image", image: image.trim() }
            : picked
              ? { type: "git", branch: branch.trim() || picked.default_branch, installation_id: picked.installation_id, repo_id: picked.id }
              : { type: "git", url: repo.trim().replace(/\.git$/, ""), branch: branch.trim() || "main" },
        auto_deploy: !!picked && autoDeploy,
        runtime,
        ...(runtime === "compose" ? { compose_file: composeFile.trim() || null, compose_service: composeService.trim() || null } : {}),
        dockerfile: dockerfile.trim() || "Dockerfile",
        build_context: context.trim() || ".",
        build_command: source === "git" && runtime !== "compose" ? buildCommand.trim() || null : null,
        start_command: source === "git" && runtime !== "compose" ? startCommand.trim() || null : null,
        // Native apps listen on $PORT (their public port); this is unused.
        container_port: runtime === "systemd" ? 3000 : Number(port),
        health_path: healthPath.trim(),
        health_timeout_seconds: Number(healthTimeout) || 60,
        cpu_limit: runtime === "compose" ? null : cpu.trim() || null,
        memory_limit: runtime === "compose" ? null : memory.trim() || null,
        env: envPayload(env),
      },
      {
        onSuccess: (app) =>
          router.push(app.latest_deployment ? `/dashboard/deployments/${app.latest_deployment.id}` : `/dashboard/applications/${app.id}`),
      },
    );
  };

  return (
    <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <Card className="h-fit p-5 sm:p-6">
        <h2 className="text-xl font-semibold tracking-tight">Source</h2>
        <div role="tablist" className="mt-5 grid grid-cols-2 gap-1 rounded-lg border border-line bg-bg p-1">
          {(
            [
              ["git", "github", "Git repository"],
              ["image", "container", "Container image"],
            ] as const
          ).map(([value, icon, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={source === value}
              onClick={() => setSource(value)}
              className={cn(
                "flex h-9 items-center justify-center gap-2 rounded-md text-sm transition-colors",
                source === value ? "bg-ink/[0.08] text-fg" : "text-muted hover:text-fg",
              )}
            >
              <Icon name={icon} size={15} /> {label}
            </button>
          ))}
        </div>

        {source === "git" ? (
          <div className="mt-5 space-y-4">
            <RepoPicker
              picked={picked}
              onPick={setPicked}
              branch={branch}
              onBranch={setBranch}
              url={repo}
              onUrl={setRepo}
              autoDeploy={autoDeploy}
              onAutoDeploy={setAutoDeploy}
            />
            <div>
              <Label>Run as</Label>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
                {RUNTIMES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    role="radio"
                    aria-checked={runtime === r.value}
                    onClick={() => setRuntime(r.value)}
                    className={cn(
                      "rounded-md border px-3 py-2.5 text-left transition-colors",
                      runtime === r.value ? "border-accent bg-accent/10" : "border-line hover:border-line-strong",
                    )}
                  >
                    <span className="block text-sm font-medium">{r.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-subtle">{r.hint}</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs leading-relaxed text-subtle">
              {runtime === "docker" ? (
                <>
                  No Dockerfile? Node.js, Bun, Python, Go, Rust and static sites are detected and built automatically.{" "}
                  <a href="/#stacks" target="_blank" className="text-muted underline underline-offset-2 hover:text-fg">
                    See supported stacks
                  </a>
                </>
              ) : runtime === "systemd" ? (
                "Node.js (npm, pnpm, Yarn) and Python (pip, Poetry, uv, Pipenv) are detected; the right Node.js version is installed if the server lacks it. Your app must listen on $PORT. Needs agent 1.1.0."
              ) : (
                "Privileged mode, host networking, devices and mounts outside the repository are refused. Published ports are replaced: VPSPilot publishes the public service. Needs agent 1.1.0."
              )}
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="image" hint="pin a tag or digest">
                Image
              </Label>
              <Input id="image" icon="container" placeholder="ghcr.io/acme/api:1.4.2" value={image} onChange={(e) => setImage(e.target.value)} className="font-mono" autoFocus />
            </div>
            <p className="text-xs leading-relaxed text-subtle">The server pulls this image on every deploy. Pin a version so each deployment is reproducible and rollbacks are meaningful.</p>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-line bg-bg p-4 text-[13px] text-muted">
          <div className="flex items-center gap-2 text-fg">
            <Icon name="shield-check" size={15} className="text-accent-fg" /> How releases work
          </div>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed">
            {STEPS[runtime].map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold tracking-tight">Configure</h2>
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="appname">Application name</Label>
              <Input
                id="appname"
                placeholder="my-app"
                value={appName}
                className="font-mono"
                onChange={(e) => {
                  setNameTouched(true);
                  setName(e.target.value.toLowerCase());
                }}
              />
            </div>
            <div>
              <Label htmlFor="server">Target server</Label>
              {loadingServers ? (
                <div className="skeleton h-10 rounded-md" />
              ) : usable.length ? (
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

          <div className="grid gap-4 sm:grid-cols-2">
            {runtime === "systemd" ? (
              <div>
                <Label>Port</Label>
                <div className="flex h-10 items-center rounded-md border border-line bg-bg-200 px-3 text-[13px] text-muted">
                  Your app listens on <span className="ml-1 font-mono text-fg">$PORT</span>
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="port" hint={runtime === "compose" ? "of the public service" : "inside the container"}>
                  Port
                </Label>
                <Input id="port" inputMode="numeric" value={port} onChange={(e) => setPort(e.target.value.replace(/\D/g, ""))} className="font-mono" />
              </div>
            )}
            <div>
              <Label htmlFor="hc" hint="must return 2xx/3xx">
                Health check
              </Label>
              <Input id="hc" value={healthPath} onChange={(e) => setHealthPath(e.target.value)} className="font-mono" />
            </div>
          </div>

          <details className="group rounded-md border border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
              {source === "git" ? "Build & Runtime Settings" : "Runtime Settings"}
              <Icon name="chevron-down" size={14} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid gap-4 border-t border-line p-4 sm:grid-cols-2">
              {source === "git" && (
                <>
                  {runtime === "docker" && (
                    <div>
                      <Label htmlFor="df" hint="used if present">
                        Dockerfile
                      </Label>
                      <Input id="df" className="font-mono" value={dockerfile} onChange={(e) => setDockerfile(e.target.value)} />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="ctx" hint="app folder">
                      Root directory
                    </Label>
                    <Input id="ctx" className="font-mono" value={context} onChange={(e) => setContext(e.target.value)} />
                  </div>
                  {runtime === "compose" ? (
                    <>
                      <div>
                        <Label htmlFor="cf" hint="in the root directory">
                          Compose file
                        </Label>
                        <Input id="cf" className="font-mono" placeholder="compose.yaml (found automatically)" value={composeFile} onChange={(e) => setComposeFile(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="cs" hint="receives traffic">
                          Public service
                        </Label>
                        <Input id="cs" className="font-mono" placeholder="needed with 2+ services" value={composeService} onChange={(e) => setComposeService(e.target.value)} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="bc" hint={runtime === "docker" ? "no Dockerfile only" : undefined}>
                          Build command
                        </Label>
                        <Input id="bc" className="font-mono" placeholder="detected, e.g. npm run build" value={buildCommand} onChange={(e) => setBuildCommand(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="sc" hint={runtime === "docker" ? "no Dockerfile only" : undefined}>
                          Start command
                        </Label>
                        <Input id="sc" className="font-mono" placeholder="detected, e.g. npm start" value={startCommand} onChange={(e) => setStartCommand(e.target.value)} />
                      </div>
                    </>
                  )}
                </>
              )}
              <div>
                <Label htmlFor="hct" hint="seconds">
                  Health check timeout
                </Label>
                <Input id="hct" inputMode="numeric" value={healthTimeout} onChange={(e) => setHealthTimeout(e.target.value.replace(/\D/g, ""))} />
              </div>
              <div className={cn("grid grid-cols-2 gap-2", runtime === "compose" && "hidden")}>
                <div>
                  <Label htmlFor="cpu">CPUs</Label>
                  <Input id="cpu" placeholder="no limit" value={cpu} onChange={(e) => setCpu(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="mem">Memory</Label>
                  <Input id="mem" placeholder="e.g. 512m" value={memory} onChange={(e) => setMemory(e.target.value.toLowerCase())} />
                </div>
              </div>
            </div>
          </details>

          <details className="group rounded-md border border-line" open={env.length > 0 || undefined}>
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
              <span className="flex items-center gap-2">
                Environment Variables {env.length > 0 && <Badge>{env.length}</Badge>}
              </span>
              <Icon name="chevron-down" size={14} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-line p-4">
              <EnvEditor rows={env} onChange={setEnv} />
              <p className="mt-3 text-xs text-subtle">Values are encrypted at rest. Secrets are never shown again after saving and are masked in build logs. PORT is set for you.</p>
            </div>
          </details>

          {create.error && (
            <Callout tone="err" icon="x-circle">
              {create.error.message}
            </Callout>
          )}

          <Button type="submit" variant="primary" size="md" className="w-full" disabled={!!problem || create.isPending}>
            {create.isPending ? "Queuing deployment…" : "Deploy"}
          </Button>
          {problem && (repo || image || nameTouched) && <p className="-mt-2 text-center text-xs text-subtle">{problem}</p>}
        </div>
      </Card>
    </form>
  );
}
