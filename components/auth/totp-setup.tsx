"use client";

import { useEffect, useState } from "react";
import { OtpInput } from "@/components/auth/code-step";
import { CopyButton } from "@/components/copy-button";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui";
import { useConfirmTotp, useStartTotpSetup } from "@/lib/api/auth";

/**
 * Scan-and-confirm panel for an authenticator app. On success the one-time
 * recovery codes land in useRecoveryCodesStore (see useConfirmTotp).
 */
export function TotpSetupPanel({ onCancel }: { onCancel?: () => void }) {
  const start = useStartTotpSetup();
  const confirm = useConfirmTotp();
  const [code, setCode] = useState("");
  const [showKey, setShowKey] = useState(false);

  // Create the pending secret once when the panel opens.
  const { mutate: begin, isIdle } = start;
  useEffect(() => {
    if (isIdle) begin();
  }, [isIdle, begin]);

  const submit = (value: string) => {
    if (value.length !== 6 || confirm.isPending) return;
    confirm.mutate(value, { onError: () => setCode("") });
  };

  if (start.isPending || start.isIdle) {
    return (
      <div className="flex flex-col items-center gap-3 py-10" role="status">
        <span className="size-6 animate-spin rounded-full border-2 border-ink/10 border-t-accent-fg" />
        <span className="text-sm text-muted">Generating your secret…</span>
      </div>
    );
  }

  if (start.error) {
    return (
      <div className="space-y-4 py-4 text-center">
        <p className="text-sm text-err">{start.error.message}</p>
        <Button variant="secondary" size="sm" onClick={() => start.mutate()}>
          Try again
        </Button>
      </div>
    );
  }

  const setup = start.data!;
  const grouped = setup.secret.match(/.{1,4}/g)?.join(" ") ?? setup.secret;

  return (
    <div className="space-y-6">
      <ol className="space-y-5 text-sm">
        <li className="flex gap-3">
          <Step n={1} />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-fg">Scan this QR code</p>
            <p className="mt-0.5 text-[13px] text-muted">Use Microsoft Authenticator, Google Authenticator, 1Password, Authy or any TOTP app.</p>
            <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div
                className="size-[200px] shrink-0 overflow-hidden rounded-xl bg-white [&>svg]:block [&>svg]:size-full"
                role="img"
                aria-label="QR code for your authenticator app"
                dangerouslySetInnerHTML={{ __html: setup.qr_svg }}
              />
              <div className="min-w-0 text-[13px]">
                <button type="button" onClick={() => setShowKey((s) => !s)} className="flex items-center gap-1.5 text-accent-fg hover:underline">
                  <Icon name="key" size={13} />
                  {showKey ? "Hide setup key" : "Can't scan? Enter a key instead"}
                </button>
                {showKey && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-ink/10 bg-inset py-1.5 pr-1 pl-3">
                    <code className="font-mono text-xs break-all text-fg">{grouped}</code>
                    <CopyButton value={setup.secret} label="Copy setup key" />
                  </div>
                )}
                <p className="mt-3 text-xs text-subtle">Time-based, 6 digits, 30 seconds. The key is encrypted on your server.</p>
              </div>
            </div>
          </div>
        </li>
        <li className="flex gap-3">
          <Step n={2} />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-fg">Enter the 6-digit code it shows</p>
            <form
              className="mt-4"
              onSubmit={(e) => {
                e.preventDefault();
                submit(code);
              }}
            >
              <div className="flex justify-start">
                <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={confirm.isPending} invalid={!!confirm.error} />
              </div>
              <p aria-live="polite" className="mt-3 min-h-5 text-sm text-err">
                {confirm.error?.message}
              </p>
              <div className="mt-2 flex gap-2">
                {onCancel && (
                  <Button variant="secondary" size="md" className="rounded-xl" onClick={onCancel}>
                    Back
                  </Button>
                )}
                <Button type="submit" variant="primary" size="md" className="flex-1 rounded-xl" disabled={code.length !== 6 || confirm.isPending}>
                  {confirm.isPending ? "Verifying…" : "Turn on authenticator"}
                </Button>
              </div>
            </form>
          </div>
        </li>
      </ol>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/15 text-xs font-semibold text-accent-fg">
      {n}
    </span>
  );
}

/** One-time display of recovery codes with copy / download and a confirm gate. */
export function RecoveryCodesPanel({ codes, onDone, doneLabel = "Continue" }: { codes: string[]; onDone: () => void; doneLabel?: string }) {
  const [saved, setSaved] = useState(false);
  const text = `VPSPilot recovery codes\nEach code works once. Keep them somewhere safe.\n\n${codes.join("\n")}\n`;

  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-xl border border-warn/30 bg-warn/[0.07] p-3 text-[13px] text-warn">
        <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
        <span>
          These codes are shown <strong>once</strong>. Each one signs you in if you lose your phone. Store them in a password manager.
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-ink/[0.06] bg-inset p-4 font-mono text-sm sm:grid-cols-2">
        {codes.map((c, i) => (
          <span key={c} className="flex items-center gap-2 text-fg">
            <span className="w-4 text-right text-xs text-subtle">{i + 1}</span>
            {c}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-lg border border-ink/10 bg-bg-100 pr-3 pl-1 text-sm text-muted">
          <CopyButton value={codes.join("\n")} label="Copy recovery codes" /> Copy
        </span>
        <a
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`}
          download="vpspilot-recovery-codes.txt"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink/10 bg-bg-100 px-3 text-sm text-muted hover:text-fg"
        >
          <Icon name="download" size={14} /> Download .txt
        </a>
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="size-4 accent-accent" />
        I’ve saved my recovery codes somewhere safe
      </label>
      <Button variant="primary" size="md" className="w-full rounded-xl" disabled={!saved} onClick={onDone}>
        {doneLabel}
      </Button>
    </div>
  );
}
