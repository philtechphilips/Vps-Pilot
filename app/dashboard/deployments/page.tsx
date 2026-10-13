import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { DeploymentList } from "./deployment-list";

export const metadata: Metadata = { title: "Deployments" };

export default function DeploymentsPage() {
  return (
    <>
      <PageHeader
        title="Deployments"
        description="Every release attempt across all applications, with its source, outcome and logs."
      />
      <DeploymentList />
    </>
  );
}
