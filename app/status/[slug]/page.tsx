import type { Metadata } from "next";
import { Suspense } from "react";
import { StatusView } from "./status-view";

export const metadata: Metadata = { title: "Status" };

export default function StatusPage() {
  // The slug is only known at request time; the view reads it with useParams.
  return (
    <Suspense fallback={null}>
      <StatusView />
    </Suspense>
  );
}
