"use client";

import { useState } from "react";
import { Button, FormCard, Input, Label } from "@/components/ui";
import { usePlatform, useSavePlatform, useSendWeeklyReport } from "@/lib/api/platform";

/** The Monday summary: on/off, timezone, and a preview. */
export function WeeklyReportCard() {
  const platform = usePlatform();
  const save = useSavePlatform();
  const send = useSendWeeklyReport();
  const [zone, setZone] = useState<string | null>(null);
  const p = platform.data;
  const timezone = zone ?? p?.report_timezone ?? "UTC";

  return (
    <FormCard
      title="Weekly Report"
      description="Every Monday at 08:00: uptime, deploys, alerts, app errors, backups, disk and pending updates for the past week. It goes to the inbox, to admins' email (each can turn it off above) and to alert channels with Weekly report ticked."
      footer={save.error ? <span className="text-err">{save.error.message}</span> : send.data ? `Sent: ${send.data.title}` : "Send now to see what it looks like."}
      action={
        <Button variant="secondary" size="sm" disabled={send.isPending} onClick={() => send.mutate()}>
          {send.isPending ? "Sending…" : "Send now"}
        </Button>
      }
    >
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={p?.weekly_report ?? true} disabled={!p} onChange={(e) => save.mutate({ weekly_report: e.target.checked })} className="accent-[var(--color-accent)]" />
          Send the weekly report
        </label>
        <div className="w-56">
          <Label htmlFor="rtz">Timezone</Label>
          <Input id="rtz" value={timezone} onChange={(e) => setZone(e.target.value)} onBlur={() => zone && zone !== p?.report_timezone && save.mutate({ report_timezone: zone.trim() })} />
        </div>
      </div>
      {send.data && <pre className="mt-4 overflow-x-auto rounded-md border border-line bg-bg p-3 text-xs leading-5 whitespace-pre-wrap text-muted">{send.data.text}</pre>}
    </FormCard>
  );
}
