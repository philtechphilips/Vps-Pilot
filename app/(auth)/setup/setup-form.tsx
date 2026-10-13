"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Icon } from "@/components/icons";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

const steps = ["Owner account", "Two-factor", "This server"];

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
  const [step, setStep] = useState(0);
  const [pw, setPw] = useState("");
  const [selfManage, setSelfManage] = useState(true);
  const score = strength(pw);

  return (
    <div className="w-full max-w-[460px] animate-fade-up">
      <ol className="mb-8 flex items-center gap-2 text-xs">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium",
                i < step ? "border-ok/40 bg-ok/15 text-ok" : i === step ? "border-fg bg-fg text-black" : "border-line-strong text-subtle",
              )}
            >
              {i < step ? <Icon name="check" size={11} strokeWidth={2.5} /> : i + 1}
            </span>
            <span className={cn("whitespace-nowrap", i === step ? "text-fg" : "text-subtle")}>{s}</span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-line-strong" />}
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-line bg-bg-100 p-6 sm:p-8">
        {step === 0 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(1);
            }}
            className="space-y-4"
          >
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Create the owner account</h1>
              <p className="mt-1 text-sm text-muted">This account has full control of the control plane and every enrolled server.</p>
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" autoComplete="name" placeholder="Ada Lovelace" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            </div>
            <div>
              <Label htmlFor="pw" hint="At least 12 characters">
                Password
              </Label>
              <Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={12} />
              <div className="mt-2 flex gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn("h-1 flex-1 rounded-full", i < score ? (score < 2 ? "bg-err" : score < 4 ? "bg-warn" : "bg-ok") : "bg-white/10")}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-subtle" aria-live="polite">
                {pw ? ["Too weak", "Weak", "Fair", "Good", "Strong"][score] : "Use a passphrase or a password manager."}
              </p>
            </div>
            <Button type="submit" variant="primary" size="md" className="w-full">
              Continue
            </Button>
          </form>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Enable two-factor</h1>
              <p className="mt-1 text-sm text-muted">MFA is required before this control plane is used in production.</p>
            </div>
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <div className="grid size-36 shrink-0 grid-cols-[repeat(21,1fr)] gap-0 rounded-md bg-white p-2" aria-label="QR code for authenticator app" role="img">
                {Array.from({ length: 441 }, (_, i) => {
                  const x = i % 21;
                  const y = Math.floor(i / 21);
                  const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
                  const ring = finder && (x % 14 === 0 || x % 14 === 6 || y % 14 === 0 || y % 14 === 6 || (x % 14 > 1 && x % 14 < 5 && y % 14 > 1 && y % 14 < 5));
                  const on = finder ? ring : (x * 7 + y * 13 + x * y) % 5 < 2;
                  return <span key={i} className={on ? "bg-black" : ""} />;
                })}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-muted">Scan with your authenticator app, or enter the key manually:</p>
                <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-line bg-bg px-3 py-2 font-mono text-xs">
                  <span className="truncate">JBSW Y3DP EHPK 3PXP</span>
                  <CopyButton value="JBSWY3DPEHPK3PXP" />
                </div>
                <Label htmlFor="totp">
                  <span className="mt-4 block">Verification code</span>
                </Label>
                <Input id="totp" inputMode="numeric" placeholder="123 456" className="font-mono tracking-widest" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="md" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button variant="primary" size="md" className="flex-1" onClick={() => setStep(2)}>
                Verify & continue
              </Button>
            </div>
          </div>
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
              className="flex w-full items-start gap-4 rounded-lg border border-line bg-bg p-4 text-left transition-colors hover:border-line-strong"
            >
              <span className={cn("mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors", selfManage ? "bg-blue" : "bg-white/15")}>
                <span className={cn("size-4 rounded-full bg-white transition-transform", selfManage && "translate-x-4")} />
              </span>
              <span>
                <span className="block text-sm font-medium">Enable self-management</span>
                <span className="mt-0.5 block text-[13px] text-muted">
                  Detected <span className="text-fg">Ubuntu 24.04 LTS · x86_64</span> at 49.12.188.21
                </span>
              </span>
            </button>
            <ul className="space-y-2 text-[13px] text-muted">
              {["Agent runs unprivileged under systemd", "Privileged helper limited to fixed operations", "Can be revoked at any time"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Icon name="check" size={14} className="text-ok" /> {t}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Button variant="secondary" size="md" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" size="md" className="flex-1" onClick={() => router.push("/dashboard")}>
                Go to dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
