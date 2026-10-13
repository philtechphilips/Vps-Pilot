import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { CodeTexture } from "@/components/code-texture";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type Variant = "primary" | "secondary" | "tertiary" | "blue" | "danger" | "ghost";
type Size = "xs" | "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "btn-primary bg-fg text-black hover:bg-[#cccccc] border border-transparent",
  secondary: "bg-bg-100 text-fg border border-line-strong hover:bg-bg-300",
  tertiary: "bg-transparent text-fg border border-transparent hover:bg-bg-300",
  blue: "bg-blue text-white hover:bg-blue-hover border border-transparent",
  danger: "bg-[#e5484d] text-white hover:bg-[#d13b40] border border-transparent",
  ghost: "bg-transparent text-muted hover:text-fg border border-transparent",
};

const sizes: Record<Size, string> = {
  xs: "h-7 px-2 text-xs gap-1 rounded-md",
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-md",
  lg: "h-12 px-6 text-base gap-2 rounded-full",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "sm", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonExtras = { variant?: Variant; size?: Size; icon?: IconName; iconRight?: IconName };

export function Button({ variant, size, icon, iconRight, className, children, ...props }: ButtonExtras & ComponentProps<"button">) {
  return (
    <button type="button" className={buttonClass(variant, size, className)} {...props}>
      {icon && <Icon name={icon} size={size === "xs" ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "xs" ? 14 : 16} />}
    </button>
  );
}

export function ButtonLink({ variant, size, icon, iconRight, className, children, ...props }: ButtonExtras & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {icon && <Icon name={icon} size={size === "xs" ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "xs" ? 14 : 16} />}
    </Link>
  );
}

export function IconButton({ icon, label, className, ...props }: { icon: IconName; label: string } & ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-bg-300 hover:text-fg",
        className,
      )}
      {...props}
    >
      <Icon name={icon} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

export type Tone = "ok" | "warn" | "err" | "neutral" | "blue" | "violet";

const toneDot: Record<Tone, string> = {
  ok: "bg-ok text-ok/40",
  warn: "bg-warn text-warn/40",
  err: "bg-err text-err/40",
  neutral: "bg-subtle text-subtle/40",
  blue: "bg-blue-fg text-blue-fg/40",
  violet: "bg-violet text-violet/40",
};

export function Dot({ tone = "ok", pulse, className }: { tone?: Tone; pulse?: boolean; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", toneDot[tone], pulse && "animate-pulse-dot", className)}
      aria-hidden="true"
    />
  );
}

export function Status({ tone, children, pulse }: { tone: Tone; children: ReactNode; pulse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-fg">
      <Dot tone={tone} pulse={pulse} />
      {children}
    </span>
  );
}

