import type { Metadata } from "next";
import { Suspense } from "react";
import { GateLoading } from "@/components/auth/auth-gate";
import { PageHeader } from "@/components/ui";
import { GitHubSetup } from "./github-setup";

export const metadata: Metadata = { title: "GitHub" };

export default function GitHubSettingsPage() {
  // GitHub redirects here (?code=…&state=… after creating the app,
  // ?installation_id=… after installing it).
  return (
    <>
      <PageHeader title="GitHub" description="Import repositories and deploy on every push." />
      <Suspense fallback={<GateLoading />}>
        <GitHubSetup />
      </Suspense>
    </>
  );
}
