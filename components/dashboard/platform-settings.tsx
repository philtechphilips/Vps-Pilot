"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, FormCard, Input, Label, Mono, type Tone } from "@/components/ui";
import { ApiError, refreshSession } from "@/lib/api/client";
import { type Platform, useChangePassword, useEnrollmentTokens, usePlatform, useRevokeEnrollmentToken, useSavePlatform } from "@/lib/api/platform";
import { timeAgo } from "@/lib/format";
import { useAuthStore } from "@/lib/stores/auth-store";

export function PlatformCards() {
  const platform = usePlatform();
  if (platform.isLoading || !platform.data) return <div className="skeleton h-72 rounded-xl" />;
  return <PlatformForms key={platform.data.updated_at ?? "new"} p={platform.data} />;
}

function PlatformForms({ p }: { p: Platform }) {
  const save = useSavePlatform();
  const [name, setName] = useState(p.name);
  const [url, setUrl] = useState(p.public_url ?? "");
  const [saved, setSaved] = useState<"name" | "url" | null>(null);
  const urlValid = url === "" || /^https?:\/\/[A-Za-z0-9.-]+(:\d{1,5})?\/?$/.test(url.trim());

  return (
    <>
      <FormCard
        title="Control Plane Name"
        description="Shown in the dashboard and in emails."
        footer={saved === "name" ? "Saved." : "Up to 32 characters."}
        action={
          <Button variant="primary" size="sm" disabled={!name.trim() || save.isPending} onClick={() => save.mutate({ name: name.trim() }, { onSuccess: () => setSaved("name") })}>
            Save
          </Button>
        }
      >
        <Input value={name} maxLength={32} onChange={(e) => setName(e.target.value)} className="max-w-sm" aria-label="Control plane name" />
      </FormCard>
      <FormCard
        title="Control Plane URL"
        description="The public address of this control plane. Agents, install commands and GitHub webhooks use it. Existing agents keep the address they enrolled with until you upgrade them."
        footer={
          save.error ? (
            <span className="text-err">{save.error.message}</span>
          ) : saved === "url" ? (
            "Saved. New install commands use it."
          ) : (
            <span>
              Agents currently use <Mono className="text-fg">{p.agent_url}</Mono>
            </span>
          )
        }
        action={
          <Button variant="primary" size="sm" disabled={!urlValid || save.isPending} onClick={() => save.mutate({ public_url: url.trim() }, { onSuccess: () => setSaved("url") })}>
            Save
          </Button>
        }
      >
        <Input placeholder="https://pilot.example.com" value={url} onChange={(e) => setUrl(e.target.value)} className="max-w-md font-mono" aria-label="Control plane URL" />
        {!urlValid && <p className="mt-2 text-xs text-err">Use http:// or https:// followed by a host name.</p>}
      </FormCard>
    </>
  );
}

export function PasswordCard() {
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const tooShort = next.length > 0 && next.length < 12;

  return (
    <FormCard
      title="Password"
      description="Changing your password signs out every other session."
      footer={change.error ? <span className="text-err">{change.error.message}</span> : change.isSuccess ? change.data.message : "At least 12 characters. A passphrase works well."}
      action={
        <Button
          variant="primary"
          size="sm"
          disabled={!current || next.length < 12 || change.isPending}
          onClick={() => change.mutate({ current_password: current, new_password: next }, { onSuccess: () => (setCurrent(""), setNext("")) })}
        >
          Update Password
        </Button>
      }
    >
      <div className="grid max-w-xl gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cur">Current password</Label>
          <Input id="cur" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="new">New password</Label>
          <Input id="new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          {tooShort && <p className="mt-1 text-xs text-warn">{12 - next.length} more characters</p>}
        </div>
      </div>
    </FormCard>
  );
}

const tokenTone: Record<string, Tone> = { pending: "blue", redeemed: "ok", expired: "neutral" };

export function EnrollmentTokensCard() {
  const tokens = useEnrollmentTokens();
  const revoke = useRevokeEnrollmentToken();
  return (
    <FormCard
      title="Enrollment Tokens"
      description="Single-use tokens for connecting new servers. Stored hashed; the value is shown only once when created."
      footer={revoke.error ? <span className="text-err">{revoke.error.message}</span> : "Tokens expire after 15 minutes."}
      action={
        <Link href="/dashboard/servers/new" className="inline-flex h-8 items-center rounded-md bg-accent px-3 text-[13px] font-medium text-white hover:bg-accent-hover">
          Enroll a server
        </Link>
      }
    >
      {tokens.isLoading ? (
        <div className="skeleton h-24 rounded-md" />
      ) : !tokens.data?.length ? (
        <p className="text-sm text-subtle">No tokens yet.</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-line">
          {tokens.data.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-0">
              <Mono className="text-fg">ept_…{String(t.id).padStart(3, "0")}</Mono>
              <Link href={`/dashboard/servers/${t.server_id}`} className="text-sm text-muted hover:text-fg hover:underline">
                {t.server_name}
              </Link>
              <span className="ml-auto flex items-center gap-2">
                <Badge tone={tokenTone[t.state]}>
                  {t.state === "pending" ? `Pending · expires ${timeAgo(t.expires_at).replace(" ago", "") === "just now" ? "now" : new Date(t.expires_at).toLocaleTimeString()}` : t.state === "redeemed" ? `Redeemed ${timeAgo(t.used_at)}` : "Expired unused"}
                </Badge>
                {t.state === "pending" && (
                  <Button variant="secondary" size="xs" disabled={revoke.isPending} onClick={() => revoke.mutate(t.id)}>
                    Revoke
                  </Button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </FormCard>
  );
}

export function VersionCard() {
  const { data } = usePlatform();
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold tracking-tight">Version</h3>
      <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
        <span>
          <span className="text-muted">Control plane</span> <Mono className="ml-2 text-fg">{data?.version ?? "…"}</Mono>
        </span>
        <span>
          <span className="text-muted">Agent</span> <Mono className="ml-2 text-fg">{data?.agent_version ?? "…"}</Mono>
        </span>
        <span>
          <span className="text-muted">Schema</span> <Mono className="ml-2 text-fg">{data?.schema ?? "…"}</Mono>
        </span>
      </div>
      <p className="mt-3 text-xs text-subtle">
        Upgrade the control plane with <Mono>vpspilot upgrade</Mono> on its server, which also upgrades the agent on that server; other servers whose agent is older show an upgrade hint on their page.
      </p>
    </Card>
  );
}

/** POST the password; save the returned text file. */
async function downloadKit(password: string): Promise<void> {
  const send = (token: string | null) =>
    fetch("/api/v1/platform/recovery-kit", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ password }),
    });
  let response = await send(useAuthStore.getState().accessToken);
  if (response.status === 401 && (await refreshSession())) response = await send(useAuthStore.getState().accessToken);
  if (!response.ok) {
    const detail = await response.json().then((b) => b?.detail, () => null);
    throw new ApiError(response.status, typeof detail === "string" ? detail : "Couldn't create the kit");
  }
  const url = URL.createObjectURL(await response.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "vpspilot-recovery-kit.txt";
  a.click();
  URL.revokeObjectURL(url);
}

export function RecoveryKitCard() {
  const { data, refetch } = usePlatform();
  const [password, setPassword] = useState("");
  const [state, setState] = useState<{ busy: boolean; error?: string; done?: boolean }>({ busy: false });

  const run = async () => {
    setState({ busy: true });
    try {
      await downloadKit(password);
      setPassword("");
      setState({ busy: false, done: true });
      void refetch();
    } catch (error) {
      setState({ busy: false, error: (error as Error).message });
    }
  };

  return (
    <FormCard
      title="Recovery kit"
      description="The keys that decrypt stored secrets and your database backups, with instructions for restoring without this control plane. If the server is lost and you don't have these, encrypted backups can't be read."
      footer={
        state.error ? (
          <span className="text-err">{state.error}</span>
        ) : state.done ? (
          <span className="text-ok">Downloaded. Keep it offline, e.g. in a password manager.</span>
        ) : data?.recovery_kit_at ? (
          `Last downloaded ${timeAgo(data.recovery_kit_at)}. Download a new one after rotating keys.`
        ) : (
          <span className="text-warn">Never downloaded. Do it once and keep it safe.</span>
        )
      }
      action={
        <Button variant="primary" size="sm" icon="download" disabled={!password || state.busy} onClick={() => void run()}>
          {state.busy ? "Preparing…" : "Download kit"}
        </Button>
      }
    >
      <div className="max-w-sm">
        <Label htmlFor="kitpw" hint="confirms it's you">
          Your password
        </Label>
        <Input id="kitpw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && password && void run()} />
      </div>
    </FormCard>
  );
}
