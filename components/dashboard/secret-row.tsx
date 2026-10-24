"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

/**
 * Environment variable row. Secrets are write-only per the PRD: once saved the
 * API never returns the value, so "reveal" only exists for non-secret vars.
 */
export function EnvRow({ name, value, secret, envs }: { name: string; value: string; secret?: boolean; envs: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b border-line px-4 py-3 last:border-0 sm:grid-cols-[minmax(180px,1fr)_minmax(200px,1.4fr)_auto]">
      <div className="min-w-0">
        <div className="truncate font-mono text-[13px] text-fg">{name}</div>
        <div className="text-xs text-subtle">{envs}</div>
      </div>
      <div className="order-3 col-span-2 flex min-w-0 items-center gap-2 sm:order-none sm:col-span-1">
        {secret ? (
          <span className="flex items-center gap-1.5 font-mono text-[13px] text-subtle">
            <Icon name="lock" size={13} /> ••••••••••••••••
            <span className="font-sans text-xs">Encrypted</span>
          </span>
        ) : (
          <>
            <span className="truncate font-mono text-[13px] text-muted">{shown ? value : "•".repeat(Math.min(16, value.length))}</span>
            <button
              type="button"
              onClick={() => setShown((s) => !s)}
              aria-label={shown ? `Hide ${name}` : `Show ${name}`}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded text-subtle hover:bg-black/10 hover:text-fg"
            >
              <Icon name={shown ? "eye-off" : "eye"} size={14} />
            </button>
          </>
        )}
      </div>
      <button type="button" aria-label={`Options for ${name}`} className="inline-flex size-8 items-center justify-center rounded-md text-subtle hover:bg-black/10 hover:text-fg">
        <Icon name="more" />
      </button>
    </div>
  );
}
