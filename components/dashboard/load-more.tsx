"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/icons";

/**
 * Infinite scroll: loads the next page when this sentinel scrolls into view
 * (a little before the bottom), so nobody has to press "load more".
 */
export function LoadMore({ hasMore, loading, onLoad, label = "items" }: { hasMore: boolean; loading: boolean; onLoad: () => void; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const load = useRef(onLoad);
  useEffect(() => {
    load.current = onLoad;
  }, [onLoad]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && load.current(), { rootMargin: "600px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return (
    <div ref={ref} className="flex h-12 items-center justify-center text-xs text-subtle" aria-live="polite">
      {loading ? (
        <span className="flex items-center gap-2">
          <Icon name="refresh" size={13} className="animate-spin" /> Loading more {label}…
        </span>
      ) : hasMore ? null : (
        <span>That&apos;s everything.</span>
      )}
    </div>
  );
}
