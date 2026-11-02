"use client";

import Link from "next/link";
import { FormCard } from "@/components/ui";
import { usePlatform, useSavePlatform } from "@/lib/api/platform";

/** On/off for checking apps' packages against OSV.dev. */
export function VulnLookupsCard() {
  const platform = usePlatform();
  const save = useSavePlatform();
  const p = platform.data;
  return (
    <FormCard
      title="Vulnerability Checks"
      description={
        <>
          After every deploy each app&apos;s lockfiles and its container&apos;s OS packages are checked against{" "}
          <a href="https://osv.dev" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            OSV.dev
          </a>
          , the open database behind GitHub&apos;s and the Linux distros&apos; security advisories, and again every day. Only package names and versions are sent; the scan for
          committed secrets never leaves your servers.
        </>
      }
      footer={
        save.error ? (
          <span className="text-err">{save.error.message}</span>
        ) : (
          <>
            Results are on the{" "}
            <Link href="/dashboard/security" className="text-fg hover:underline">
              Security
            </Link>{" "}
            page and each app&apos;s page.
          </>
        )
      }
    >
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={p?.vuln_checks ?? true} disabled={!p || save.isPending} onChange={(e) => save.mutate({ vuln_checks: e.target.checked })} className="accent-[var(--color-accent)]" />
        Check apps&apos; packages for known vulnerabilities
      </label>
    </FormCard>
  );
}
