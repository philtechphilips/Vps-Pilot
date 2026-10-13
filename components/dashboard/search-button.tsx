"use client";

import { Icon } from "@/components/icons";

export function SearchButton() {
  return (
    <button
      type="button"
      aria-label="Search (⌘K)"
      title="Search (⌘K)"
      onClick={() => window.dispatchEvent(new Event("open-command-menu"))}
      className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-white/[0.06] hover:text-fg"
    >
      <Icon name="search" />
    </button>
  );
}
