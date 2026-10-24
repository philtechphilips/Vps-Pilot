import Link from "next/link";
import type { ReactNode } from "react";
import { isValidElement } from "react";
import { CopyButton } from "@/components/copy-button";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

// Building blocks for docs pages. Headings get stable ids so the
// "On this page" list (components/docs/toc.tsx) can find and link them.

function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return text(node.props.children);
  return "";
}

export const slugify = (node: ReactNode) =>
  text(node)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function Anchor({ id }: { id: string }) {
  return (
    <a
      href={`#${id}`}
      aria-label="Link to this section"
      className="ml-2 inline-block align-middle text-subtle opacity-0 transition-opacity group-hover:opacity-100 hover:text-fg"
    >
      <Icon name="hash" size={16} />
    </a>
  );
}

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  const anchor = id ?? slugify(children);
  return (
    <h2 id={anchor} data-toc="2" className="group mt-14 mb-4 scroll-mt-24 text-2xl font-semibold tracking-[-0.03em] text-fg first:mt-0 sm:text-[28px]">
      {children}
      <Anchor id={anchor} />
    </h2>
  );
}

export function H3({ children, id }: { children: ReactNode; id?: string }) {
  const anchor = id ?? slugify(children);
  return (
    <h3 id={anchor} data-toc="3" className="group mt-9 mb-3 scroll-mt-24 text-lg font-semibold tracking-[-0.02em] text-fg">
      {children}
      <Anchor id={anchor} />
    </h3>
  );
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("my-4 text-[15px] leading-7 text-muted [&_strong]:font-medium [&_strong]:text-fg", className)}>{children}</p>;
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[17px] leading-8 text-muted">{children}</p>;
}

export function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[5px] border border-black/[0.08] bg-black/[0.05] px-[0.35em] py-[0.1em] font-mono text-[0.84em] text-fg">
      {children}
    </code>
  );
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  const cls = "font-medium text-fg underline decoration-black/25 underline-offset-[3px] transition-colors hover:decoration-fg";
  return href.startsWith("/") ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <a href={href} className={cls} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export function Ul({ children }: { children: ReactNode }) {
  return (
    <ul className="my-4 space-y-2 text-[15px] leading-7 text-muted [&_strong]:font-medium [&_strong]:text-fg [&>li]:relative [&>li]:pl-5 [&>li]:before:absolute [&>li]:before:top-[0.7em] [&>li]:before:left-1 [&>li]:before:size-1.5 [&>li]:before:rounded-full [&>li]:before:bg-black/25">
      {children}
    </ul>
  );
}

