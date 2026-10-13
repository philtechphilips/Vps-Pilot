import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  // The token arrives in ?token=, which is only known at request time.
  return (
    <Suspense fallback={<div className="h-80 w-full max-w-[380px]" />}>
      <ResetForm />
    </Suspense>
  );
}
