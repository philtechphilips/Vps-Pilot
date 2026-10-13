import Link from "next/link";
import { Logotype } from "@/components/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="theme-console relative flex min-h-dvh flex-col bg-black">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_60%)]" aria-hidden="true" />
      <header className="relative flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex" aria-label="VPSPilot home">
          <Logotype className="text-[19px]" />
        </Link>
        <Link href="/" className="text-sm text-muted transition-colors hover:text-fg">
          Back to site
        </Link>
      </header>
      <main className="relative flex flex-1 items-start justify-center px-4 pt-[8vh] pb-16 sm:items-center sm:pt-0">{children}</main>
    </div>
  );
}
