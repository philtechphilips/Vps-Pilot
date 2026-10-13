import { serverTone, servers } from "@/lib/data";
import { WORLD, WORLD_ROWS } from "@/lib/world-map";

const CELL = 10;

/** Dot-matrix world map with a pin per server region. */
export function FleetMap() {
  const w = WORLD.cols * CELL;
  const h = WORLD_ROWS.length * CELL;

  // Group servers by region so co-located hosts share one pin.
  const regions = new Map<string, { name: string; coords: [number, number]; hosts: typeof servers }>();
  for (const s of servers) {
    const r = regions.get(s.region) ?? { name: `${s.provider} · ${s.region}`, coords: s.coords, hosts: [] };
    r.hosts.push(s);
    regions.set(s.region, r);
  }
  const project = ([lat, lon]: [number, number]) => ({
    x: ((lon + 180) / WORLD.step) * CELL,
    y: ((WORLD.top - lat) / WORLD.step) * CELL,
  });

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Map of server regions">
        {WORLD_ROWS.map((row, y) =>
          [...row].map((c, x) =>
            c === "x" ? <circle key={`${x}-${y}`} cx={x * CELL + CELL / 2} cy={y * CELL + CELL / 2} r={1.9} fill="#4a4a4a" /> : null,
          ),
        )}
        {[...regions.values()].map((r) => {
          const p = project(r.coords);
          const worst = r.hosts.some((s) => s.status === "offline") ? "err" : r.hosts.some((s) => s.status === "degraded") ? "warn" : "ok";
          const color = { ok: "#e3a6e0", warn: "#f5a623", err: "#ff4d4f" }[worst];
          const label = `${r.name} — ${r.hosts.map((s) => `${s.name} (${s.status})`).join(", ")}`;
          return (
            <g key={r.name}>
              <title>{label}</title>
              <circle cx={p.x} cy={p.y} r={14} fill={color} opacity={0.12}>
                <animate attributeName="r" values="8;18;8" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.25;0;0.25" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx={p.x} cy={p.y} r={4.5} fill={color} stroke="#1c1c1c" strokeWidth={2} />
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        {[...regions.values()].map((r) => (
          <span key={r.name} className="flex items-center gap-2">
            <span className="flex -space-x-1">
              {r.hosts.map((s) => (
                <span
                  key={s.id}
                  title={s.name}
                  className={`size-2 rounded-full ring-2 ring-bg-100 ${{ ok: "bg-accent-fg", warn: "bg-warn", err: "bg-err", neutral: "bg-subtle", blue: "bg-accent-fg", violet: "bg-violet" }[serverTone[s.status]]}`}
                />
              ))}
            </span>
            {r.name}
            <span className="text-subtle">{r.hosts.length}</span>
          </span>
        ))}
      </div>
    </div>
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
            <stop offset="0" stopColor="#7e3a7c" />
            <stop offset="1" stopColor="#e3a6e0" />
          </linearGradient>
        </defs>
        <path d={`M20 110 A${r} ${r} 0 0 1 200 110`} fill="none" stroke="#3a3a3a" strokeWidth="22" strokeLinecap="round" />
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
