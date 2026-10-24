"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { Button } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { useResendCode, useVerifyCode } from "@/lib/api/auth";
import { useChallengeStore } from "@/lib/stores/challenge-store";
import { cn } from "@/lib/utils";

const LENGTH = 6;

/** Six boxes that behave like one input: typing advances, paste fills all. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const setFrom = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;
    const next = (value.slice(0, index) + digits).slice(0, LENGTH);
    onChange(next);
    refs.current[Math.min(next.length, LENGTH - 1)]?.focus();
    if (next.length === LENGTH) onComplete(next);
  };

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="Verification code">
      {Array.from({ length: LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={LENGTH}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          autoFocus={i === 0}
          onChange={(e) => setFrom(i, e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            setFrom(0, e.clipboardData.getData("text"));
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              const cut = value[i] ? i : Math.max(0, i - 1);
              onChange(value.slice(0, cut));
              refs.current[cut]?.focus();
            } else if (e.key === "ArrowLeft") refs.current[i - 1]?.focus();
            else if (e.key === "ArrowRight") refs.current[i + 1]?.focus();
          }}
          className={cn(
            "size-12 rounded-xl border bg-inset text-center font-mono text-xl outline-none transition-[border,box-shadow] disabled:opacity-50 sm:size-14",
            invalid ? "border-err/60" : "border-black/10 focus:border-accent focus:shadow-[0_0_0_3px_rgb(165_76_162/0.25)]",
          )}
        />
      ))}
    </div>
  );
}

function useCountdown(sentAt: number | null, seconds: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  if (!sentAt) return 0;
  return Math.max(0, Math.ceil((sentAt + seconds * 1000 - now) / 1000));
}

/**
 * Second-factor step shared by login and owner setup.
 *
 * Email challenges: enter the emailed code, with a rate-limited resend.
 * Authenticator challenges: enter the app's code or a recovery code, or fall
 * back to an emailed code.
 *
 * Success is reported through the auth store (the verify hook stores the
 * session), so parents should react to that rather than to a callback that
 * could be lost if this step unmounts first.
 */
export function CodeStep({ onBack }: { onBack: () => void }) {
  const challenge = useChallengeStore((s) => s.challenge);
  const sentAt = useChallengeStore((s) => s.sentAt);
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState(false);
  const verify = useVerifyCode();
  const resend = useResendCode();
  const wait = useCountdown(sentAt, challenge?.resend_in ?? 30);

  if (!challenge) return null;
  const isApp = challenge.method === "totp";

  const submit = (value: string) => {
    const ready = recovery ? value.replace(/[^a-z0-9]/gi, "").length === 8 : value.length === LENGTH;
    if (!ready || verify.isPending) return;
    verify.mutate({ challenge_id: challenge.challenge_id, code: value.trim() }, { onError: () => setCode("") });
  };

  const error = verify.error ?? resend.error;
  const expired = error instanceof ApiError && /expired|no longer valid|Start again/i.test(error.message);

  const heading = isApp ? "Enter your authenticator code" : challenge.purpose === "setup" ? "Verify your email" : "Check your email";
  const icon: IconName = isApp ? "shield-check" : "inbox";

  return (
    <div className="w-full max-w-[400px] animate-fade-up text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-black/10 bg-bg-100 text-accent-fg">
        <Icon name={icon} size={22} />
      </div>
      <h1 className="mt-6 text-[26px] font-semibold tracking-tight">{recovery ? "Use a recovery code" : heading}</h1>
      <p className="mt-2 text-sm text-muted">
        {recovery ? (
          "Enter one of the codes you saved when you set up your authenticator. Each works once."
        ) : isApp ? (
          "Open your authenticator app and enter the 6-digit code for VPSPilot."
        ) : (
          <>
            We sent a 6-digit code to <span className="font-medium text-fg">{challenge.email_hint}</span>.
            <br />
            It expires in {Math.round(challenge.expires_in / 60)} minutes.
          </>
        )}
      </p>

      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          submit(code);
        }}
      >
        {recovery ? (
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            placeholder="xxxx-xxxx"
            aria-label="Recovery code"
            className="h-12 w-full rounded-xl border border-black/10 bg-inset text-center font-mono text-lg tracking-widest outline-none focus:border-accent"
          />
        ) : (
          <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={verify.isPending} invalid={!!verify.error} />
        )}

        <div aria-live="polite" className="mt-4 min-h-5 text-sm">
          {error && <p className="text-err">{error.message}</p>}
          {resend.isSuccess && !error && <p className="text-ok">A code is on its way to {challenge.email_hint}.</p>}
        </div>

        <Button type="submit" variant="primary" size="md" className="mt-2 w-full rounded-xl" disabled={verify.isPending || !code}>
          {verify.isPending ? "Verifying…" : "Verify"}
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
        {expired ? (
          <button type="button" onClick={onBack} className="text-accent-fg hover:underline">
            Start again
          </button>
        ) : isApp ? (
          <>
            <button
              type="button"
              onClick={() => {
                setRecovery((r) => !r);
                setCode("");
                verify.reset();
              }}
              className="text-muted transition-colors hover:text-fg"
            >
              {recovery ? "Use authenticator code" : "Use a recovery code"}
            </button>
            <span className="text-subtle">·</span>
            <button
              type="button"
              disabled={resend.isPending}
              onClick={() => {
                verify.reset();
                setRecovery(false);
                setCode("");
                resend.mutate(challenge.challenge_id);
              }}
              className="text-muted transition-colors hover:text-fg disabled:opacity-60"
            >
              {resend.isPending ? "Sending…" : "Email me a code instead"}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={wait > 0 || resend.isPending}
            onClick={() => {
              verify.reset();
              resend.mutate(challenge.challenge_id);
            }}
            className="text-muted transition-colors hover:text-fg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resend.isPending ? "Sending…" : wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
          </button>
        )}
        <span className="text-subtle">·</span>
        <button type="button" onClick={onBack} className="text-muted transition-colors hover:text-fg">
          Use a different account
        </button>
      </div>
    </div>
  );
}
