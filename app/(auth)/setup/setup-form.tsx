"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CodeStep } from "@/components/auth/code-step";
import { RecoveryCodesPanel, TotpSetupPanel } from "@/components/auth/totp-setup";
import { Icon, type IconName } from "@/components/icons";
import { Badge, Button, Input, Label } from "@/components/ui";
import { useCompleteOnboarding, useSetup, useSetupStatus } from "@/lib/api/auth";
import { refreshSession } from "@/lib/api/client";
import { displayName, useAuthStore } from "@/lib/stores/auth-store";
import { useChallengeStore } from "@/lib/stores/challenge-store";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { useRecoveryCodesStore } from "@/lib/stores/recovery-codes-store";
import { cn } from "@/lib/utils";

type Step = "loading" | "account" | "verify" | "already" | "two-factor" | "server" | "done";

const STEPS: { key: Step; label: string }[] = [
  { key: "account", label: "Account" },
  { key: "verify", label: "Verify email" },
  { key: "two-factor", label: "Two-factor" },
  { key: "server", label: "This server" },
  { key: "done", label: "Done" },
];

/**
 * Owner onboarding. The current step is derived from server state (session,
 * email verified, authenticator enabled, onboarding completed) plus the
 * wizard's own choices, so it resumes correctly after a reload or a new
 * login and can't jump backwards.
 */
