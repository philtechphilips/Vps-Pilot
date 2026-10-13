import type { Metadata } from "next";
import { LogsViewer } from "./logs-viewer";

export const metadata: Metadata = { title: "Logs" };

export default function LogsPage() {
  return <LogsViewer />;
}
