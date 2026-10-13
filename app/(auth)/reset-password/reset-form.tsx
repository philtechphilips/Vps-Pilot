"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Button, Input, Label } from "@/components/ui";
import { useResetPassword } from "@/lib/api/auth";

export function ResetForm() {
  const token = useSearchParams().get("token");
  const reset = useResetPassword();
  const [mismatch, setMismatch] = useState(false);

  if (!token) {
    return (
      <div className="w-full max-w-[380px] text-center">
        <h1 className="text-[26px] font-semibold tracking-tight">Link is missing its token</h1>
        <p className="mt-2 text-sm text-muted">Open the link from the email again, or request a new one.</p>
        <Link href="/forgot-password" className="mt-6 inline-block text-sm text-accent-fg hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (reset.isSuccess) {
    return (
      <div className="w-full max-w-[380px] animate-fade-up text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-ok/30 bg-ok/10 text-ok">
          <Icon name="check" size={22} />
        </div>
        <h1 className="mt-6 text-[26px] font-semibold tracking-tight">Password updated</h1>
        <p className="mt-2 text-sm text-muted">Every device was signed out. Log in with your new password.</p>
        <Link href="/login" className="btn-primary mt-8 inline-flex h-10 items-center rounded-xl px-5 text-sm font-medium">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[380px] animate-fade-up">
      <h1 className="text-center text-[28px] font-semibold tracking-tight">Choose a new password</h1>
      <p className="mt-2 text-center text-sm text-muted">Resetting signs you out on every device.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const password = String(form.get("password"));
          if (password !== String(form.get("confirm"))) {
            setMismatch(true);
            return;
          }
          setMismatch(false);
          reset.mutate({ token, new_password: password });
        }}
      >
        <div>
          <Label htmlFor="password" hint="At least 8 characters">
            New password
          </Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
        </div>
        {(mismatch || reset.error) && (
          <p className="rounded-lg border border-err/30 bg-err/10 p-3 text-sm text-err" role="alert">
            {mismatch ? "Passwords don't match." : reset.error?.message}
            {reset.error?.status === 400 && (
              <>
                {" "}
                <Link href="/forgot-password" className="underline">
                  Request a new link
                </Link>
              </>
            )}
          </p>
        )}
        <Button type="submit" variant="primary" size="md" className="w-full rounded-xl" disabled={reset.isPending}>
          {reset.isPending ? "Saving…" : "Set new password"}
        </Button>
      </form>
    </div>
  );
}
