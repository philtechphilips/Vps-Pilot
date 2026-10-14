"use client";

import { Icon } from "@/components/icons";
import { FormCard } from "@/components/ui";
import { type NotificationSettings, useNotificationSettings, useUpdateNotificationSettings } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

type Key = keyof Omit<NotificationSettings, "email">;

const OPTIONS: { key: Key; title: string; desc: string }[] = [
  { key: "email_deploy_success", title: "Deployment succeeded", desc: "A new version passed its health check and is live." },
  { key: "email_deploy_failure", title: "Deployment failed", desc: "A build, health check or release failed. The previous version keeps running." },
];

export function NotificationSettingsCard() {
  const prefs = useNotificationSettings();
  const update = useUpdateNotificationSettings();

  return (
    <FormCard
      title="Notifications"
      description={
        <>
          Every admin gets these in the inbox (the bell at the top). Choose which ones are also emailed to{" "}
          <span className="text-fg">{prefs.data?.email ?? "you"}</span>.
        </>
      }
      footer={update.error ? <span className="text-err">{update.error.message}</span> : update.isSuccess ? "Saved." : "Changes save automatically."}
    >
      {prefs.isLoading ? (
        <div className="skeleton h-28 rounded-md" />
      ) : (
        <div className="overflow-hidden rounded-md border border-line">
          {OPTIONS.map((o) => {
            const on = !!prefs.data?.[o.key];
            return (
              <div key={o.key} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0">
                <Icon name="inbox" className="shrink-0 text-subtle" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{o.title}</div>
                  <div className="text-xs text-subtle">{o.desc}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`Email me when: ${o.title}`}
                  disabled={update.isPending}
                  onClick={() => update.mutate({ [o.key]: !on })}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-60",
                    on ? "border-accent/70 bg-accent" : "border-line-strong bg-bg-200",
                  )}
                >
                  <span className={cn("absolute top-0.5 size-[18px] rounded-full bg-white shadow transition-[left]", on ? "left-[22px]" : "left-0.5")} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </FormCard>
  );
}
