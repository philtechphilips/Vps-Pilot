"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CodeStep } from "@/components/auth/code-step";
import { Icon } from "@/components/icons";
import { Button, Input, Label } from "@/components/ui";
import { useSetup, useSetupStatus } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useChallengeStore } from "@/lib/stores/challenge-store";
import { cn } from "@/lib/utils";

const steps = ["Owner account", "Verify email", "This server"];

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export function SetupForm() {
  const router = useRouter();
  const status = useSetupStatus();
  const setup = useSetup();
  const challenge = useChallengeStore((s) => s.challenge);
  const resetChallenge = useChallengeStore((s) => s.reset);
  const signedIn = useAuthStore((s) => s.status === "authenticated");
  const [verified, setVerified] = useState(false);
  const [pw, setPw] = useState("");
  const [selfManage, setSelfManage] = useState(true);
  const score = strength(pw);

  useEffect(() => {
    useChallengeStore.persist.rehydrate();
  }, []);

  const step = verified ? 2 : challenge?.purpose === "setup" ? 1 : 0;

  // Setup already done (and this browser isn't mid-flow): send them to log in.
  if (status.data && !status.data.needs_setup && step === 0 && !signedIn) {
    return (
      <div className="w-full max-w-[420px] animate-fade-up rounded-2xl border border-white/[0.06] bg-[#1c1c1c] p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-[#141414] text-accent-fg">
          <Icon name="shield-check" size={20} />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">This control plane is already set up</h1>
        <p className="mt-2 text-sm text-muted">The owner account exists. Log in to continue.</p>
        <Link href="/login" className="btn-primary mt-6 inline-flex h-10 items-center rounded-xl px-5 text-sm font-medium">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[460px] animate-fade-up">
      <ol className="mb-8 flex items-center gap-2 text-xs">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium",
                i < step ? "border-ok/40 bg-ok/15 text-ok" : i === step ? "btn-primary border-transparent" : "border-line-strong text-subtle",
              )}
            >
              {i < step ? <Icon name="check" size={11} strokeWidth={2.5} /> : i + 1}
            </span>
            <span className={cn("whitespace-nowrap", i === step ? "text-fg" : "text-subtle")}>{s}</span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-line-strong" />}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <div className="flex justify-center rounded-2xl border border-white/[0.06] bg-[#1c1c1c] px-6 py-10">
          <CodeStep
            onVerified={() => setVerified(true)}
            onBack={() => {
              resetChallenge();
              setup.reset();
            }}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-[#1c1c1c] p-6 sm:p-8">
          {step === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                setup.mutate({
                  name: String(form.get("name")),
                  email: String(form.get("email")),
                  password: String(form.get("password")),
                });
              }}
              className="space-y-4"
            >
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Create the owner account</h1>
                <p className="mt-1 text-sm text-muted">This account controls the control plane and every enrolled server. We’ll email a code to verify the address.</p>
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" autoComplete="name" placeholder="Ada Lovelace" required maxLength={120} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
              </div>
              <div>
                <Label htmlFor="password" hint="At least 12 characters">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                  minLength={12}
                  maxLength={128}
                />
                <div className="mt-2 flex gap-1" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={cn("h-1 flex-1 rounded-full", i < score ? (score < 2 ? "bg-err" : score < 4 ? "bg-warn" : "bg-ok") : "bg-white/10")} />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-subtle" aria-live="polite">
                  {pw ? ["Too weak", "Weak", "Fair", "Good", "Strong"][score] : "Use a passphrase or a password manager."}
                </p>
              </div>

              {setup.error && (
                <p className="flex items-start gap-2 rounded-lg border border-err/30 bg-err/10 p-3 text-sm text-err" role="alert">
                  <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
                  {setup.error.message}
                </p>
              )}

              <Button type="submit" variant="primary" size="md" className="w-full rounded-xl" disabled={setup.isPending || status.isLoading}>
                {setup.isPending ? "Creating account…" : "Continue"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Manage this server?</h1>
                <p className="mt-1 text-sm text-muted">Install the agent on the control-plane host so it appears alongside your other servers.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={selfManage}
                onClick={() => setSelfManage((v) => !v)}
                className="flex w-full items-start gap-4 rounded-xl border border-white/[0.06] bg-[#141414] p-4 text-left transition-colors hover:border-white/15"
              >
                <span className={cn("mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors", selfManage ? "bg-accent" : "bg-white/15")}>
                  <span className={cn("size-4 rounded-full bg-white transition-transform", selfManage && "translate-x-4")} />
                </span>
                <span>
                  <span className="block text-sm font-medium">Enable self-management</span>
                  <span className="mt-0.5 block text-[13px] text-muted">Runs the agent on the host serving this dashboard.</span>
                </span>
              </button>
              <ul className="space-y-2 text-[13px] text-muted">
                {["Agent runs unprivileged under systemd", "Privileged helper limited to fixed operations", "Can be revoked at any time"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Icon name="check" size={14} className="text-ok" /> {t}
                  </li>
                ))}
              </ul>
              <Button variant="primary" size="md" className="w-full rounded-xl" onClick={() => router.push("/dashboard")}>
                Go to dashboard
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
