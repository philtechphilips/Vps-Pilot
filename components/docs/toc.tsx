"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Heading = { id: string; title: string; level: number };

/** "On this page": reads the article's headings and follows the scroll. */
export function DocsToc() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-doc] [data-toc]"));
    let frame = requestAnimationFrame(() => {
      setHeadings(nodes.map((n) => ({ id: n.id, title: n.textContent ?? "", level: Number(n.dataset.toc) })));
      update();
    });
    const update = () => {
      frame = 0;
      // The last heading above the top 30% of the viewport is the current one.
      let current = nodes[0]?.id ?? null;
      for (const n of nodes) {
        if (n.getBoundingClientRect().top < window.innerHeight * 0.3) current = n.id;
        else break;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = nodes.at(-1)?.id ?? current;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="On this page" className="text-[13px]">
      <div className="mb-3 font-medium text-fg">On this page</div>
      <ul className="space-y-0.5 border-l border-black/[0.08]">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={cn(
                "-ml-px block border-l py-1 leading-5 transition-colors",
                h.level === 3 ? "pl-6" : "pl-3",
                active === h.id ? "border-fg text-fg" : "border-transparent text-subtle hover:text-muted",
              )}
            >
              {h.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
