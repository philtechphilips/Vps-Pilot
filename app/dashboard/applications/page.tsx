import type { Metadata } from "next";
import { ButtonLink, PageHeader } from "@/components/ui";
import { AppGrid } from "./app-grid";

export const metadata: Metadata = { title: "Applications" };

export default function ApplicationsPage() {
  return (
    <>
      <PageHeader
        title="Applications"
        description="Docker apps built from Git or pulled from a registry, released with a health check."
        actions={
          <ButtonLink href="/dashboard/applications/new" variant="primary" size="md" icon="plus">
            New Application
          </ButtonLink>
        }
      />
      <AppGrid />
    </>
  );
}