export function SetupForm() {
  const router = useRouter();
  const authStatus = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const challenge = useChallengeStore((s) => s.challenge);
  const resetChallenge = useChallengeStore((s) => s.reset);
  const { twoFactorChoice, savedRecoveryCodes, selfManage, chooseTwoFactor, confirmSavedCodes, reset: resetOnboarding } = useOnboardingStore();
  const setupStatus = useSetupStatus();
  const complete = useCompleteOnboarding();
  // Set before calling the API: the store marks the user onboarded slightly
  // before the mutation reports success, and we must not mistake that for
  // "finished on an earlier visit".
  const [finishing, setFinishing] = useState(false);
  // Recovery codes live only in memory (not persisted); shown exactly once.
  const recoveryCodes = useRecoveryCodesStore((s) => s.codes);
  const clearRecoveryCodes = useRecoveryCodesStore((s) => s.clear);

  useEffect(() => {
    useChallengeStore.persist.rehydrate();
    useOnboardingStore.persist.rehydrate();
    // Resume a session from the refresh cookie (e.g. coming back later).
    if (useAuthStore.getState().status === "unknown") refreshSession();
  }, []);

  let step: Step;
  if (authStatus === "unknown" || (authStatus === "anonymous" && setupStatus.isLoading)) step = "loading";
  else if (authStatus !== "authenticated" || !user) {
    step = challenge?.purpose === "setup" ? "verify" : setupStatus.data?.needs_setup ? "account" : "already";
  } else if (user.onboarding_completed) step = "done";
  else if (recoveryCodes || (twoFactorChoice !== "email" && !(user.totp_enabled && savedRecoveryCodes))) step = "two-factor";
  else step = "server";

  // Someone who finished onboarding earlier has nothing to do here.
  const finishedEarlier = step === "done" && !finishing;
  useEffect(() => {
    if (finishedEarlier) router.replace("/dashboard");
  }, [finishedEarlier, router]);

  if (step === "loading" || finishedEarlier) {
    return (
      <div className="flex flex-col items-center gap-3" role="status">
        <span className="size-6 animate-spin rounded-full border-2 border-white/10 border-t-accent-fg" />
        <span className="text-sm text-muted">Loading setup…</span>
      </div>
    );
  }

  if (step === "already") {
    return (
      <Panel className="max-w-[420px] text-center">
        <IconTile icon="shield-check" className="mx-auto" />
        <h1 className="mt-5 text-xl font-semibold tracking-tight">This control plane is already set up</h1>
        <p className="mt-2 text-sm text-muted">Log in as the owner to continue — unfinished setup steps pick up where you left off.</p>
        <Link href="/login?next=/setup" className="btn-primary mt-6 inline-flex h-10 items-center rounded-xl px-5 text-sm font-medium">
          Go to login
        </Link>
      </Panel>
    );
  }

  const index = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="w-full max-w-[560px]">
      <Progress index={index} />

      <div key={step} className="animate-fade-up">
        {step === "account" && <AccountStep />}

        {step === "verify" && (
          <Panel className="flex justify-center px-6 py-10">
            <CodeStep onBack={resetChallenge} />
          </Panel>
        )}

        {step === "two-factor" && user && (
          <Panel>
            {recoveryCodes ? (
              <>
                <StepHeader icon="key" title="Save your recovery codes" text="If you lose access to your authenticator app, a recovery code gets you back in." />
                <RecoveryCodesPanel
                  codes={recoveryCodes}
                  onDone={() => {
                    confirmSavedCodes();
                    clearRecoveryCodes();
                  }}
                />
              </>
            ) : user.totp_enabled ? (
              <>
                <StepHeader icon="shield-check" title="Authenticator app is on" text="Your recovery codes were shown when you turned it on. Keep them somewhere safe." />
                <Button variant="primary" size="md" className="w-full rounded-xl" onClick={confirmSavedCodes}>
                  Continue
                </Button>
              </>
            ) : twoFactorChoice === "totp" ? (
              <>
                <StepHeader icon="shield-check" title="Set up your authenticator app" text="You’ll enter a code from it every time you sign in." />
                <TotpSetupPanel onCancel={() => chooseTwoFactor(null)} />
              </>
            ) : (
              <>
                <StepHeader
                  icon="fingerprint"
                  title="Protect your sign-in"
                  text={`${displayName(user)}, your email is verified. Choose the second step you’ll use every time you sign in.`}
                />
                <div className="space-y-3">
                  <Choice
                    icon="shield-check"
                    title="Authenticator app"
                    badge="Recommended"
                    text="Codes from Google Authenticator, 1Password or Authy. Works offline and can’t be intercepted by email."
                    onClick={() => chooseTwoFactor("totp")}
                  />
                  <Choice
                    icon="inbox"
                    title="Email codes"
                    text={`We email a 6-digit code to ${user.email} at each sign-in. You can switch to an app later in Settings.`}
                    onClick={() => chooseTwoFactor("email")}
                  />
                </div>
              </>
            )}
          </Panel>
        )}

        {step === "server" && user && (
          <ServerStep
            onBackToTwoFactor={user.totp_enabled ? undefined : () => chooseTwoFactor(null)}
            complete={complete}
            onFinish={() => {
              setFinishing(true);
              complete.mutate(undefined, { onError: () => setFinishing(false) });
            }}
          />
        )}

        {step === "done" && user && (
          <Panel className="text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-ok/30 bg-ok/10 text-ok">
              <Icon name="check" size={24} strokeWidth={2} />
            </div>
            <h1 className="mt-6 text-[26px] font-semibold tracking-tight">You’re all set, {displayName(user)}</h1>
            <p className="mt-2 text-sm text-muted">Your control plane is ready. Here’s how it’s configured:</p>
            <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm">
              <Summary icon="user" label="Owner" value={user.email} />
              <Summary icon="check-circle" label="Email" value="Verified" />
              <Summary icon="shield-check" label="Two-factor" value={user.totp_enabled ? "Authenticator app" : "Email codes"} />
              <Summary icon="server" label="This server" value={selfManage ? "Self-management on" : "Not managed"} />
            </ul>
            <Button
              variant="primary"
              size="md"
              className="mt-8 w-full rounded-xl"
              iconRight="arrow-right"
              onClick={() => {
                resetOnboarding();
                router.push("/dashboard");
              }}
            >
              Open dashboard
            </Button>
          </Panel>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AccountStep() {
  const setup = useSetup();
  const [pw, setPw] = useState("");
  const score = strength(pw);

  return (
    <Panel>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          setup.mutate({ name: String(form.get("name")), email: String(form.get("email")), password: String(form.get("password")) });
        }}
        className="space-y-4"
      >
        <StepHeader icon="user" title="Create the owner account" text="This account controls the control plane and every enrolled server. We’ll email a code to verify the address." />
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
          <Input id="password" name="password" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={12} maxLength={128} />
          <div className="mt-2 flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full", i < score ? (score < 2 ? "bg-err" : score < 4 ? "bg-warn" : "bg-ok") : "bg-white/10")} />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-subtle" aria-live="polite">
            {pw ? ["Too weak", "Weak", "Fair", "Good", "Strong"][score] : "Use a passphrase or a password manager."}
          </p>
        </div>
        {setup.error && <ErrorNote>{setup.error.message}</ErrorNote>}
        <Button type="submit" variant="primary" size="md" className="w-full rounded-xl" disabled={setup.isPending}>
          {setup.isPending ? "Creating account…" : "Continue"}
        </Button>
      </form>
    </Panel>
  );
}

