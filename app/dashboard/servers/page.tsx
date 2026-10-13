import type { Metadata } from "next";
import { ButtonLink, PageHeader } from "@/components/ui";
import { ServerGrid } from "./server-grid";

export const metadata: Metadata = { title: "Servers" };

export default function ServersPage() {
  return (
    <>
      <PageHeader
        title="Servers"
        description="Every enrolled Ubuntu and Debian host, including the control plane."
        actions={
          <>
            <ButtonLink href="/dashboard/settings#enrollment" variant="secondary" size="md" icon="key">
              Tokens
            </ButtonLink>
            <ButtonLink href="/dashboard/servers/new" variant="primary" size="md" icon="plus">
              Enroll Server
            </ButtonLink>
          </>
        }
      />
      <ServerGrid />
    </>
  );
}
