import type { Metadata } from "next";
import { DetailHeader } from "@/components/dashboard/detail";
import { Container } from "@/components/ui";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Register Database" };

export default function RegisterDatabasePage() {
  return (
    <>
      <DetailHeader
        back="/dashboard/databases"
        backLabel="Databases"
        title="Register a database"
        meta={<span>Connect an existing instance. VPSPilot never installs a duplicate database.</span>}
      />
      <Container className="max-w-[920px]">
        <RegisterForm />
      </Container>
    </>
  );
}
