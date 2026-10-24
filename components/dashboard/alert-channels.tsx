"use client";

import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Icon, type IconName } from "@/components/icons";
import { Badge, Button, Callout, FormCard, Input, Label, Select } from "@/components/ui";
import {
  type AlertChannel,
  type ChannelEvent,
  type ChannelKind,
  useAlertChannels,
  useCreateChannel,
  useDeleteChannel,
  useTestChannel,
  useUpdateChannel,
} from "@/lib/api/notifications";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const KINDS: { value: ChannelKind; label: string; icon: IconName; hint: string }[] = [
  { value: "slack", label: "Slack", icon: "hash", hint: "An incoming webhook URL (Mattermost and other Slack-compatible tools work too)." },
  { value: "telegram", label: "Telegram", icon: "inbox", hint: "A bot token from @BotFather and the chat ID to post in." },
  { value: "webhook", label: "Webhook", icon: "link", hint: "A JSON POST to your URL, signed with HMAC-SHA256." },
];

const EVENTS: { value: ChannelEvent; label: string }[] = [
  { value: "alert.firing", label: "Alert fired" },
  { value: "alert.resolved", label: "Alert resolved" },
  { value: "deployment.failed", label: "Deployment failed" },
  { value: "deployment.succeeded", label: "Deployment succeeded" },
  { value: "job.failed", label: "Scheduled job failed" },
  { value: "report.weekly", label: "Weekly report" },
];

const DEFAULT_EVENTS: ChannelEvent[] = ["alert.firing", "alert.resolved", "deployment.failed", "job.failed", "report.weekly"];

export function AlertChannelsCard() {
  const channels = useAlertChannels();
  const [adding, setAdding] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  return (
    <FormCard
      title="Alert channels"
      description="Send alerts and deployment results to your team's chat or your own endpoint, in addition to the inbox and email. Shared by every admin."
      footer={channels.data?.length ? `${channels.data.length} channel${channels.data.length === 1 ? "" : "s"}` : "No channels yet."}
      action={
        !adding && (
          <Button variant="secondary" size="sm" icon="plus" onClick={() => (setAdding(true), setSecret(null))}>
            Add channel
          </Button>
        )
      }
    >
      <div className="space-y-4">
        {secret && (
          <Callout tone="ok" icon="key" title="Webhook signing secret (shown once)">
            <div className="mt-1 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-ink/[0.04] px-2 py-1 font-mono text-[12px]">{secret}</code>
              <CopyButton value={secret} />
            </div>
            <p className="mt-2 text-xs">
              Each request carries <span className="font-mono">X-VPSPilot-Signature: sha256=…</span>, the HMAC-SHA256 of the body with this secret.
            </p>
          </Callout>
        )}
        {adding && <NewChannel onDone={(s) => (setAdding(false), setSecret(s))} onCancel={() => setAdding(false)} />}
        {channels.isLoading ? (
          <div className="skeleton h-20 rounded-md" />
        ) : (
          !!channels.data?.length && (
            <div className="overflow-hidden rounded-md border border-line">
              {channels.data.map((c) => (
                <ChannelRow key={c.id} channel={c} />
              ))}
            </div>
          )
        )}
      </div>
    </FormCard>
  );
}

function ChannelRow({ channel: c }: { channel: AlertChannel }) {
  const update = useUpdateChannel();
  const test = useTestChannel();
  const remove = useDeleteChannel();
  const [confirm, setConfirm] = useState(false);
  const kind = KINDS.find((k) => k.value === c.kind);
  const toggle = (event: ChannelEvent) => {
    const events = c.events.includes(event) ? c.events.filter((e) => e !== event) : [...c.events, event];
    if (events.length) update.mutate({ id: c.id, events });
  };

  return (
    <div className="border-b border-line px-4 py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-3">
        <Icon name={kind?.icon ?? "link"} size={15} className="text-subtle" />
        <span className="text-sm font-medium">{c.name}</span>
        <Badge>{kind?.label}</Badge>
        <span className="font-mono text-xs text-subtle">{c.target_label}</span>
        {c.kind === "telegram" && (
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted" title="The bot answers /status, /apps and /alerts in this chat">
            <input type="checkbox" checked={c.commands} onChange={(e) => update.mutate({ id: c.id, commands: e.target.checked })} className="accent-[var(--color-accent)]" />
            Commands
          </label>
        )}
        <span className="ml-auto flex items-center gap-1">
          <Button variant="secondary" size="xs" icon="zap" disabled={test.isPending || !c.enabled} onClick={() => test.mutate(c.id)}>
            {test.isPending ? "Sending…" : "Send test"}
          </Button>
          <button
            type="button"
            role="switch"
            aria-checked={c.enabled}
            aria-label={`${c.name} enabled`}
            onClick={() => update.mutate({ id: c.id, enabled: !c.enabled })}
            className={cn("relative mx-1 h-5 w-9 shrink-0 rounded-full border transition-colors", c.enabled ? "border-accent/70 bg-accent" : "border-line-strong bg-bg-200")}
          >
            <span className={cn("absolute top-0.5 size-[14px] rounded-full bg-white shadow transition-[left]", c.enabled ? "left-[18px]" : "left-0.5")} />
          </button>
          <button type="button" aria-label={`Delete ${c.name}`} onClick={() => setConfirm(true)} className="rounded p-1.5 text-subtle hover:bg-ink/10 hover:text-err">
            <Icon name="trash" size={14} />
          </button>
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {EVENTS.map((e) => (
          <button
            key={e.value}
            type="button"
            aria-pressed={c.events.includes(e.value)}
            onClick={() => toggle(e.value)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
              c.events.includes(e.value) ? "border-accent/60 bg-accent/15 text-fg" : "border-line text-subtle hover:text-fg",
            )}
          >
            {e.label}
          </button>
        ))}
        <span className="ml-auto text-xs">
          {test.error ? (
            <span className="text-err">{test.error.message}</span>
          ) : c.last_error ? (
            <span className="text-err">{c.last_error}</span>
          ) : c.last_sent_at ? (
            <span className="text-subtle">Last sent {timeAgo(c.last_sent_at)}</span>
          ) : (
            <span className="text-subtle">Nothing sent yet</span>
          )}
        </span>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title={`Delete ${c.name}`} confirmText={c.name} action="Delete channel" onConfirm={() => (setConfirm(false), remove.mutate(c.id))}>
        Alerts stop going to {c.target_label}.
      </ConfirmDialog>
    </div>
  );
}

