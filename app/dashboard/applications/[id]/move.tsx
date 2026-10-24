"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Icon } from "@/components/icons";
import { Button, FormCard, Mono, Select } from "@/components/ui";
import { type App, type AppMove, useAppMove, useMoveAction } from "@/lib/api/apps";
import type { Domain } from "@/lib/api/domains";
import { useServers } from "@/lib/api/servers";
import { cn } from "@/lib/utils";

const STEPS: { key: AppMove["step"]; label: string }[] = [
  { key: "files", label: "Back up files" },
  { key: "databases", label: "Copy databases" },
  { key: "deploy", label: "Deploy on the new server" },
  { key: "restore", label: "Restore files" },
  { key: "domains", label: "Serve the domains there too" },
  { key: "dns", label: "Point DNS at the new server" },
];

/** Move the app (files, databases, domains) to another server. */
export function MoveSection({ app, domains }: { app: App; domains: Domain[] }) {
  const info = useAppMove(app.id);
  const act = useMoveAction(app.id);
  const { data: servers } = useServers();
  const [target, setTarget] = useState("");
  const [files, setFiles] = useState(true);
  const [confirm, setConfirm] = useState<"start" | "finish" | "cancel" | null>(null);
  const move = info.data?.move;
  const plan = info.data?.plan;
  const active = move && (move.status === "running" || move.status === "waiting_dns");
  const choices = (servers ?? []).filter((s) => s.id !== app.server_id && s.enrolled_at && s.status !== "revoked");
  const targetName = choices.find((s) => s.id === target)?.name;
  const live = domains.filter((d) => !d.redirect_to);
  const pointed = (d: Domain) => !!move?.target_ips.some((ip) => d.dns_addresses.includes(ip));

  return (
    <FormCard
      title="Move to Another Server"
      description="Copies the app, its files and its managed databases to another server. The old copy keeps serving until you point DNS at the new one and finish."
      footer={act.error ? <span className="text-err">{act.error.message}</span> : move?.status === "failed" ? <span className="text-err">The move failed: {move.error}. The app stays on {move.source_server}.</span> : move?.status === "done" ? `Moved from ${move.source_server} to ${move.target_server}. The old server's databases are kept until you delete them.` : null}
      action={
        active ? (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={act.isPending} onClick={() => setConfirm("cancel")}>
              Cancel move
            </Button>
            {move.status === "waiting_dns" && (
              <Button variant="primary" size="sm" disabled={act.isPending} onClick={() => setConfirm("finish")}>
                Finish move
              </Button>
            )}
          </div>
        ) : (
          <Button variant="primary" size="sm" disabled={!target || act.isPending || !app.current_deployment} onClick={() => setConfirm("start")}>
            Move
          </Button>
        )
      }
    >
      {active ? (
        <div className="space-y-4">
          <p className="text-sm">
            {move.source_server} <Icon name="arrow-right" size={12} className="inline" /> {move.target_server}
          </p>
          <ol className="space-y-1.5">
            {STEPS.filter((s) => move.include_files || (s.key !== "files" && s.key !== "restore")).map((s) => {
              const order = STEPS.findIndex((x) => x.key === s.key);
              const current = STEPS.findIndex((x) => x.key === move.step);
              const state = order < current ? "done" : order === current ? "now" : "next";
              return (
                <li key={s.key} className={cn("flex items-center gap-2 text-sm", state === "next" && "text-subtle")}>
                  <Icon name={state === "done" ? "check-circle" : state === "now" ? "clock" : "minus"} size={14} className={state === "done" ? "text-ok" : state === "now" ? "text-warn" : ""} />
                  {s.label}
                  {s.key === "databases" &&
                    move.databases.map((d) => (
                      <span key={d.from} className="text-xs text-subtle">
                        · {d.from} → {d.to ?? "…"} ({d.stage})
                      </span>
                    ))}
                </li>
              );
            })}
          </ol>
          {move.status === "waiting_dns" && (
            <div className="rounded-md border border-line bg-bg p-3 text-sm">
              <p className="mb-2">
                Both servers serve the app now. Point these at <Mono>{move.target_ips[0] ?? move.target_server}</Mono>, wait for DNS, then finish:
              </p>
              {live.length === 0 && <p className="text-xs text-subtle">The app has no domains; you can finish right away.</p>}
              {live.map((d) => (
                <p key={d.id} className="flex items-center gap-2 text-xs">
                  <Icon name={pointed(d) ? "check-circle" : "clock"} size={12} className={pointed(d) ? "text-ok" : "text-warn"} />
                  <Mono>{d.hostname}</Mono>
                  <span className="text-subtle">{pointed(d) ? "points at the new server" : `still ${d.dns_addresses.join(", ") || "not resolving"}`}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Select aria-label="Move to" className="w-56" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Pick a server…</option>
              {choices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            {plan?.files && (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={files} onChange={(e) => setFiles(e.target.checked)} className="accent-[var(--color-accent)]" />
                Copy the app&apos;s files
              </label>
            )}
          </div>
          <p className="text-xs text-subtle">
            {plan?.databases.length ? `Databases copied: ${plan.databases.map((d) => d.name).join(", ")} (Redis data isn't copied). ` : "No managed databases attached. "}
            {plan?.files && files && !plan.storage && "Copying files needs off-server backup storage (Settings → Backup Storage). "}
            {!app.current_deployment && "Deploy the app first."}
          </p>
        </div>
      )}
      <ConfirmDialog
        open={confirm === "start"}
        onClose={() => setConfirm(null)}
        danger={false}
        title={`Move ${app.name} to ${targetName}`}
        confirmText={app.name}
        action="Start move"
        onConfirm={() => {
          setConfirm(null);
          act.mutate({ action: "start", body: { server_id: target, include_files: files } });
        }}
      >
        Writes to the databases after their copy is taken aren&apos;t moved, so do it at a quiet time. Nothing changes for visitors until you point DNS at the
        new server.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === "finish"}
        onClose={() => setConfirm(null)}
        title="Finish the move"
        confirmText={app.name}
        action="Finish"
        onConfirm={() => {
          setConfirm(null);
          act.mutate({ action: "finish" });
        }}
      >
        The old copy on {move?.source_server} is removed and only {move?.target_server} serves the domains. Do this once DNS points at the new server.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === "cancel"}
        onClose={() => setConfirm(null)}
        title="Cancel the move"
        confirmText={app.name}
        action="Cancel move"
        onConfirm={() => {
          setConfirm(null);
          act.mutate({ action: "cancel" });
        }}
      >
        The app goes back to {move?.source_server} as it was. Databases already created on {move?.target_server} are kept for you to delete.
      </ConfirmDialog>
    </FormCard>
  );
}
