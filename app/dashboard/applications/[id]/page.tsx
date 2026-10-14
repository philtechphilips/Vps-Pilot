import type { Metadata } from "next";
import { Suspense } from "react";
import { GateLoading } from "@/components/auth/auth-gate";
import { AppDetailView } from "./app-detail";

export const metadata: Metadata = { title: "Application" };

export default function ApplicationPage() {
  // The id is only known at request time; the view reads it with useParams.
  return (
    <Suspense fallback={<GateLoading />}>
      <AppDetailView />
    </Suspense>
  );
}
