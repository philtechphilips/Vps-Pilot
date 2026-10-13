import { cn } from "@/lib/utils";

/**
 * Text logotype used everywhere in the UI ("VPSPILOT", in the spirit of the
 * Next.js wordmark). The geometric mark below is reserved for the site icon.
 */
export function Logotype({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="VPSPilot"
      className={cn("inline-flex items-center leading-none whitespace-nowrap uppercase select-none", className ?? "text-[17px]")}
    >
      <span aria-hidden="true" className="font-semibold tracking-[-0.055em]">
        VPS
      </span>
      <span aria-hidden="true" className="ml-[0.08em] font-light tracking-[0.02em]">
        PILOT
      </span>
    </span>
  );
}

/** Geometric mark: a chevron "flight path" over a horizon line. Site icon only (see app/icon.svg). */
export function LogoMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 3 29 26H21.5L16 16 10.5 26H3L16 3Z" fill="currentColor" />
      <rect x="3" y="28" width="26" height="1.75" rx="0.875" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
