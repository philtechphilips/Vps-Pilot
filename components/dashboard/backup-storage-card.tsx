"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Icon } from "@/components/icons";
import { Button, Callout, FormCard, Input, Label, Select } from "@/components/ui";
import {
  type BackupSettings,
  useBackupSettings,
  useConnectDrive,
  useDisconnectDrive,
  useSaveBackupSettings,
  waitForBackupJob,
} from "@/lib/api/backups";
import { api } from "@/lib/api/client";
import { useServers } from "@/lib/api/servers";
import { cn } from "@/lib/utils";

/* S3-compatible services: how their endpoint is built. */
type Preset = {
  id: string;
  label: string;
  field: "region" | "account" | null;
  fieldLabel?: string;
  placeholder?: string;
  endpoint: (value: string) => string;
  match: RegExp;
  region: (value: string) => string;
};

const PRESETS: Preset[] = [
  {
    id: "r2",
    label: "Cloudflare R2",
    field: "account",
    fieldLabel: "Account ID",
    placeholder: "e.g. 4f8b…c21 (R2 → Overview)",
    endpoint: (v) => `https://${v}.r2.cloudflarestorage.com`,
    match: /^https:\/\/([a-f0-9]{32})\.r2\.cloudflarestorage\.com$/,
    region: () => "auto",
  },
  {
    id: "aws",
    label: "Amazon S3",
    field: "region",
    fieldLabel: "Region",
    placeholder: "us-east-1",
    endpoint: (v) => `https://s3.${v}.amazonaws.com`,
    match: /^https:\/\/s3\.([a-z0-9-]+)\.amazonaws\.com$/,
    region: (v) => v,
  },
  {
    id: "b2",
    label: "Backblaze B2",
    field: "region",
    fieldLabel: "Region",
    placeholder: "us-west-004",
    endpoint: (v) => `https://s3.${v}.backblazeb2.com`,
    match: /^https:\/\/s3\.([a-z0-9-]+)\.backblazeb2\.com$/,
    region: (v) => v,
  },
  {
    id: "spaces",
    label: "DigitalOcean Spaces",
    field: "region",
    fieldLabel: "Region",
    placeholder: "nyc3",
    endpoint: (v) => `https://${v}.digitaloceanspaces.com`,
    match: /^https:\/\/([a-z0-9-]+)\.digitaloceanspaces\.com$/,
    region: (v) => v,
  },
  {
    id: "wasabi",
    label: "Wasabi",
    field: "region",
    fieldLabel: "Region",
    placeholder: "us-east-1",
    endpoint: (v) => `https://s3.${v}.wasabisys.com`,
    match: /^https:\/\/s3\.([a-z0-9-]+)\.wasabisys\.com$/,
    region: (v) => v,
  },
  { id: "other", label: "Other (MinIO, Garage…)", field: null, endpoint: () => "", match: /^$/, region: () => "auto" },
];

function detect(endpoint: string | null): { preset: string; value: string } {
  for (const p of PRESETS) {
    const m = endpoint ? p.match.exec(endpoint) : null;
    if (m) return { preset: p.id, value: m[1] ?? "" };
  }
  return { preset: endpoint ? "other" : "r2", value: "" };
}

export function BackupStorageCard() {
  const settings = useBackupSettings();
  if (settings.isLoading || !settings.data) return <div className="skeleton h-64 rounded-xl" />;
  return (
    <Suspense fallback={<div className="skeleton h-64 rounded-xl" />}>
      <StorageForm key={settings.data.updated_at ?? "new"} initial={settings.data} />
    </Suspense>
  );
}