const badgeTone: Record<Tone, string> = {
  ok: "bg-ok/10 text-ok border-ok/20",
  warn: "bg-warn/10 text-warn border-warn/20",
  err: "bg-err/10 text-err border-err/20",
  neutral: "bg-white/[0.06] text-muted border-line",
  blue: "bg-blue/15 text-blue-fg border-blue/30",
  violet: "bg-violet/15 text-[#bf7af0] border-violet/30",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[11px] font-medium whitespace-nowrap",
        badgeTone[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Card({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("rounded-xl border border-line bg-bg-100", className)} {...props}>
      {children}
    </div>
  );
}

/** Vercel settings-style card: body + muted footer with an action. */
export function FormCard({
  title,
  description,
  children,
  footer,
  action,
  danger,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  action?: ReactNode;
  danger?: boolean;
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border bg-bg-100", danger ? "border-err/40" : "border-line")}>
      <div className="p-6">
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        {description && <p className="mt-3 text-sm text-muted">{description}</p>}
        {children && <div className="mt-5">{children}</div>}
      </div>
      {(footer || action) && (
        <div
          className={cn(
            "flex min-h-14 flex-wrap items-center justify-between gap-3 border-t px-6 py-3 text-sm text-muted",
            danger ? "border-err/40 bg-err/[0.06]" : "border-line bg-bg-200",
          )}
        >
          <div>{footer}</div>
          {action}
        </div>
      )}
    </section>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 className="text-sm font-medium text-fg">{children}</h2>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="px-4 pt-6 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] leading-tight font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("w-full px-4 py-5 sm:px-6", className)}>{children}</div>;
}

/** Framed search field: dark inset input inside a lighter rail, with filter and shortcut hints. */
export function SearchBar({ className, ...props }: ComponentProps<"input">) {
  return (
    <div className={cn("rounded-xl border border-white/[0.06] bg-[#2a2a2a] p-1.5", className)}>
      <div className="relative flex items-center">
        <Icon name="search" className="pointer-events-none absolute left-3 text-subtle" />
        <input
          type="search"
          className="h-10 w-full rounded-lg border border-white/[0.06] bg-inset pr-24 pl-10 text-sm text-fg outline-none placeholder:text-subtle focus:border-white/20"
          {...props}
        />
        <span className="pointer-events-none absolute right-3 flex items-center gap-2 text-subtle">
          <Icon name="filter" size={14} />
          <Kbd className="bg-transparent">⌘</Kbd>
          <Kbd className="-ml-1 bg-transparent">F</Kbd>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */

export function Input({ className, icon, ...props }: ComponentProps<"input"> & { icon?: IconName }) {
  if (icon) {
    return (
      <div className={cn("relative", className)}>
        <Icon name={icon} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle" />
        <input
          className="h-10 w-full rounded-md border border-line-strong bg-bg pr-3 pl-9 text-sm text-fg placeholder:text-subtle transition-shadow outline-none focus:border-[#555] focus:shadow-[0_0_0_3px_rgb(255_255_255/0.08)]"
          {...props}
        />
      </div>
    );
  }
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-line-strong bg-bg px-3 text-sm text-fg placeholder:text-subtle transition-shadow outline-none focus:border-[#555] focus:shadow-[0_0_0_3px_rgb(255_255_255/0.08)]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        className="h-10 w-full appearance-none rounded-md border border-line-strong bg-bg pr-9 pl-3 text-sm text-fg outline-none focus:border-[#555]"
        {...props}
      >
        {children}
      </select>
      <Icon name="chevron-down" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-subtle" />
    </div>
  );
}

export function Label({ children, hint, htmlFor }: { children: ReactNode; hint?: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-center justify-between text-[13px] text-muted">
      <span>{children}</span>
      {hint && <span className="text-xs text-subtle">{hint}</span>}
    </label>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-bg-200 px-1 font-sans text-[11px] text-muted",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

/* ------------------------------------------------------------------ */
/* Data display                                                        */
/* ------------------------------------------------------------------ */

export function Meter({ value, tone, className }: { value: number; tone?: Tone; className?: string }) {
  const t: Tone = tone ?? (value >= 85 ? "err" : value >= 70 ? "warn" : "blue");
  const color = { ok: "bg-ok", warn: "bg-warn", err: "bg-err", neutral: "bg-subtle", blue: "bg-blue-fg", violet: "bg-violet" }[t];
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]", className)} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function Stat({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: ReactNode; icon?: IconName }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[13px] text-muted">
        {icon && <Icon name={icon} size={14} />}
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {sub && <div className="text-xs text-subtle">{sub}</div>}
    </div>
  );
}

export function Avatar({ name, size = 24, className }: { name: string; size?: number; className?: string }) {
  // Vercel-style generated gradient avatar.
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className={cn("inline-block shrink-0 rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${h} 85% 60%), hsl(${(h + 70) % 360} 90% 45%))`,
      }}
      aria-hidden="true"
    />
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon: IconName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#060606] px-6 py-16 text-center", className)}>
      <CodeTexture />
      <Icon name={icon} size={150} strokeWidth={0.6} className="pointer-events-none absolute -right-6 -bottom-8 text-white/[0.06]" />
      <div className="relative flex flex-col items-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-[#111] text-muted shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
          <Icon name={icon} size={26} strokeWidth={1.25} />
        </div>
        <h3 className="font-semibold">{title}</h3>
        {children && <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">{children}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("thin-scrollbar overflow-x-auto rounded-xl border border-line bg-bg-100", className)}>
      <table className="w-full min-w-[720px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cn("h-10 border-b border-line bg-bg-200 px-4 text-left text-xs font-medium whitespace-nowrap text-muted", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className, colSpan }: { children?: ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn("h-14 border-b border-line px-4 align-middle", className)}>
      {children}
    </td>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[12.5px]", className)}>{children}</span>;
}

export function Callout({ tone = "neutral", icon = "info", title, children }: { tone?: Tone; icon?: IconName; title?: string; children: ReactNode }) {
  const styles: Record<Tone, string> = {
    ok: "border-ok/30 bg-ok/[0.06] text-ok",
    warn: "border-warn/30 bg-warn/[0.06] text-warn",
    err: "border-err/30 bg-err/[0.06] text-err",
    neutral: "border-line bg-bg-200 text-muted",
    blue: "border-blue/30 bg-blue/[0.08] text-blue-fg",
    violet: "border-violet/30 bg-violet/[0.08] text-[#bf7af0]",
  };
  return (
    <div className={cn("flex gap-3 rounded-lg border p-4 text-sm", styles[tone])}>
      <Icon name={icon} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-medium text-fg">{title}</p>}
        <div className={cn(title && "mt-1", "text-muted")}>{children}</div>
      </div>
    </div>
  );
}
