"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function CopyButton({ value, className, label = "Copy to clipboard" }: { value: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          // Clipboard can be blocked (insecure origin); still show feedback.
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-black/[0.08] hover:text-fg",
        className,
      )}
    >
      <Icon name={copied ? "check" : "copy"} size={14} className={copied ? "text-ok" : undefined} />
    </button>
  );
}

/** `$ command` pill with copy, as on nextjs.org. */
export function CommandPill({ command, className }: { command: string; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex h-11 max-w-full items-center gap-3 rounded-lg border border-line-strong bg-bg-100 pr-1.5 pl-4 font-mono text-[13px] text-muted",
        className,
      )}
    >
      <span className="truncate">
        <span className="select-none text-subtle">$ </span>
        <span className="text-fg">{command}</span>
      </span>
      <CopyButton value={command} />
    </div>
  );
}
