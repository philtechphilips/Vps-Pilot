import { BrandChip, type Brand } from "@/components/brand-chip";
import { Icon } from "@/components/icons";

// Keep in sync with agent/vpspilot_agent/buildpacks.py.
const STACKS: { brand: Brand; name: string; detail: string }[] = [
  { brand: "Node.js", name: "Node.js", detail: "Next.js, Nuxt, Remix, SvelteKit, Astro, NestJS, Express, Fastify, Hono, Koa · npm, pnpm, Yarn" },
  { brand: "Vite", name: "Static front ends", detail: "Vite (React, Vue, Svelte), Create React App, Angular, static Astro: built, then served" },
  { brand: "Bun", name: "Bun", detail: "Any Bun app, e.g. Hono or Elysia" },
  { brand: "Python", name: "Python", detail: "Django, FastAPI, Flask, or a Procfile · pip, Poetry, uv, Pipenv" },
  { brand: "Go", name: "Go", detail: "A main package at the root or in cmd/<name>" },
  { brand: "Rust", name: "Rust", detail: "A single-package Cargo project" },
  { brand: "HTML", name: "Static site", detail: "An index.html at the root" },
];

/** What VPSPilot can build when a repository has no Dockerfile. */
export function SupportedStacks() {
  return (
    <details className="group rounded-lg border border-line bg-bg">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
        <span className="flex -space-x-1">
          {(["Node.js", "Python", "Go", "Bun", "Rust", "HTML"] as const).map((b) => (
            <BrandChip key={b} name={b} size={24} className="rounded-full ring-2 ring-bg" />
          ))}
        </span>
        <span className="min-w-0 flex-1 text-[13px]">
          <span className="block text-fg">No Dockerfile needed</span>
          <span className="block text-xs text-subtle">Node.js, Bun, Python, Go, Rust and static sites are detected and built automatically.</span>
        </span>
        <Icon name="chevron-down" size={14} className="shrink-0 text-subtle transition-transform group-open:rotate-180" />
      </summary>
      <ul className="space-y-3 border-t border-line p-4">
        {STACKS.map((s) => (
          <li key={s.name} className="flex gap-3">
            <BrandChip name={s.brand} size={24} />
            <span className="min-w-0 text-[13px]">
              <span className="block text-fg">{s.name}</span>
              <span className="block text-xs leading-relaxed text-subtle">{s.detail}</span>
            </span>
          </li>
        ))}
        <li className="flex gap-3 border-t border-line pt-3">
          <BrandChip name="Docker" size={24} />
          <span className="min-w-0 text-[13px]">
            <span className="block text-fg">Anything else</span>
            <span className="block text-xs leading-relaxed text-subtle">
              Ruby, PHP, Java, .NET, Elixir, Deno…: add a Dockerfile to the repository, or deploy a container image. Override detection anytime with a build or
              start command.
            </span>
          </span>
        </li>
      </ul>
    </details>
  );
}
