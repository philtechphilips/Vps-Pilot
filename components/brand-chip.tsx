import Image from "next/image";
import { cn } from "@/lib/utils";

// Engine, runtime and framework chips. Brands with a `logo` (served from /public/brands)
// render the official mark on a light tile; the rest fall back to a monogram.
type Chip = { label: string; bg: string; logo?: string };

const chips = {
  PostgreSQL: { label: "Pg", bg: "#336791", logo: "/brands/postgresql.svg" },
  MySQL: { label: "My", bg: "#00758f", logo: "/brands/mysql.svg" },
  MariaDB: { label: "Ma", bg: "#a0644a", logo: "/brands/mariadb.svg" },
  Redis: { label: "Rd", bg: "#d6372c", logo: "/brands/redis.svg" },
  MongoDB: { label: "Mg", bg: "#3f8f3f", logo: "/brands/mongodb.svg" },
  SQLite: { label: "Sq", bg: "#0f6fb0", logo: "/brands/sqlite.svg" },
  "SQL Server": { label: "Ms", bg: "#a8232f", logo: "/brands/microsoftsqlserver.svg" },
  Docker: { label: "Dk", bg: "#1d63ed", logo: "/brands/docker.svg" },
  systemd: { label: "sd", bg: "#2f7d4f" },
  PM2: { label: "P2", bg: "#3a2a7a" },
  Ubuntu: { label: "Ub", bg: "#c94c1c", logo: "/brands/ubuntu.svg" },
  Debian: { label: "Db", bg: "#a80030", logo: "/brands/debian.svg" },
  Nginx: { label: "Nx", bg: "#119147", logo: "/brands/nginx.svg" },
  Caddy: { label: "Cd", bg: "#1f7a8c" },
  // Languages and frameworks (logos from Devicon, MIT)
  "Node.js": { label: "Js", bg: "#3f7f35", logo: "/brands/nodejs.svg" },
  Bun: { label: "Bn", bg: "#3b3226", logo: "/brands/bun.svg" },
  Python: { label: "Py", bg: "#3572a5", logo: "/brands/python.svg" },
  Go: { label: "Go", bg: "#0b8fb0", logo: "/brands/go.svg" },
  Rust: { label: "Rs", bg: "#a8481f", logo: "/brands/rust.svg" },
  HTML: { label: "</>", bg: "#e34c26", logo: "/brands/html5.svg" },
  "Next.js": { label: "N", bg: "#111111", logo: "/brands/nextjs.svg" },
  Nuxt: { label: "Nu", bg: "#00dc82", logo: "/brands/nuxt.svg" },
  React: { label: "Re", bg: "#149eca", logo: "/brands/react.svg" },
  Vue: { label: "Vu", bg: "#41b883", logo: "/brands/vue.svg" },
  Svelte: { label: "Sv", bg: "#ff3e00", logo: "/brands/svelte.svg" },
  Astro: { label: "As", bg: "#bc52ee", logo: "/brands/astro.svg" },
  Angular: { label: "Ng", bg: "#dd0031", logo: "/brands/angular.svg" },
  Vite: { label: "Vi", bg: "#646cff", logo: "/brands/vite.svg" },
  NestJS: { label: "Ne", bg: "#e0234e", logo: "/brands/nestjs.svg" },
  Express: { label: "Ex", bg: "#3c3c3c", logo: "/brands/express.svg" },
  FastAPI: { label: "Fa", bg: "#05998b", logo: "/brands/fastapi.svg" },
  Django: { label: "Dj", bg: "#0c4b33", logo: "/brands/django.svg" },
  Flask: { label: "Fl", bg: "#2c3e50", logo: "/brands/flask.svg" },
} satisfies Record<string, Chip>;

export type Brand = keyof typeof chips;

export function BrandChip({ name, size = 28, className }: { name: Brand; size?: number; className?: string }) {
  const c: Chip = chips[name];
  if (c.logo) {
    const inner = Math.round(size * 0.68);
    return (
      <span
        title={name}
        className={cn("inline-flex shrink-0 items-center justify-center rounded-md border border-black/10 bg-white", className)}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <Image src={c.logo} alt="" width={inner} height={inner} unoptimized draggable={false} />
      </span>
    );
  }
  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border border-black/10 font-mono font-semibold text-white",
        className,
      )}
      style={{ width: size, height: size, background: c.bg, fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {c.label}
    </span>
  );
}
