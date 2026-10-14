import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { AuditTable } from "./audit-table";

export const metadata: Metadata = { title: "Audit Log" };

export default function AuditPage() {
  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Privileged and security-relevant actions, with actor, target, result and correlation ID. Secrets are never recorded."
      />
      <AuditTable />
    </>
  );
}
