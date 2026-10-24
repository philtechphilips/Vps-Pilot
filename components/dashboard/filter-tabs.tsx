"use client";

import { cn } from "@/lib/utils";

/** Segmented filter control (Vercel "All / Production / Preview" style). */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("no-scrollbar inline-flex max-w-full overflow-x-auto rounded-md border border-line bg-bg p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex h-8 shrink-0 items-center gap-1.5 rounded-[5px] px-3 text-[13px] transition-colors",
            o.value === value ? "bg-bg-300 text-fg shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]" : "text-muted hover:text-fg",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="text-xs text-subtle tabular-nums">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