function StorageForm({ initial }: { initial: BackupSettings }) {
  const save = useSaveBackupSettings();
  const params = useSearchParams();
  const { data: servers } = useServers();
  const online = (servers ?? []).filter((s) => s.status === "online");
  const detected = detect(initial.endpoint);
  const [provider, setProvider] = useState<"s3" | "gdrive">(initial.provider);
  const [enabled, setEnabled] = useState(initial.storage_enabled);
  const [keepLocal, setKeepLocal] = useState(initial.keep_local);
  const [preset, setPreset] = useState(detected.preset);
  const [presetValue, setPresetValue] = useState(detected.value);
  const [s3, setS3] = useState({
    endpoint: initial.endpoint ?? "",
    region: initial.region ?? "auto",
    bucket: initial.bucket ?? "",
    prefix: initial.prefix ?? "",
    access_key: "",
    secret_key: "",
  });
  const [testServer, setTestServer] = useState("");
  const [testing, setTesting] = useState<string | null>(null);
  const p = PRESETS.find((x) => x.id === preset)!;
  const endpoint = p.field ? (presetValue.trim() ? p.endpoint(presetValue.trim()) : "") : s3.endpoint.trim().replace(/\/$/, "");
  const region = p.field ? p.region(presetValue.trim()) : s3.region.trim() || "auto";
  const set = (k: keyof typeof s3) => (e: React.ChangeEvent<HTMLInputElement>) => setS3((f) => ({ ...f, [k]: e.target.value }));
  const driveNotice = params.get("gdrive") === "connected" ? "Google Drive connected. New backups are copied there." : null;
  const driveError = params.get("gdrive_error");

  const submit = () =>
    save.mutate({
      storage_enabled: enabled,
      provider,
      keep_local: keepLocal,
      ...(provider === "s3"
        ? {
            endpoint: endpoint || null,
            region,
            bucket: s3.bucket.trim() || null,
            prefix: s3.prefix.trim(),
            ...(s3.access_key ? { access_key: s3.access_key } : {}),
            ...(s3.secret_key ? { secret_key: s3.secret_key } : {}),
          }
        : {}),
    });

  const test = async () => {
    const server = testServer || online[0]?.id;
    if (!server) return setTesting("No online server to test from.");
    setTesting("Asking the server to upload and delete a small test file…");
    try {
      const { job_id } = await api<{ job_id: string }>(`/backups/settings/test?server_id=${server}`, { method: "POST", auth: true });
      await waitForBackupJob(job_id, 60_000);
      setTesting("Storage works: the server could write and delete a file.");
    } catch (e) {
      setTesting(e instanceof Error ? e.message : "The test failed");
    }
  };

  return (
    <FormCard
      title="Backup Storage"
      description="Backups are always encrypted on the server before they go anywhere. Copy them off the server too, so losing a server doesn't lose its backups."
      footer={
        save.error ? (
          <span className="text-err">{save.error.message}</span>
        ) : testing ? (
          testing
        ) : save.isSuccess ? (
          "Saved. New backups use these settings."
        ) : provider === "s3" && initial.has_credentials ? (
          "Keys are stored encrypted and never shown again."
        ) : null
      }
      action={
        <div className="flex flex-wrap gap-2">
          {initial.storage_enabled && initial.provider === provider && (
            <>
              {online.length > 1 && (
                <Select value={testServer} onChange={(e) => setTestServer(e.target.value)} className="w-40" aria-label="Test from">
                  {online.map((s) => (
                    <option key={s.id} value={s.id}>
                      Test from {s.name}
                    </option>
                  ))}
                </Select>
              )}
              <Button variant="secondary" size="sm" onClick={test}>
                Test connection
              </Button>
            </>
          )}
          <Button variant="primary" size="sm" disabled={save.isPending} onClick={submit}>
            Save
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {driveNotice && (
          <Callout tone="ok" icon="check-circle">
            {driveNotice}
          </Callout>
        )}
        {driveError && (
          <Callout tone="err" icon="x-circle" title="Google Drive wasn't connected">
            {driveError}
          </Callout>
        )}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="accent-[var(--color-accent)]" />
            Copy backups off the server
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={keepLocal} onChange={(e) => setKeepLocal(e.target.checked)} className="accent-[var(--color-accent)]" />
            Keep a copy on the server too
          </label>
        </div>

        <div role="tablist" className="grid max-w-md grid-cols-2 gap-1 rounded-lg border border-line bg-bg p-1">
          {(
            [
              ["s3", "S3-compatible"],
              ["gdrive", "Google Drive"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={provider === value}
              onClick={() => setProvider(value)}
              className={cn("h-9 rounded-md text-sm transition-colors", provider === value ? "bg-black/[0.08] text-fg" : "text-muted hover:text-fg")}
            >
              {label}
            </button>
          ))}
        </div>

        {provider === "s3" ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="svc">Service</Label>
              <Select id="svc" value={preset} onChange={(e) => (setPreset(e.target.value), setPresetValue(""))}>
                {PRESETS.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </Select>
            </div>
            {p.field ? (
              <div className="sm:col-span-2">
                <Label htmlFor="pv" hint={endpoint ? <span className="font-mono">{endpoint}</span> : undefined}>
                  {p.fieldLabel}
                </Label>
                <Input id="pv" placeholder={p.placeholder} value={presetValue} onChange={(e) => setPresetValue(e.target.value.trim().toLowerCase())} className="font-mono" />
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="ep" hint="https://…">
                    Endpoint
                  </Label>
                  <Input id="ep" placeholder="https://minio.example.com" value={s3.endpoint} onChange={set("endpoint")} className="font-mono" />
                </div>
                <div>
                  <Label htmlFor="rg">Region</Label>
                  <Input id="rg" placeholder="auto" value={s3.region} onChange={set("region")} className="font-mono" />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="bk">Bucket</Label>
              <Input id="bk" placeholder="my-backups" value={s3.bucket} onChange={set("bucket")} className="font-mono" />
            </div>
            <div>
              <Label htmlFor="pf" hint="optional">
                Folder
              </Label>
              <Input id="pf" placeholder="vpspilot" value={s3.prefix} onChange={set("prefix")} className="font-mono" />
            </div>
            <div />
            <div>
              <Label htmlFor="ak" hint="write-only">
                {preset === "r2" ? "Access key ID" : "Access key"}
              </Label>
              <Input id="ak" autoComplete="off" placeholder={initial.has_credentials ? "Unchanged" : ""} value={s3.access_key} onChange={set("access_key")} className="font-mono" />
            </div>
            <div>
              <Label htmlFor="sk" hint="write-only">
                {preset === "r2" ? "Secret access key" : "Secret key"}
              </Label>
              <Input id="sk" type="password" autoComplete="off" placeholder={initial.has_credentials ? "Unchanged" : ""} value={s3.secret_key} onChange={set("secret_key")} />
            </div>
            {preset === "r2" && (
              <p className="text-xs leading-relaxed text-subtle sm:col-span-3">
                In Cloudflare: R2 → Manage API tokens → Create token with <span className="text-fg">Object Read &amp; Write</span> on this bucket. Use the S3 access key ID and secret it shows.
              </p>
            )}
          </div>
        ) : (
          <DriveSetup initial={initial} />
        )}
      </div>
    </FormCard>
  );
}

function DriveSetup({ initial }: { initial: BackupSettings }) {
  const drive = initial.gdrive;
  const save = useSaveBackupSettings();
  const connect = useConnectDrive();
  const disconnect = useDisconnectDrive();
  const [clientId, setClientId] = useState(drive.client_id ?? "");
  const [secret, setSecret] = useState("");
  const idValid = /^[A-Za-z0-9-]{5,120}\.apps\.googleusercontent\.com$/.test(clientId.trim());
  const ready = !!drive.client_id && drive.has_secret;

  if (drive.connected) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-bg p-4">
        <Icon name="check-circle" className="text-ok" />
        <div className="min-w-0 flex-1 text-sm">
          Connected to <span className="font-medium">{drive.account ?? "Google Drive"}</span>
          <div className="text-xs text-subtle">Backups go to the &quot;VPSPilot backups&quot; folder. VPSPilot can only see files it created.</div>
        </div>
        <Button variant="secondary" size="sm" disabled={disconnect.isPending} onClick={() => disconnect.mutate()}>
          Disconnect
        </Button>
        {disconnect.error && <p className="w-full text-sm text-err">{disconnect.error.message}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
        <li>
          In{" "}
          <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" target="_blank" rel="noreferrer" className="text-fg underline underline-offset-2">
            Google Cloud Console
          </a>
          , enable the Google Drive API for a project.
        </li>
        <li>
          Under APIs &amp; Services → Credentials, create an <span className="text-fg">OAuth client ID</span> of type Web application, with this redirect URI:
          <div className="mt-1.5 flex items-center gap-2 rounded-md border border-line bg-bg px-3 py-1.5">
            <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-fg">{drive.redirect_uri}</code>
            <CopyButton value={drive.redirect_uri} />
          </div>
        </li>
        <li>
          On the OAuth consent screen, set publishing status to <span className="text-fg">In production</span> (in testing, Google expires access after 7 days).
        </li>
        <li>Paste the client ID and secret here, save, then connect.</li>
      </ol>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="gid">Client ID</Label>
          <Input id="gid" placeholder="123…apps.googleusercontent.com" value={clientId} onChange={(e) => setClientId(e.target.value)} className="font-mono" />
        </div>
        <div>
          <Label htmlFor="gsec" hint="write-only">
            Client secret
          </Label>
          <Input id="gsec" type="password" autoComplete="off" placeholder={drive.has_secret ? "Unchanged" : "GOCSPX-…"} value={secret} onChange={(e) => setSecret(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!idValid || (!secret && !drive.has_secret) || save.isPending}
          onClick={() => save.mutate({ gdrive_client_id: clientId.trim(), ...(secret ? { gdrive_client_secret: secret.trim() } : {}) }, { onSuccess: () => setSecret("") })}
        >
          Save client
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon="external-link"
          disabled={!ready || connect.isPending}
          onClick={() => connect.mutate(undefined, { onSuccess: ({ url }) => window.location.assign(url) })}
        >
          {connect.isPending ? "Opening Google…" : "Connect Google Drive"}
        </Button>
        {(save.error ?? connect.error) && <span className="text-sm text-err">{(save.error ?? connect.error)?.message}</span>}
      </div>
    </div>
  );
}
