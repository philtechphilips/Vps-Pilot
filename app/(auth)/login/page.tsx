import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  // LoginForm reads ?next= from the URL, which is only known at request time.
  return (
    <Suspense fallback={<div className="h-96 w-full max-w-[380px]" />}>
      <LoginForm />
    </Suspense>
  );
}
