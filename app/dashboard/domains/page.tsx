import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { DomainsView } from "./domains-view";

export const metadata: Metadata = { title: "Domains" };

export default function DomainsPage() {
  return (
    <>
      <PageHeader title="Domains" description="Hostnames for your apps, with automatic HTTPS from each server's VPSPilot proxy." />
      <DomainsView />
    </>
  );
}
