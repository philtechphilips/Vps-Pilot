"use client";

// Agent-install terminal for the landing page: types itself out once visible.
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const lines: { text: string; className?: string; typed?: boolean; pause?: number }[] = [
  { text: "curl -fsSL https://pilot.example.com/agent/install.sh | sudo bash -s -- \\", typed: true },
  { text: "    --token ept_••••••••••••3f9a", typed: true, className: "text-muted", pause: 500 },
  { text: "VPSPilot Agent 1.1.0", className: "text-subtle", pause: 350 },
  { text: "✓ Detected Debian 12 (bookworm) · arm64", className: "text-ok", pause: 450 },
  { text: "✓ Enrollment token redeemed (single-use)", className: "text-ok", pause: 450 },
  { text: "✓ Agent identity issued · SHA256:aP4r…Kk1z", className: "text-ok", pause: 450 },
  { text: "✓ systemd unit vpspilot-agent.service active", className: "text-ok", pause: 600 },
  { text: "Connected to control plane via outbound HTTPS. edge-jnb-01 is online.", className: "text-fg" },
];

export function TerminalMock() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [line, setLine] = useState(0);
  const [chars, setChars] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started || line >= lines.length) return;
    const l = lines[line];
    if (l.typed && chars < l.text.length) {
      const t = setTimeout(() => setChars((c) => c + 1), 22);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setLine((n) => n + 1);
      setChars(0);
    }, l.pause ?? 250);
    return () => clearTimeout(t);
  }, [started, line, chars]);

  const done = line >= lines.length;

  return (
    <div ref={ref} className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0d0d0d] font-mono text-[12px] leading-6">
      <div className="flex h-9 items-center gap-1.5 border-b border-white/[0.06] px-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]/70" />
        <span className="size-2.5 rounded-full bg-[#febc2e]/70" />
        <span className="size-2.5 rounded-full bg-[#28c840]/70" />
        <span className="ml-3 text-[11px] text-subtle">root@edge-jnb-01: ~</span>
      </div>
      <div className="min-h-[232px] p-4" aria-label="Agent installation output">
        {lines.slice(0, Math.min(line + 1, lines.length)).map((l, i) => {
          const current = i === line && !done;
          const text = l.typed && current ? l.text.slice(0, chars) : l.text;
          if (!started && i === 0) return <Prompt key={i} cursor />;
          return (
            <div key={i} className={cn("whitespace-pre-wrap", l.className, !l.typed && "animate-fade-up")}>
              {i === 0 && <span className="text-subtle">$ </span>}
              {text}
              {current && l.typed && <Cursor />}
            </div>
          );
        })}
        {done && <Prompt cursor />}
      </div>
    </div>
  );
}

function Prompt({ cursor }: { cursor?: boolean }) {
  return (
    <div>
      <span className="text-subtle">$ </span>
      {cursor && <Cursor />}
    </div>
  );
}

function Cursor() {
  return <span className="ml-px inline-block h-[14px] w-[7px] translate-y-[2px] animate-caret bg-accent-fg" />;
}
