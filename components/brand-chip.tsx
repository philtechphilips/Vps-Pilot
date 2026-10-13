import { cn } from "@/lib/utils";

// Neutral monogram chips for engines, runtimes and frameworks (no third-party logos).
const chips = {
  PostgreSQL: { label: "Pg", bg: "#336791" },
  MySQL: { label: "My", bg: "#00758f" },
  MariaDB: { label: "Ma", bg: "#a0644a" },
  Redis: { label: "Rd", bg: "#d6372c" },
  MongoDB: { label: "Mg", bg: "#3f8f3f" },
  SQLite: { label: "Sq", bg: "#0f6fb0" },
  "SQL Server": { label: "Ms", bg: "#a8232f" },
  Docker: { label: "Dk", bg: "#1d63ed" },
  systemd: { label: "sd", bg: "#2f7d4f" },
  PM2: { label: "P2", bg: "#3a2a7a" },
  "Next.js": { label: "N", bg: "#111111" },
  FastAPI: { label: "Fa", bg: "#05998b" },
  "Node.js": { label: "Js", bg: "#3f7f35" },
  Python: { label: "Py", bg: "#3572a5" },
  Go: { label: "Go", bg: "#0b8fb0" },
  Ubuntu: { label: "Ub", bg: "#c94c1c" },
  Debian: { label: "Db", bg: "#a80030" },
  Nginx: { label: "Nx", bg: "#119147" },
  Caddy: { label: "Cd", bg: "#1f7a8c" },
} as const;

export type Brand = keyof typeof chips;

export function BrandChip({ name, size = 28, className }: { name: Brand; size?: number; className?: string }) {
  const c = chips[name];
  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border border-white/10 font-mono font-semibold text-white",
        className,
      )}
      style={{ width: size, height: size, background: c.bg, fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {c.label}
    </span>
  );
}
