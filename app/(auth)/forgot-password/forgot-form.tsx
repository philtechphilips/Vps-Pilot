"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { Button, Input, Label } from "@/components/ui";
import { useForgotPassword } from "@/lib/api/auth";

export function ForgotForm() {
  const forgot = useForgotPassword();

  if (forgot.isSuccess) {
    return (
      <div className="w-full max-w-[380px] animate-fade-up text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-[#141414] text-accent-fg">
          <Icon name="inbox" size={22} />
        </div>
        <h1 className="mt-6 text-[26px] font-semibold tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm text-muted">{forgot.data.message}. The link expires in 30 minutes.</p>
        <Link href="/login" className="mt-8 inline-block text-sm text-accent-fg hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[380px] animate-fade-up">
      <h1 className="text-center text-[28px] font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-2 text-center text-sm text-muted">We’ll email the owner account a single-use reset link.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          forgot.mutate(String(new FormData(e.currentTarget).get("email")));
        }}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </div>
        {forgot.error && (
          <p className="rounded-lg border border-err/30 bg-err/10 p-3 text-sm text-err" role="alert">
            {forgot.error.message}
          </p>
        )}
        <Button type="submit" variant="primary" size="md" className="w-full rounded-xl" disabled={forgot.isPending}>
          {forgot.isPending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="text-accent-fg hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
