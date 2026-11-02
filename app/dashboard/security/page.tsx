import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { SecurityOverview } from "./security-overview";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <>
      <PageHeader
        title="Security"
        description="Known vulnerabilities in your apps' packages, committed secrets, runtimes past end of life, outdated agents and account changes."
      />
      <SecurityOverview />
    </>
  );
}