function ServerStep({
  onBackToTwoFactor,
  complete,
  onFinish,
}: {
  onBackToTwoFactor?: () => void;
  complete: ReturnType<typeof useCompleteOnboarding>;
  onFinish: () => void;
}) {
  const selfManage = useOnboardingStore((s) => s.selfManage);
  const setSelfManage = useOnboardingStore((s) => s.setSelfManage);
  return (
    <Panel>
      <StepHeader icon="server" title="Manage this server too?" text="Install the agent on the host running this dashboard so it appears alongside your other servers." />
      <button
        type="button"
        role="switch"
        aria-checked={selfManage}
        onClick={() => setSelfManage(!selfManage)}
        className="flex w-full items-start gap-4 rounded-xl border border-white/[0.06] bg-[#141414] p-4 text-left transition-colors hover:border-white/15"
      >
        <span className={cn("mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors", selfManage ? "bg-accent" : "bg-white/15")}>
          <span className={cn("size-4 rounded-full bg-white transition-transform", selfManage && "translate-x-4")} />
        </span>
        <span>
          <span className="block text-sm font-medium">Enable self-management</span>
          <span className="mt-0.5 block text-[13px] text-muted">You can enroll it later from Servers if you prefer.</span>
        </span>
      </button>
      <ul className="mt-5 space-y-2 text-[13px] text-muted">
        {["Agent runs unprivileged under systemd", "Privileged helper limited to fixed operations", "Can be revoked at any time"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <Icon name="check" size={14} className="text-ok" /> {t}
          </li>
        ))}
      </ul>
      {complete.error && (
        <div className="mt-5">
          <ErrorNote>{complete.error.message}</ErrorNote>
        </div>
      )}
      <div className="mt-6 flex gap-2">
        {onBackToTwoFactor && (
          <Button variant="secondary" size="md" className="rounded-xl" onClick={onBackToTwoFactor}>
            Back
          </Button>
        )}
        <Button variant="primary" size="md" className="flex-1 rounded-xl" disabled={complete.isPending} onClick={onFinish}>
          {complete.isPending ? "Finishing…" : "Finish setup"}
        </Button>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */

function Progress({ index }: { index: number }) {
  return (
    <ol className="mb-6 flex items-center gap-2 text-xs" aria-label="Setup progress">
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex flex-1 items-center gap-2" aria-current={i === index ? "step" : undefined}>
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium transition-colors",
              i < index ? "border-ok/40 bg-ok/15 text-ok" : i === index ? "btn-primary border-transparent" : "border-line-strong text-subtle",
            )}
          >
            {i < index ? <Icon name="check" size={11} strokeWidth={2.5} /> : i + 1}
          </span>
          <span className={cn("hidden whitespace-nowrap sm:inline", i === index ? "text-fg" : "text-subtle")}>{s.label}</span>
          {i < STEPS.length - 1 && <span className={cn("h-px flex-1", i < index ? "bg-ok/40" : "bg-line-strong")} />}
        </li>
      ))}
    </ol>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("w-full rounded-2xl border border-white/[0.06] bg-[#1c1c1c] p-6 sm:p-8", className)}>{children}</div>;
}

function IconTile({ icon, className }: { icon: IconName; className?: string }) {
  return (
    <div className={cn("flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-[#141414] text-accent-fg", className)}>
      <Icon name={icon} size={20} />
    </div>
  );
}

function StepHeader({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <div className="mb-6 flex gap-4">
      <IconTile icon={icon} className="shrink-0" />
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted">{text}</p>
      </div>
    </div>
  );
}

function Choice({ icon, title, text, badge, onClick }: { icon: IconName; title: string; text: string; badge?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-start gap-4 rounded-xl border border-white/[0.08] bg-[#141414] p-4 text-left transition-colors hover:border-accent/50 hover:bg-accent/[0.06]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#0d0d0d] text-muted group-hover:text-accent-fg">
        <Icon name={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-medium">
          {title} {badge && <Badge tone="blue">{badge}</Badge>}
        </span>
        <span className="mt-1 block text-[13px] leading-relaxed text-muted">{text}</span>
      </span>
      <Icon name="arrow-right" size={16} className="mt-3 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
    </button>
  );
}

function Summary({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#141414] px-4 py-3">
      <Icon name={icon} size={16} className="text-accent-fg" />
      <span className="text-muted">{label}</span>
      <span className="ml-auto truncate text-fg">{value}</span>
    </li>
  );
}

function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-err/30 bg-err/10 p-3 text-sm text-err" role="alert">
      <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
      {children}
    </p>
  );
}

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
