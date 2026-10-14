import type { Metadata } from "next";
import { Suspense } from "react";
import { GateLoading } from "@/components/auth/auth-gate";
import { DatabaseView } from "./workspace";

export const metadata: Metadata = { title: "Database" };

export default function DatabasePage() {
  return (
    <Suspense fallback={<GateLoading />}>
      <DatabaseView />
    </Suspense>
  );
}
