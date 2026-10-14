import type { Metadata } from "next";
import { ButtonLink, PageHeader } from "@/components/ui";
import { BackupsView } from "./backups-view";

export const metadata: Metadata = { title: "Backups" };

export default function BackupsPage() {
  return (
    <>
      <PageHeader
        title="Backups"
        description="Encrypted, checksummed database backups with schedules, retention and restore checks."
        actions={
          <ButtonLink href="/dashboard/settings#storage" variant="secondary" size="md" icon="settings">
            Storage
          </ButtonLink>
        }
      />
      <BackupsView />
    </>
  );
}
