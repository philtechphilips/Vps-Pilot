import type { Metadata } from "next";
import { Suspense } from "react";
import { GateLoading } from "@/components/auth/auth-gate";
import { RuntimeLogsView } from "./runtime-logs";

export const metadata: Metadata = { title: "Runtime Logs" };

export default function RuntimeLogsPage() {
  return (
    <Suspense fallback={<GateLoading />}>
      <RuntimeLogsView />
    </Suspense>
  );
}
