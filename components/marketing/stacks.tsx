import type { CSSProperties } from "react";
import { BrandChip, type Brand } from "@/components/brand-chip";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
const card = "rounded-2xl border border-white/[0.06] bg-[#232323]";

// Keep in sync with agent/vpspilot_agent/buildpacks.py.
const STACKS: { brand: Brand; name: string; desc: string; with?: Brand[]; more?: string }[] = [
  {
    brand: "Node.js",
    name: "Node.js",
    desc: "Servers and full-stack frameworks, with the Node version from your package.json.",
    with: ["Next.js", "Nuxt", "Astro", "Svelte", "NestJS", "Express"],
    more: "Remix, Fastify, Hono, Koa · npm, pnpm, Yarn",
  },
  {
    brand: "Vite",
    name: "Static front ends",
    desc: "Single-page apps are built, then served as static files.",
    with: ["React", "Vue", "Svelte", "Angular"],
    more: "Vite, Create React App, Angular CLI",
  },
  {
    brand: "Python",
    name: "Python",
    desc: "Web apps served with gunicorn or uvicorn, or whatever your Procfile says.",
    with: ["Django", "FastAPI", "Flask"],
    more: "pip, Poetry, uv, Pipenv",
  },
  { brand: "Bun", name: "Bun", desc: "Any Bun app, installed and started with Bun itself.", more: "Hono, Elysia and friends" },
  { brand: "Go", name: "Go", desc: "Compiled in a build stage, shipped as a small image with your templates and assets." },
  { brand: "Rust", name: "Rust", desc: "Cargo release builds, shipped as a small image." },
  { brand: "HTML", name: "Static sites", desc: "Plain HTML, CSS and JavaScript, served as-is." },
  { brand: "Docker", name: "Anything else", desc: "Ruby, PHP, Java, .NET, Elixir… add a Dockerfile, or deploy a container image." },
];

const STEPS = [
  { icon: "github", text: "Import a repo from GitHub or paste a Git URL" },
  { icon: "search", text: "VPSPilot reads the project and writes a Dockerfile you can see in the build log" },
  { icon: "shield-check", text: "It builds, health-checks a candidate, then swaps it in with instant rollback" },
] as const;

export function Stacks() {
  return (
    <section id="stacks" className="mx-auto max-w-[1180px] scroll-mt-24 px-4 pt-24 sm:px-8 sm:pt-36">
      <div className="max-w-2xl">
        <span data-reveal className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#232323] py-1 pr-3 pl-1 text-xs text-accent-fg">
          <span className="flex size-5 items-center justify-center rounded-full bg-accent/25">
            <Icon name="box" size={11} />
          </span>
          Any stack
        </span>
        <h2 data-reveal style={d(80)} className="mt-4 text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[40px]">
          Push code. No Dockerfile required.
        </h2>
        <p data-reveal style={d(160)} className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
          VPSPilot detects the language and framework, builds an image and releases it behind a health check. Bring a Dockerfile when you want full control.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STACKS.map((s, i) => (
          <div
            key={s.name}
            data-reveal
            data-spot
            style={d((i % 4) * 90)}
            className={cn(card, "group flex flex-col p-5 transition-colors hover:border-white/12", s.brand === "Docker" && "border-dashed")}
          >
            <BrandChip name={s.brand} size={44} className="rounded-xl transition-transform duration-500 group-hover:-translate-y-0.5" />
            <h3 className="mt-5 text-[15px] font-medium">{s.name}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.desc}</p>
            {(s.with || s.more) && (
              <div className="mt-auto pt-5">
                {s.with && (
                  <div className="flex flex-wrap gap-1.5">
                    {s.with.map((b) => (
                      <span key={b} title={b} className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-[#111] py-0.5 pr-2 pl-0.5 text-[11px] text-muted">
                        <BrandChip name={b} size={18} className="rounded" />
                        {b === "Svelte" ? "SvelteKit" : b}
                      </span>
                    ))}
                  </div>
                )}
                {s.more && <p className="mt-2 text-[11px] leading-relaxed text-subtle">{s.more}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      <ol data-reveal className={cn(card, "mt-4 grid gap-px overflow-hidden bg-white/[0.06] p-0 md:grid-cols-3")}>
        {STEPS.map((step, i) => (
          <li key={step.text} className="flex items-start gap-3 bg-[#232323] p-5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-[#111] text-accent-fg">
              <Icon name={step.icon} size={15} />
            </span>
            <span className="text-[13px] leading-relaxed text-muted">
              <span className="mr-1.5 font-mono text-[11px] text-subtle">0{i + 1}</span>
              {step.text}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
