import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function DetailHeader({
  back,
  backLabel,
  title,
  meta,
  actions,
  children,
}: {
  back: string;
  backLabel: string;
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="px-4 pt-5 sm:px-6">
      <Link href={back} className="inline-flex items-center gap-1 text-[13px] text-muted transition-colors hover:text-fg">
        <Icon name="arrow-left" size={14} /> {backLabel}
      </Link>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-3 text-[22px] leading-tight font-semibold tracking-tight">{title}</h1>
          {meta && <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** Label-over-value grid used on detail cards. */
export function InfoGrid({ items, className }: { items: { label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-[13px] text-muted">{i.label}</dt>
          <dd className="mt-1 truncate text-sm text-fg">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ChartCard({ title, value, sub, children, right }: { title: string; value?: ReactNode; sub?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-bg-100 p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[13px] text-muted">{title}</h3>
          {value !== undefined && <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>}
          {sub && <div className="text-xs text-subtle">{sub}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function RangeTabs({ value = "1h" }: { value?: string }) {
  return (
    <div className="inline-flex rounded-md border border-line bg-bg p-0.5 text-xs">
      {["1h", "24h", "7d", "30d"].map((r) => (
        <span key={r} className={cn("rounded-[5px] px-2.5 py-1", r === value ? "bg-bg-300 text-fg" : "text-subtle")}>
          {r}
        </span>
      ))}
    </div>
  );
}
