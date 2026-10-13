import { cn, seeded } from "@/lib/utils";

const GLYPHS = "{}[]()<>/=+-*;:._|#$%&01ifletconstasyncawaitreturnselectfromwherejoin";

/** Deterministic block of faint pseudo-code used as a texture behind panels. */
function lines(seed: number, count: number, width: number) {
  const rand = seeded(seed);
  return Array.from({ length: count }, () => {
    let out = "";
    while (out.length < width) {
      const word = Math.floor(rand() * 9) + 1;
      for (let i = 0; i < word; i++) out += GLYPHS[Math.floor(rand() * GLYPHS.length)];
      out += rand() > 0.7 ? "  " : " ";
    }
    return out.slice(0, width);
  });
}

/** `drift` scrolls the texture upward forever (content is duplicated for a seamless loop). */
export function CodeTexture({ seed = 7, className, drift }: { seed?: number; className?: string; drift?: boolean }) {
  const block = lines(seed, 48, 260);
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden font-mono text-[9px] leading-[13px] whitespace-pre text-white/[0.07] select-none",
        "[mask-image:linear-gradient(90deg,black_0%,black_55%,transparent_78%)]",
        className,
      )}
    >
      <div className={drift ? "animate-[drift_80s_linear_infinite]" : undefined}>
        {(drift ? [...block, ...block] : block).map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}
