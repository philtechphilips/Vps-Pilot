"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const palette = {
  blue: "#4f46e5",
  ok: "#16a34a",
  warn: "#d97706",
  err: "#dc2626",
  violet: "#7c3aed",
  teal: "#0d9488",
  gray: "#a1a1aa",
} as const;

export type ChartColor = keyof typeof palette;

function toPath(data: number[], w: number, h: number, max: number, pad = 2) {
  const step = w / Math.max(1, data.length - 1);
  return data.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(h - pad - (v / max) * (h - pad * 2)).toFixed(2)}`).join(" ");
}

/** Inline sparkline with soft fill, for cards and table cells. */
export function Sparkline({
  data,
  color = "blue",
  height = 32,
  className,
}: {
  data: number[];
  color?: ChartColor;
  height?: number;
  className?: string;
}) {
  const id = useId();
  const w = 120;
  const max = Math.max(100, ...data);
  const line = toPath(data, w, height, max);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cn("w-full", className)} style={{ height }} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={palette[color]} stopOpacity="0.3" />
          <stop offset="100%" stopColor={palette[color]} stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect className="chart-clip" x="0" y="0" width={w} height={height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <path d={`${line} L${w},${height} L0,${height} Z`} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={palette[color]} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

/** Area chart with gridlines, y labels and a hover crosshair (Vercel Observability style). */
export function AreaChart({
  series,
  labels,
  height = 180,
  unit = "%",
  max: maxProp,
  className,
}: {
  series: { name: string; data: number[]; color: ChartColor }[];
  labels?: string[];
  height?: number;
  unit?: string;
  max?: number;
  className?: string;
}) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const w = 600;
  const len = series[0]?.data.length ?? 0;
  const rawMax = Math.max(...series.flatMap((s) => s.data));
  const max = maxProp ?? (unit === "%" ? 100 : Math.ceil((rawMax * 1.15) / 10) * 10 || 10);
  const ticks = [max, max / 2, 0];
  const step = w / Math.max(1, len - 1);

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        <div className="flex w-10 shrink-0 flex-col justify-between pr-2 text-right text-[11px] text-subtle tabular-nums" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {Math.round(t)}
              {unit}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${w} ${height}`}
            preserveAspectRatio="none"
            className="block w-full"
            style={{ height }}
            onMouseLeave={() => setHover(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * w;
              setHover(Math.max(0, Math.min(len - 1, Math.round(x / step))));
            }}
            role="img"
            aria-label={series.map((s) => `${s.name} latest ${s.data[s.data.length - 1]}${unit}`).join(", ")}
          >
            <defs>
              {series.map((s, i) => (
                <linearGradient key={s.name} id={`${id}-${i}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={palette[s.color]} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={palette[s.color]} stopOpacity="0" />
                </linearGradient>
              ))}
              <clipPath id={`${id}-clip`}>
                <rect className="chart-clip" x="0" y="0" width={w} height={height} />
              </clipPath>
            </defs>
            {[0, 0.5, 1].map((f) => (
              <line key={f} x1="0" x2={w} y1={f * height} y2={f * height} stroke="rgb(0 0 0 / 0.06)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
            ))}
            {series.map((s, i) => {
              const line = toPath(s.data, w, height, max, 1);
              return (
                <g key={s.name} clipPath={`url(#${id}-clip)`}>
                  <path d={`${line} L${w},${height} L0,${height} Z`} fill={`url(#${id}-${i})`} />
                  <path d={line} fill="none" stroke={palette[s.color]} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                </g>
              );
            })}
            {hover !== null && (
              <line x1={hover * step} x2={hover * step} y1="0" y2={height} stroke="rgb(0 0 0 / 0.2)" vectorEffect="non-scaling-stroke" />
            )}
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-md border border-line-strong bg-bg-200/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
              style={{ left: `${(hover / Math.max(1, len - 1)) * 100}%`, transform: hover > len / 2 ? "translateX(calc(-100% - 8px))" : "translateX(8px)" }}
            >
              {labels && <div className="mb-1.5 text-subtle">{labels[hover]}</div>}
              {series.map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-muted">
                    <span className="size-2 rounded-sm" style={{ background: palette[s.color] }} />
                    {s.name}
                  </span>
                  <span className="font-mono text-fg tabular-nums">
                    {s.data[hover]}
                    {unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {labels && (
        <div className="mt-2 flex justify-between pl-10 text-[11px] text-subtle">
          <span>{labels[0]}</span>
          <span>{labels[Math.floor(labels.length / 2)]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

/** Vertical bar chart (deployments per day, ops/sec etc.). */
export function BarChart({ data, labels, color = "blue", height = 120 }: { data: number[]; labels?: string[]; color?: ChartColor; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {data.map((v, i) => (
          <div
            key={i}
            title={labels ? `${labels[i]}: ${v}` : String(v)}
            className="min-w-0 flex-1 rounded-t-[2px] opacity-80 transition-opacity hover:opacity-100"
            style={{ height: `${Math.max(3, (v / max) * 100)}%`, background: palette[color] }}
          />
        ))}
      </div>
      {labels && (
        <div className="mt-2 flex justify-between text-[11px] text-subtle">
          <span>{labels[0]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

export function Legend({ items }: { items: { name: string; color: ChartColor; value?: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
      {items.map((i) => (
        <span key={i.name} className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm" style={{ background: palette[i.color] }} />
          {i.name}
          {i.value && <span className="font-mono text-fg">{i.value}</span>}
        </span>
      ))}
    </div>
  );
}
