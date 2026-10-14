"use client";

import { useState } from "react";
import { Button, FormCard, Input, Label, Select } from "@/components/ui";
import { type BackupSettings, useBackupSettings, useSaveBackupSettings, waitForBackupJob } from "@/lib/api/backups";
import { api } from "@/lib/api/client";
import { useServers } from "@/lib/api/servers";

export function BackupStorageCard() {
  const settings = useBackupSettings();
  if (settings.isLoading || !settings.data) return <div className="skeleton h-64 rounded-xl" />;
  return <StorageForm key={settings.data.updated_at ?? "new"} initial={settings.data} />;
}

function StorageForm({ initial }: { initial: BackupSettings }) {
  const save = useSaveBackupSettings();
  const { data: servers } = useServers();
  const online = (servers ?? []).filter((s) => s.status === "online");
  const [form, setForm] = useState({
    storage_enabled: initial.storage_enabled,
    endpoint: initial.endpoint ?? "",
    region: initial.region ?? "auto",
    bucket: initial.bucket ?? "",
    prefix: initial.prefix ?? "",
    access_key: "",
    secret_key: "",
    keep_local: initial.keep_local,
  });
  const [testServer, setTestServer] = useState("");
  const [testing, setTesting] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () =>
    save.mutate({
      storage_enabled: form.storage_enabled,
      endpoint: form.endpoint.trim().replace(/\/$/, "") || null,
      region: form.region.trim() || "auto",
      bucket: form.bucket.trim() || null,
      prefix: form.prefix.trim(),
      keep_local: form.keep_local,
      ...(form.access_key ? { access_key: form.access_key } : {}),
      ...(form.secret_key ? { secret_key: form.secret_key } : {}),
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
      description="Backups are always encrypted on the server. Add S3-compatible storage (AWS S3, Cloudflare R2, Backblaze B2, MinIO…) to keep a copy off the server, so losing a server doesn't lose its backups."
      footer={save.error ? <span className="text-err">{save.error.message}</span> : testing ? testing : save.isSuccess ? "Saved. New backups use these settings." : initial.has_credentials ? "Keys are stored encrypted and never shown again." : null}
      action={
        <div className="flex flex-wrap gap-2">
          {initial.storage_enabled && (
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
      <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={form.storage_enabled} onChange={(e) => setForm((f) => ({ ...f, storage_enabled: e.target.checked }))} className="accent-[var(--color-accent)]" />
        Copy backups to S3-compatible storage
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label htmlFor="ep" hint="https://…">
            Endpoint
          </Label>
          <Input id="ep" placeholder="https://s3.us-east-1.amazonaws.com" value={form.endpoint} onChange={set("endpoint")} className="font-mono" />
        </div>
        <div>
          <Label htmlFor="rg">Region</Label>
          <Input id="rg" placeholder="auto" value={form.region} onChange={set("region")} className="font-mono" />
        </div>
        <div>
          <Label htmlFor="bk">Bucket</Label>
          <Input id="bk" placeholder="my-backups" value={form.bucket} onChange={set("bucket")} className="font-mono" />
        </div>
        <div>
          <Label htmlFor="pf" hint="optional">
            Folder
          </Label>
          <Input id="pf" placeholder="vpspilot" value={form.prefix} onChange={set("prefix")} className="font-mono" />
        </div>
        <div className="flex items-end">
          <label className="flex h-10 cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={form.keep_local} onChange={(e) => setForm((f) => ({ ...f, keep_local: e.target.checked }))} className="accent-[var(--color-accent)]" />
            Keep a copy on the server too
          </label>
        </div>
        <div>
          <Label htmlFor="ak" hint="write-only">
            Access key
          </Label>
          <Input id="ak" autoComplete="off" placeholder={initial.has_credentials ? "Unchanged" : ""} value={form.access_key} onChange={set("access_key")} className="font-mono" />
        </div>
        <div>
          <Label htmlFor="sk" hint="write-only">
            Secret key
          </Label>
          <Input id="sk" type="password" autoComplete="off" placeholder={initial.has_credentials ? "Unchanged" : ""} value={form.secret_key} onChange={set("secret_key")} />
        </div>
      </div>
    </FormCard>
  );
}
