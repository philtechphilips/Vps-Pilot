import type { Metadata } from "next";
import { Suspense } from "react";
import { GateLoading } from "@/components/auth/auth-gate";
import { ServerDetailView } from "./server-detail";

export const metadata: Metadata = { title: "Server" };

export default function ServerPage() {
  // The server id is only known at request time; the view reads it with useParams.
  return (
    <Suspense fallback={<GateLoading />}>
      <ServerDetailView />
    </Suspense>
  );
}
