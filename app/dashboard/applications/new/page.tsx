import type { Metadata } from "next";
import { NewAppFlow } from "./new-app-flow";

export const metadata: Metadata = { title: "New Application" };

export default function NewApplicationPage() {
  return (
    <div>
      <div className="max-w-[1200px] px-4 pt-6 pb-16 sm:px-6">
        <h1 className="text-[22px] font-semibold tracking-tight">Let’s deploy something.</h1>
        <p className="mt-1 text-[13px] text-muted">Import a Git repository or a pinned container image, choose a runtime and a target server.</p>
        <NewAppFlow />
      </div>
    </div>
  );
}
