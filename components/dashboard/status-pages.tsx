"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Icon } from "@/components/icons";
import { Button, Card, Input, Label, SectionTitle } from "@/components/ui";
import type { Domain } from "@/lib/api/domains";
import { type StatusPage, useDeleteStatusPage, useSaveStatusPage, useStatusPages } from "@/lib/api/status";

/** Public pages showing whether your sites are up. */
export function StatusPagesSection({ domains }: { domains: Domain[] }) {
  const pages = useStatusPages();
  const remove = useDeleteStatusPage();
  const [editing, setEditing] = useState<StatusPage | "new" | null>(null);
  const [deleting, setDeleting] = useState<StatusPage | null>(null);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const watched = domains.filter((d) => !d.redirect_to && d.application_id);

  return (
    <section>
      <SectionTitle
        action={
          <Button variant="secondary" size="xs" icon="plus" disabled={!watched.length} onClick={() => setEditing("new")}>
            New status page
          </Button>
        }
      >
        Status Pages
      </SectionTitle>
      {!pages.data?.length ? (
        <Card className="p-5 text-sm text-muted">
          A public page for your users or clients: which of your sites are up, 30 days of uptime and recent outages, from the checks VPSPilot already
          runs every minute. Nothing about your servers is shown.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {pages.data.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 text-sm last:border-0">
              <span className="font-medium">{p.title}</span>
              <a href={`/status/${p.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-muted hover:text-fg hover:underline">
                {origin}/status/{p.slug} <Icon name="external-link" size={12} />
              </a>
              <span className="text-xs text-subtle">
                {p.components.length} site{p.components.length === 1 ? "" : "s"}
              </span>
              <span className="ml-auto flex gap-1">
                <button type="button" aria-label={`Edit ${p.title}`} onClick={() => setEditing(p)} className="rounded p-1.5 text-subtle hover:bg-white/10 hover:text-fg">
                  <Icon name="settings" size={14} />
                </button>
                <button type="button" aria-label={`Delete ${p.title}`} onClick={() => setDeleting(p)} className="rounded p-1.5 text-subtle hover:bg-white/10 hover:text-err">
                  <Icon name="trash" size={14} />
                </button>
              </span>
            </div>
          ))}
        </Card>
      )}
      {editing && <PageDialog page={editing === "new" ? null : editing} domains={watched} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete status page"
        confirmText={deleting?.slug ?? ""}
        action="Delete"
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      >
        The public link stops working.
      </ConfirmDialog>
    </section>
  );
}

function PageDialog({ page, domains, onClose }: { page: StatusPage | null; domains: Domain[]; onClose: () => void }) {
  const save = useSaveStatusPage();
  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [description, setDescription] = useState(page?.description ?? "");
  const [picked, setPicked] = useState<Record<string, string>>(() =>
    Object.fromEntries((page?.components ?? []).map((c) => [c.domain_id, c.label])),
  );
  const valid = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(slug) && Object.keys(picked).length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={page ? "Edit status page" : "New status page"}
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-[520px] animate-fade-up overflow-y-auto rounded-t-xl border border-line-strong bg-bg-100 shadow-2xl sm:rounded-xl"
      >
        <div className="space-y-4 p-6">
          <h2 className="text-xl font-semibold tracking-tight">{page ? "Edit status page" : "New status page"}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="st">Title</Label>
              <Input id="st" placeholder="Acme status" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ss" hint="the link">
                Address
              </Label>
              <Input id="ss" className="font-mono" placeholder="acme" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} />
            </div>
          </div>
          <div>
            <Label htmlFor="sd" hint="optional">
              Description
            </Label>
            <Input id="sd" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Sites to show</Label>
            <div className="divide-y divide-line rounded-md border border-line">
              {domains.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label={`Show ${d.hostname}`}
                    checked={d.id in picked}
                    onChange={(e) =>
                      setPicked((v) => {
                        const next = { ...v };
                        if (e.target.checked) next[d.id] = "";
                        else delete next[d.id];
                        return next;
                      })
                    }
                    className="accent-[var(--color-accent)]"
                  />
                  <span className="w-44 truncate font-mono text-xs">{d.hostname}</span>
                  {d.id in picked && (
                    <Input
                      aria-label={`Name shown for ${d.hostname}`}
                      className="h-8 text-xs"
                      placeholder="shown as (e.g. Website)"
                      value={picked[d.id]}
                      onChange={(e) => setPicked((v) => ({ ...v, [d.id]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-subtle">Without a name, the hostname is shown.</p>
          </div>
          {save.error && <p className="text-sm text-err">{save.error.message}</p>}
        </div>
        <div className="flex justify-between gap-2 border-t border-line bg-bg-200 px-6 py-4">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!valid || save.isPending}
            onClick={() =>
              save.mutate(
                {
                  id: page?.id,
                  slug,
                  title: title.trim() || "Status",
                  description: description.trim(),
                  components: Object.entries(picked).map(([domain_id, label]) => ({ domain_id, label: label.trim() })),
                },
                { onSuccess: onClose },
              )
            }
          >
            {page ? "Save" : "Create page"}
          </Button>
        </div>
      </div>
    </div>
  );
}