function NewChannel({ onDone, onCancel }: { onDone: (secret: string | null) => void; onCancel: () => void }) {
  const create = useCreateChannel();
  const [kind, setKind] = useState<ChannelKind>("slack");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [chat, setChat] = useState("");
  const [events, setEvents] = useState<ChannelEvent[]>(DEFAULT_EVENTS);
  const [commands, setCommands] = useState(true);
  const hint = KINDS.find((k) => k.value === kind)?.hint;
  const valid = (kind === "telegram" ? /^\d{5,12}:[A-Za-z0-9_-]{30,50}$/.test(token.trim()) && /^(-?\d{1,20}|@[A-Za-z0-9_]{5,32})$/.test(chat.trim()) : /^https?:\/\/\S+$/.test(url.trim())) && events.length > 0;

  return (
    <div className="rounded-md border border-line bg-bg p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="chkind">Type</Label>
          <Select id="chkind" value={kind} onChange={(e) => setKind(e.target.value as ChannelKind)}>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="chname" hint="optional">
            Name
          </Label>
          <Input id="chname" placeholder={kind === "slack" ? "#ops" : kind === "telegram" ? "On-call group" : "Incident system"} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {kind === "telegram" ? (
          <>
            <div>
              <Label htmlFor="chtoken">Bot token</Label>
              <Input id="chtoken" type="password" autoComplete="off" placeholder="123456789:AA…" value={token} onChange={(e) => setToken(e.target.value)} className="font-mono" />
            </div>
            <div>
              <Label htmlFor="chchat" hint="add the bot to the chat first">
                Chat ID
              </Label>
              <Input id="chchat" placeholder="-1001234567890" value={chat} onChange={(e) => setChat(e.target.value)} className="font-mono" />
            </div>
          </>
        ) : (
          <div className="sm:col-span-2">
            <Label htmlFor="churl" hint="stored encrypted">
              {kind === "slack" ? "Incoming webhook URL" : "URL"}
            </Label>
            <Input id="churl" type="password" autoComplete="off" placeholder={kind === "slack" ? "https://hooks.slack.com/services/…" : "https://example.com/vpspilot"} value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono" />
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-subtle">{hint}</p>
      {kind === "telegram" && (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={commands} onChange={(e) => setCommands(e.target.checked)} className="accent-[var(--color-accent)]" />
          Answer <span className="font-mono text-xs">/status</span>, <span className="font-mono text-xs">/apps</span> and <span className="font-mono text-xs">/alerts</span>{" "}
          in this chat
        </label>
      )}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {EVENTS.map((e) => (
          <button
            key={e.value}
            type="button"
            aria-pressed={events.includes(e.value)}
            onClick={() => setEvents((v) => (v.includes(e.value) ? v.filter((x) => x !== e.value) : [...v, e.value]))}
            className={cn("rounded-full border px-2.5 py-0.5 text-[12px] transition-colors", events.includes(e.value) ? "border-accent/60 bg-accent/15 text-fg" : "border-line text-subtle hover:text-fg")}
          >
            {e.label}
          </button>
        ))}
      </div>
      {create.error && <p className="mt-3 text-sm text-err">{create.error.message}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={!valid || create.isPending}
          onClick={() =>
            create.mutate(
              {
                kind,
                name: name.trim(),
                events,
                commands: kind === "telegram" && commands,
                config: kind === "telegram" ? { bot_token: token.trim(), chat_id: chat.trim() } : { url: url.trim() },
              },
              { onSuccess: (r) => onDone(r.secret) },
            )
          }
        >
          {create.isPending ? "Adding…" : "Add channel"}
        </Button>
      </div>
    </div>
  );
}
