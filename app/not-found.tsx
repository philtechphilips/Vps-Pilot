import Link from "next/link";
import { Logotype } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <Logotype className="text-[26px]" />
      <div className="mt-8 flex items-center gap-4">
        <span className="text-2xl font-medium">404</span>
        <span className="h-10 w-px bg-line-strong" />
        <span className="text-sm text-muted">This page could not be found.</span>
      </div>
      <Link href="/dashboard" className="mt-8 text-sm text-blue-fg hover:underline">
        Go to dashboard
      </Link>
    </main>
  );
}
