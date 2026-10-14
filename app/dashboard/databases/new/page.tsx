import type { Metadata } from "next";
import { DetailHeader } from "@/components/dashboard/detail";
import { Container } from "@/components/ui";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "New Database" };

export default function RegisterDatabasePage() {
  return (
    <>
      <DetailHeader
        back="/dashboard/databases"
        backLabel="Databases"
        title="New database"
        meta={<span>Run a new database on your server, or connect one you already have.</span>}
      />
      <Container className="max-w-[920px]">
        <RegisterForm />
      </Container>
    </>
  );
}
