"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { GitHubCard } from "@/components/github/github-card";
import { Icon } from "@/components/icons";
import { ButtonLink, Callout, Container } from "@/components/ui";
import { useCompleteGitHubConnect, useRegisterInstallation } from "@/lib/api/github";
import { useAuthStore } from "@/lib/stores/auth-store";

// GitHub's codes are single-use: never send one twice (e.g. dev re-renders).
const handled = new Set<string>();

export function GitHubSetup() {
  const params = useSearchParams();
  const signedIn = useAuthStore((s) => s.status === "authenticated");
  const complete = useCompleteGitHubConnect();
  const register = useRegisterInstallation();
  const code = params.get("code");
  const state = params.get("state");
  const installationId = Number(params.get("installation_id")) || null;
  const { mutate: completeMutate } = complete;
  const { mutate: registerMutate } = register;

  useEffect(() => {
    if (!signedIn) return;
    if (code && state && !handled.has(`c:${code}`)) {
      handled.add(`c:${code}`);
      // Straight on to installing, so connecting is one continuous flow.
      completeMutate({ code, state }, { onSuccess: (s) => s.app && window.location.assign(s.app.install_url) });
    } else if (installationId && !handled.has(`i:${installationId}`)) {
      handled.add(`i:${installationId}`);
      registerMutate(installationId);
    }
  }, [signedIn, code, state, installationId, completeMutate, registerMutate]);

  return (
    <Container className="max-w-[860px] space-y-6">
      {complete.isPending && (
        <Callout icon="clock" title="Finishing the connection…">
          Saving the GitHub App’s keys, then taking you to GitHub to choose repositories.
        </Callout>
      )}
      {complete.error && (
        <Callout tone="err" icon="x-circle" title="Couldn't finish connecting GitHub">
          {complete.error.message}
        </Callout>
      )}
      {register.isPending && <Callout icon="clock">Checking the installation with GitHub…</Callout>}
      {register.error && (
        <Callout tone="err" icon="x-circle" title="Couldn't add the installation">
          {register.error.message}
        </Callout>
      )}
      {register.isSuccess && (
        <Callout tone="ok" icon="check-circle" title="GitHub is ready">
          <span className="flex flex-wrap items-center gap-3 text-muted">
            Your repositories now show up when you create an application.
            <ButtonLink href="/dashboard/applications/new" variant="primary" size="sm" iconRight="arrow-right">
              Import a repository
            </ButtonLink>
          </span>
        </Callout>
      )}
      <GitHubCard />
      <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <Icon name="arrow-left" size={14} /> All settings
      </Link>
    </Container>
  );
}
