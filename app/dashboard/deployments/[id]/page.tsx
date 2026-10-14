import type { Metadata } from "next";
import { Suspense } from "react";
import { GateLoading } from "@/components/auth/auth-gate";
import { DeploymentView } from "./deployment-view";

export const metadata: Metadata = { title: "Deployment" };

export default function DeploymentPage() {
  return (
    <Suspense fallback={<GateLoading />}>
      <DeploymentView />
    </Suspense>
  );
}
