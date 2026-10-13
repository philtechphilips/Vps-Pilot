"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CodeStep } from "@/components/auth/code-step";
import { Icon } from "@/components/icons";
import { Button, Input, Label } from "@/components/ui";
import { useLogin, useSetupStatus } from "@/lib/api/auth";
import { refreshSession } from "@/lib/api/client";
import { useChallengeStore } from "@/lib/stores/challenge-store";

/** Only allow same-site paths, so ?next= can't send users to another origin. */
export function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const challenge = useChallengeStore((s) => s.challenge);
  const resetChallenge = useChallengeStore((s) => s.reset);
  const setup = useSetupStatus();
  const login = useLogin();
  const [show, setShow] = useState(false);

  useEffect(() => {
    useChallengeStore.persist.rehydrate();
    // Already signed in on this device? Skip the form.
    refreshSession().then((auth) => auth && router.replace(next));
  }, [router, next]);

  if (challenge?.purpose === "login" || challenge?.purpose === "setup") {
    return (
      <CodeStep
        onVerified={() => router.replace(next)}
        onBack={() => {
          resetChallenge();
          login.reset();
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-[380px] animate-fade-up">
      <h1 className="text-center text-[28px] font-semibold tracking-tight">Log in to VPSPilot</h1>
      <p className="mt-2 text-center text-sm text-muted">Owner access to your control plane.</p>

      {setup.data?.needs_setup && (
        <Link
          href="/setup"
          className="mt-6 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm text-accent-fg transition-colors hover:bg-accent/15"
        >
          <Icon name="sparkles" className="shrink-0" />
          <span className="flex-1">No owner account yet. Set up this control plane first.</span>
          <Icon name="arrow-right" size={14} />
        </Link>
      )}

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          login.mutate(
            { email: String(form.get("email")), password: String(form.get("password")) },
            { onSuccess: (result) => result.status === "authenticated" && router.replace(next) },
          );
        }}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="username" placeholder="you@example.com" required />
        </div>
        <div>
          <Label
            htmlFor="password"
            hint={
              <Link href="/forgot-password" className="hover:text-fg">
                Forgot?
              </Link>
            }
          >
            Password
          </Label>
          <div className="relative">
            <Input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required className="pr-10" />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded text-subtle hover:text-fg"
            >
              <Icon name={show ? "eye-off" : "eye"} size={15} />
            </button>
          </div>
        </div>

        <div aria-live="polite">
          {login.error && (
            <p className="flex items-start gap-2 rounded-lg border border-err/30 bg-err/10 p-3 text-sm text-err">
              <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
              {login.error.message}
            </p>
          )}
        </div>

        <Button type="submit" variant="primary" size="md" className="w-full rounded-xl" disabled={login.isPending}>
          {login.isPending ? "Checking…" : "Continue"}
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#141414] p-3 text-xs text-muted">
        <Icon name="shield-check" size={14} className="shrink-0 text-accent-fg" />
        After your password we email a one-time code. Repeated failures lock the account for 15 minutes.
      </div>
    </div>
  );
}
