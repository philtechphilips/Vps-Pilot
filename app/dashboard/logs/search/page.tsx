import type { Metadata } from "next";
import { LogSearch } from "./log-search";

export const metadata: Metadata = { title: "Search logs" };

export default function LogSearchPage() {
  return <LogSearch />;
}
