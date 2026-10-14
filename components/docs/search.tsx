"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { allDocs, docHref } from "@/lib/docs/nav";
import { cn } from "@/lib/utils";

function score(doc: (typeof allDocs)[number], terms: string[]) {
  const title = doc.title.toLowerCase();
  const rest = `${doc.section} ${doc.description} ${doc.keywords ?? ""}`.toLowerCase();
  let total = 0;
  for (const t of terms) {
    if (title.startsWith(t)) total += 6;
    else if (title.includes(t)) total += 4;
    else if (rest.includes(t)) total += 1;
    else return 0; // every term must match somewhere
  }
  return total;
}

/** Header search field that opens a ⌘K palette over the docs pages. */
export function DocsSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return allDocs.slice(0, 8);
    return allDocs
      .map((d) => ({ d, s: score(d, terms) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 10)
      .map((r) => r.d);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    input.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    list.current?.querySelector(`[data-i="${index}"]`)?.scrollIntoView({ block: "nearest" });
  }, [index]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setIndex(0);
  };
  const go = (slug: string) => {
    close();
    router.push(docHref(slug));
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-subtle transition-colors hover:border-white/15 hover:text-muted"
      >
        <Icon name="search" size={14} />
        <span>Search docs…</span>
        <kbd className="ml-auto hidden rounded border border-white/10 bg-white/[0.04] px-1.5 font-mono text-[11px] sm:inline">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search documentation">
          <button type="button" aria-label="Close search" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-xl animate-fade-up overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-[0_24px_80px_-12px_rgb(0_0_0/0.9)]">
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
              <Icon name="search" className="text-subtle" />
              <input
                ref={input}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") close();
                  else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setIndex((i) => Math.min(i + 1, results.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setIndex((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter" && results[index]) go(results[index].slug);
                }}
                placeholder="Search the documentation"
                aria-label="Search the documentation"
                role="combobox"
                aria-expanded="true"
                aria-controls="docs-search-results"
                aria-activedescendant={results[index] ? `docs-result-${index}` : undefined}
                className="h-13 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-subtle"
              />
              <kbd className="rounded border border-white/10 px-1.5 font-mono text-[11px] text-subtle">Esc</kbd>
            </div>
            <ul ref={list} id="docs-search-results" role="listbox" className="thin-scrollbar max-h-[min(60vh,420px)] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-10 text-center text-sm text-subtle">No pages match “{query}”.</li>}
              {results.map((d, i) => (
                <li key={d.slug} id={`docs-result-${i}`} data-i={i} role="option" aria-selected={i === index}>
                  <button
                    type="button"
                    onMouseMove={() => setIndex(i)}
                    onClick={() => go(d.slug)}
                    className={cn("flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left", i === index && "bg-white/[0.06]")}
                  >
                    <Icon name="file-text" size={15} className="mt-0.5 shrink-0 text-subtle" />
                    <span className="min-w-0">
                      <span className="block text-sm text-fg">
                        <span className="text-subtle">{d.section} / </span>
                        {d.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-subtle">{d.description}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
