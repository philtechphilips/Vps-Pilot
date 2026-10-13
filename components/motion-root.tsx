"use client";

import { useEffect } from "react";

/**
 * Page-level motion controller.
 * - Reveals every `[data-reveal]` element once it scrolls into view.
 * - Feeds the cursor position to `[data-spot]` cards for the hover spotlight.
 * One observer and one pointer listener for the whole page.
 */
export function MotionRoot() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.reveal = "in";
            io.unobserve(e.target);
          }
        }
      },
      // threshold 0: sections taller than the viewport could never reach a ratio threshold.
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    const observe = (root: ParentNode) => root.querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal='in'])").forEach((el) => io.observe(el));
    observe(document);

    // Content can mount later (tab switches, client components); pick it up too.
    const mo = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => n instanceof HTMLElement && (n.matches("[data-reveal]") ? io.observe(n) : observe(n)));
    });
    mo.observe(document.body, { childList: true, subtree: true });

    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.<HTMLElement>("[data-spot]");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("pointermove", onMove);
    };
  }, []);

  return null;
}