export function Ol({ children }: { children: ReactNode }) {
  return (
    <ol className="my-4 list-decimal space-y-2 pl-6 text-[15px] leading-7 text-muted marker:font-mono marker:text-[13px] marker:text-subtle [&_strong]:font-medium [&_strong]:text-fg [&>li]:pl-1">
      {children}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Code
// ---------------------------------------------------------------------------

type Lang = "bash" | "json" | "text" | "ini" | "http";

const tone = {
  cmd: "text-[#0550ae]",
  flag: "text-[#8250df]",
  str: "text-[#953800]",
  com: "text-[#6e7781] italic",
  var: "text-[#cf222e]",
  num: "text-[#0550ae]",
  key: "text-[#0a3069]",
  plain: "",
};

type Tok = [keyof typeof tone, string];

function bash(line: string): Tok[] {
  if (/^\s*#/.test(line)) return [["com", line]];
  const out: Tok[] = [];
  const re = /(\s+)|("(?:[^"\\]|\\.)*"?|'[^']*'?)|(\$\{?[A-Za-z_][A-Za-z0-9_]*\}?)|(\|\||&&|[|;])|(#.*$)|([^\s"'|;&]+)/g;
  let expectCmd = true;
  for (const m of line.matchAll(re)) {
    const [all, ws, str, v, op, com, word] = m;
    if (ws) out.push(["plain", all]);
    else if (str) out.push(["str", str]);
    else if (v) out.push(["var", v]);
    else if (op) {
      out.push(["plain", op]);
      expectCmd = true;
      continue;
    } else if (com) out.push(["com", com]);
    else if (word) {
      if (expectCmd && /^[A-Za-z_][A-Za-z0-9_]*=/.test(word)) out.push(["var", word]); // FOO=bar cmd
      else if (expectCmd) {
        out.push(["cmd", word]);
        expectCmd = word === "sudo" || word === "env";
      } else if (word.startsWith("-")) out.push(["flag", word]);
      else if (/^https?:\/\//.test(word)) out.push(["str", word]);
      else out.push(["plain", word]);
    }
  }
  return out;
}

function json(line: string): Tok[] {
  const out: Tok[] = [];
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?)|(true|false|null)|([^"\d\-tfn]+|.)/g;
  for (const m of line.matchAll(re)) {
    const [, s, colon, n, lit, rest] = m;
    if (s) {
      out.push([colon ? "key" : "str", s]);
      if (colon) out.push(["plain", colon]);
    } else if (n) out.push(["num", n]);
    else if (lit) out.push(["cmd", lit]);
    else out.push(["plain", rest]);
  }
  return out;
}

function ini(line: string): Tok[] {
  if (/^\s*#/.test(line)) return [["com", line]];
  const m = line.match(/^([A-Z0-9_]+)(=)(.*)$/);
  return m ? [["key", m[1]], ["plain", m[2]], ["str", m[3]]] : [["plain", line]];
}

function http(line: string): Tok[] {
  const m = line.match(/^(GET|POST|PUT|PATCH|DELETE)(\s+)(\S+)(.*)$/);
  if (m) return [["cmd", m[1]], ["plain", m[2]], ["str", m[3]], ["com", m[4]]];
  if (/^\s*(#|\/\/)/.test(line)) return [["com", line]];
  return json(line);
}

const highlighters: Record<Lang, (l: string) => Tok[]> = { bash, json, ini, http, text: (l) => [["plain", l]] };

export function CodeBlock({ code, lang = "bash", title }: { code: string; lang?: Lang; title?: string }) {
  const value = code.replace(/^\n+|\s+$/g, "");
  const lines = value.split("\n");
  return (
    <div className="group/code my-5 overflow-hidden rounded-xl border border-black/[0.08] bg-inset">
      <div className="flex h-10 items-center gap-3 border-b border-black/[0.06] bg-black/[0.02] pr-1.5 pl-4">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-black/15" />
          <span className="size-2.5 rounded-full bg-black/15" />
          <span className="size-2.5 rounded-full bg-black/15" />
        </span>
        {title && <span className="truncate font-mono text-xs text-subtle">{title}</span>}
        <span className="ml-auto font-mono text-[11px] tracking-wide text-subtle uppercase">{lang === "text" ? "" : lang}</span>
        <CopyButton value={value} />
      </div>
      <pre className="thin-scrollbar overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-6 text-[#24292f]">
        <code>
          {lines.map((line, i) => (
            <span key={i} className="block min-h-6">
              {highlighters[lang](line).map(([t, s], j) => (
                <span key={j} className={tone[t]}>
                  {s}
                </span>
              ))}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Callouts, steps, tables
// ---------------------------------------------------------------------------

const callouts = {
  note: { icon: "info", cls: "border-black/[0.1] bg-black/[0.03]", ic: "text-muted", label: "Note" },
  tip: { icon: "sparkles", cls: "border-ok/25 bg-ok/[0.05]", ic: "text-ok", label: "Tip" },
  warning: { icon: "alert", cls: "border-warn/30 bg-warn/[0.06]", ic: "text-warn", label: "Warning" },
  security: { icon: "shield-check", cls: "border-accent/30 bg-accent/[0.07]", ic: "text-accent-fg", label: "Security" },
} as const satisfies Record<string, { icon: IconName; cls: string; ic: string; label: string }>;

export function Callout({ type = "note", title, children }: { type?: keyof typeof callouts; title?: string; children: ReactNode }) {
  const c = callouts[type];
  return (
    <div className={cn("my-6 flex gap-3 rounded-xl border px-4 py-3.5", c.cls)}>
      <Icon name={c.icon} size={18} className={cn("mt-0.5 shrink-0", c.ic)} />
      <div className="min-w-0 text-[14px] leading-6 text-muted [&_p]:my-1.5 [&_strong]:font-medium [&_strong]:text-fg">
        <div className="font-medium text-fg">{title ?? c.label}</div>
        {children}
      </div>
    </div>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return <div className="my-6 [counter-reset:step]">{children}</div>;
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  const id = slugify(title);
  return (
    <div className="relative pb-6 pl-10 [counter-increment:step] before:absolute before:top-0 before:left-0 before:flex before:size-7 before:items-center before:justify-center before:rounded-full before:border before:border-black/15 before:bg-bg-100 before:font-mono before:text-xs before:text-fg before:content-[counter(step)] after:absolute after:top-9 after:bottom-1 after:left-3.5 after:w-px after:bg-black/10 last:pb-0 last:after:hidden">
      <h3 id={id} data-toc="3" className="scroll-mt-24 pt-0.5 text-base font-semibold tracking-[-0.01em] text-fg">
        {title}
      </h3>
      <div className="[&>*:first-child]:mt-2 [&>*:last-child]:mb-0">{children}</div>
    </div>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="thin-scrollbar my-6 overflow-x-auto rounded-xl border border-black/[0.08]">
      <table className="w-full text-left text-[13.5px]">
        <thead className="bg-black/[0.03] text-xs text-subtle">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.06]">
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((cell, j) => (
                <td key={j} className={cn("px-4 py-3 leading-6", j === 0 ? "text-fg" : "text-muted")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// API reference
// ---------------------------------------------------------------------------

const methods = {
  GET: "text-ok border-ok/30 bg-ok/[0.08]",
  POST: "text-[#0550ae] border-blue/30 bg-blue/[0.08]",
  PUT: "text-warn border-warn/30 bg-warn/[0.08]",
  PATCH: "text-warn border-warn/30 bg-warn/[0.08]",
  DELETE: "text-err border-err/30 bg-err/[0.08]",
};

export type Route = [method: keyof typeof methods, path: string, description: ReactNode];

export function Endpoints({ routes }: { routes: Route[] }) {
  return (
    <div className="my-5 divide-y divide-black/[0.06] overflow-hidden rounded-xl border border-black/[0.08]">
      {routes.map(([method, path, description]) => (
        <div key={method + path} className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
          <div className="flex min-w-0 items-baseline gap-3 sm:w-[46%] sm:shrink-0">
            <span className={cn("w-14 shrink-0 rounded-md border py-0.5 text-center font-mono text-[10.5px] font-semibold", methods[method])}>
              {method}
            </span>
            <code className="font-mono text-[12.5px] break-all text-fg">{path}</code>
          </div>
          <div className="text-[13.5px] leading-6 text-muted">{description}</div>
        </div>
      ))}
    </div>
  );
}

export function Fields({ rows }: { rows: [name: string, type: string, description: ReactNode][] }) {
  return (
    <div className="my-5 divide-y divide-black/[0.06] rounded-xl border border-black/[0.08]">
      {rows.map(([name, type, description]) => (
        <div key={name} className="px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <code className="font-mono text-[13px] font-medium text-fg">{name}</code>
            <span className="font-mono text-xs text-subtle">{type}</span>
          </div>
          <div className="mt-1 text-[13.5px] leading-6 text-muted [&_code]:text-[12px]">{description}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Landing cards
// ---------------------------------------------------------------------------

export function Cards({ children }: { children: ReactNode }) {
  return <div className="my-6 grid gap-3 sm:grid-cols-2">{children}</div>;
}

export function CardLink({ href, icon, title, children }: { href: string; icon: IconName; title: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex gap-3.5 rounded-xl border border-black/[0.08] bg-black/[0.02] p-4 transition-colors hover:border-black/20 hover:bg-black/[0.04]"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-black/[0.03] text-muted transition-colors group-hover:text-fg">
        <Icon name={icon} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-sm font-medium text-fg">
          {title}
          <Icon name="arrow-right" size={13} className="text-subtle transition-transform group-hover:translate-x-0.5" />
        </span>
        <span className="mt-1 block text-[13px] leading-5 text-muted">{children}</span>
      </span>
    </Link>
  );
}
