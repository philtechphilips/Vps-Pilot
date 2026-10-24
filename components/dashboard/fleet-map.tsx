import { WORLD, WORLD_ROWS } from "@/lib/world-map";

const CELL = 10;

/** Dot-matrix world map. Decorative until servers carry a location. */
export function FleetMap() {
  const w = WORLD.cols * CELL;
  const h = WORLD_ROWS.length * CELL;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" aria-hidden="true">
      {WORLD_ROWS.map((row, y) =>
        [...row].map((c, x) => (c === "x" ? <circle key={`${x}-${y}`} cx={x * CELL + CELL / 2} cy={y * CELL + CELL / 2} r={1.9} fill="var(--color-line-strong)" /> : null)),
      )}
    </svg>
  );
}

/** Semicircular usage gauge. */
export function Gauge({ value, label, sub }: { value: number; label: string; sub: string }) {
  const r = 90;
  const len = Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 124" className="w-full max-w-[340px]" role="img" aria-label={`${label}: ${pct}%`}>
        <defs>
          <linearGradient id="gauge-fill" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#4338ca" />
          </linearGradient>
        </defs>
        <path d={`M20 110 A${r} ${r} 0 0 1 200 110`} fill="none" stroke="var(--color-bg-300)" strokeWidth="22" strokeLinecap="round" />
        <path
          d={`M20 110 A${r} ${r} 0 0 1 200 110`}
          fill="none"
          stroke="url(#gauge-fill)"
          strokeWidth="22"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * len} ${len}`}
        />
      </svg>
      <div className="-mt-12 text-center">
        <div className="text-2xl font-semibold tracking-tight tabular-nums">{pct.toFixed(2)}%</div>
        <div className="mt-0.5 text-xs text-subtle">{sub}</div>
      </div>
    </div>
  );
}
