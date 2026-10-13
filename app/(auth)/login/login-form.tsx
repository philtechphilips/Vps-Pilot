"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Button, Input, Label } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [show, setShow] = useState(false);
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  if (step === "mfa") {
    return (
      <div className="w-full max-w-[380px] animate-fade-up text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-line bg-bg-100">
          <Icon name="shield-check" size={20} />
        </div>
        <h1 className="mt-6 text-[28px] font-semibold tracking-tight">Two-factor authentication</h1>
        <p className="mt-2 text-sm text-muted">Enter the 6-digit code from your authenticator app.</p>
        <form
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/dashboard");
          }}
        >
          <div className="flex justify-center gap-2">
            {code.map((c, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={c}
                inputMode="numeric"
                maxLength={1}
                aria-label={`Digit ${i + 1}`}
                autoFocus={i === 0}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  const next = [...code];
                  next[i] = v;
                  setCode(next);
                  if (v && i < 5) inputs.current[i + 1]?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !code[i] && i > 0) inputs.current[i - 1]?.focus();
                }}
                className="size-12 rounded-md border border-line-strong bg-bg text-center font-mono text-lg outline-none focus:border-[#555] focus:shadow-[0_0_0_3px_rgb(255_255_255/0.08)]"
              />
            ))}
          </div>
          <Button type="submit" variant="primary" size="md" className="mt-6 w-full">
            Verify
          </Button>
        </form>
        <button type="button" onClick={() => setStep("credentials")} className="mt-6 text-sm text-muted hover:text-fg">
          Use a recovery code instead
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[380px] animate-fade-up">
      <h1 className="text-center text-[28px] font-semibold tracking-tight">Log in to VPSPilot</h1>
      <p className="mt-2 text-center text-sm text-muted">Owner access to your control plane at pilot.example.com</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setStep("mfa");
        }}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="username" placeholder="you@example.com" required />
        </div>
        <div>
          <Label htmlFor="password" hint={<a href="#" className="hover:text-fg">Forgot?</a>}>
            Password
          </Label>
          <div className="relative">
            <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" required className="pr-10" />
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
        <Button type="submit" variant="primary" size="md" className="w-full">
          Continue
        </Button>
      </form>
      <div className="mt-6 flex items-center gap-2 rounded-md border border-line bg-bg-100 p-3 text-xs text-muted">
        <Icon name="lock" size={14} className="shrink-0" />
        Login attempts are throttled. Sessions can be revoked from Settings.
      </div>
      <p className="mt-8 text-center text-sm text-muted">
        First time here?{" "}
        <Link href="/setup" className="text-blue-fg hover:underline">
          Set up the owner account
        </Link>
      </p>
    </div>
  );
}
