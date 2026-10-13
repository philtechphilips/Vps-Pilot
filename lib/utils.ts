export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Deterministic PRNG so server and client render the same mock series. */
export function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** A smooth-ish random walk clamped to [min, max]. */
export function series(seed: number, length: number, base: number, spread: number, min = 0, max = 100) {
  const rand = seeded(seed);
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < length; i++) {
    v += (rand() - 0.5) * spread;
    v += (base - v) * 0.15;
    if (rand() > 0.94) v += spread * 1.5 * (rand() - 0.3);
    v = Math.min(max, Math.max(min, v));
    out.push(Math.round(v * 10) / 10);
  }
  return out;
}
