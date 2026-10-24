"use client";

import Link from "next/link";
import { useState } from "react";
import { draftFrom, EnvEditor, type EnvDraft, envPayload, envProblem } from "@/components/apps/app-ui";
import { Badge, Button, FormCard, Input, Label, Mono } from "@/components/ui";
import { type App, useUpdateApp } from "@/lib/api/apps";

/** A copy of the app for every pull request, at pr-<n>.<domain>. */
export function PreviewsSection({ app }: { app: App }) {
  const update = useUpdateApp(app.id);
  const [domain, setDomain] = useState(app.preview_domain ?? "");
  const [rows, setRows] = useState<EnvDraft[]>(() => draftFrom(app.preview_env));
  const [saved, setSaved] = useState(false);
  const problem = rows.length ? envProblem(rows) : null;
  if (!app.github_repo || app.preview_of) return null;

  return (
    <FormCard
      title="Preview Deployments"
      description="Every pull request from this repository gets its own copy at pr-<number>.<preview domain>, updated on each push and removed when it closes. Pull requests from forks don't get one."
      footer={
        update.error ? (
          <span className="text-err">{update.error.message}</span>
        ) : problem ? (
          problem
        ) : saved ? (
          "Saved. Applies to the next pull request event."
        ) : (
          <>
            Needs one DNS record: <Mono>*.{domain || "preview.example.com"}</Mono> pointing at {app.server_name ?? "the server"}, and the GitHub App&apos;s
            Pull requests permission.
          </>
        )
      }
      action={
        <Button
          variant="primary"
          size="sm"
          disabled={!!problem || update.isPending}
          onClick={() => update.mutate({ preview_domain: domain.trim().toLowerCase(), preview_env: envPayload(rows) }, { onSuccess: () => setSaved(true) })}
        >
          Save
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="max-w-sm">
          <Label htmlFor="pdomain" hint="empty turns previews off">
            Preview domain
          </Label>
          <Input
            id="pdomain"
            className="font-mono"
            placeholder="preview.example.com"
            value={domain}
            onChange={(e) => {
              setSaved(false);
              setDomain(e.target.value);
            }}
          />
        </div>
        <div>
          <Label>Overrides for previews</Label>
          <p className="mb-2 text-xs text-subtle">
            Previews get the app&apos;s variables, including its database. Point them somewhere safe, such as DATABASE_URL to a staging database.
          </p>
          <EnvEditor
            rows={rows}
            onChange={(next) => {
              setSaved(false);
              setRows(next);
            }}
          />
        </div>
        {app.previews.length > 0 && (
          <div>
            <Label>Open previews</Label>
            <div className="flex flex-wrap gap-2">
              {app.previews.map((p) => (
                <Link key={p.id} href={`/dashboard/applications/${p.id}`} className="inline-flex items-center gap-2 rounded-md border border-line px-2.5 py-1 text-sm hover:bg-ink/[0.04]">
                  <Badge>#{p.pr}</Badge>
                  <Mono>{p.name}</Mono>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </FormCard>
  );
}
