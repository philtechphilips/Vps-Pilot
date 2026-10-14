import type { Metadata } from "next";
import { NewAppFlow } from "./new-app-flow";

export const metadata: Metadata = { title: "New Application" };

export default function NewApplicationPage() {
  return (
    <div>
      <div className="max-w-[1200px] px-4 pt-6 pb-16 sm:px-6">
        <h1 className="text-[22px] font-semibold tracking-tight">Let’s deploy something.</h1>
        <p className="mt-1 text-[13px] text-muted">Run a Git repository as a container, a systemd service or a Compose project, or run a container image, on one of your servers.</p>
        <NewAppFlow />
      </div>
    </div>
  );
}
