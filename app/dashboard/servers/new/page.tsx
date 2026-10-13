import type { Metadata } from "next";
import { DetailHeader } from "@/components/dashboard/detail";
import { Container } from "@/components/ui";
import { EnrollFlow } from "./enroll-flow";

export const metadata: Metadata = { title: "Enroll Server" };

export default function EnrollPage() {
  return (
    <>
      <DetailHeader back="/dashboard/servers" backLabel="Servers" title="Enroll a server" meta={<span>Connect an Ubuntu or Debian VPS with a single-use token.</span>} />
      <Container className="max-w-[880px]">
        <EnrollFlow />
      </Container>
    </>
  );
}
