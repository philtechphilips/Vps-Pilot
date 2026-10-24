"use client";

import { Icon } from "@/components/icons";
import { setThemePreference, useThemePreference, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

const options: { value: ThemePreference; icon: "monitor" | "sun" | "moon"; label: string }[] = [
  { value: "system", icon: "monitor", label: "System" },
  { value: "light", icon: "sun", label: "Light" },
  { value: "dark", icon: "moon", label: "Dark" },
];

/** System / light / dark switch. */
export function ThemeToggle({ className }: { className?: string }) {
  const preference = useThemePreference();
  return (
    <div className={cn("flex w-fit items-center rounded-full border border-line p-0.5", className)} role="radiogroup" aria-label="Theme">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={preference === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => setThemePreference(o.value)}
          className={cn(
            "flex size-7 items-center justify-center rounded-full transition-colors",
            preference === o.value ? "bg-ink/[0.08] text-fg" : "text-subtle hover:text-fg",
          )}
        >
          <Icon name={o.icon} size={14} />
        </button>
      ))}
    </div>
  );
}
