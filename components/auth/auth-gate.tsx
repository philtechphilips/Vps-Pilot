"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { refreshSession } from "@/lib/api/client";
import { displayName, useAuthStore } from "@/lib/stores/auth-store";

/**
 * Shows its children only to a signed-in owner. On first load the access
 * token is restored from the httpOnly refresh cookie; without one, the
 * visitor is sent to /login and brought back here afterwards.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const onboarded = useAuthStore((s) => s.user?.onboarding_completed);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unknown") refreshSession();
    else if (status === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    // Signed in but setup unfinished (no second factor chosen yet, etc.).
    else if (status === "authenticated" && onboarded === false) router.replace("/setup");
  }, [status, onboarded, router, pathname]);

  if (status !== "authenticated" || !onboarded) return <GateLoading />;
  return children;
}

export function GateLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <span className="size-6 animate-spin rounded-full border-2 border-white/10 border-t-accent-fg" />
      <span className="text-sm text-muted">Checking your session…</span>
    </div>
  );
}

/** "Pelumi’s Servers" in the breadcrumb, from the signed-in user. */
export function OwnerName() {
  const user = useAuthStore((s) => s.user);
  return <>{user ? `${displayName(user)}’s Servers` : "Your Servers"}</>;
}
