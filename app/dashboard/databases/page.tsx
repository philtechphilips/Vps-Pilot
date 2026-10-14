import type { Metadata } from "next";
import { ButtonLink, PageHeader } from "@/components/ui";
import { DatabaseList } from "./database-list";

export const metadata: Metadata = { title: "Databases" };

export default function DatabasesPage() {
  return (
    <>
      <PageHeader
        title="Databases"
        description="Databases VPSPilot runs for you, and ones you already had, across your servers."
        actions={
          <ButtonLink href="/dashboard/databases/new" variant="primary" size="md" icon="plus">
            New Database
          </ButtonLink>
        }
      />
      <DatabaseList />
    </>
  );
}
