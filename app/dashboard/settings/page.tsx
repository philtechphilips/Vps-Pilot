import type { Metadata } from "next";
import { SessionsCard } from "@/components/auth/sessions-card";
import { TwoFactorCard } from "@/components/auth/two-factor-card";
import { AlertChannelsCard } from "@/components/dashboard/alert-channels";
import { BackupStorageCard } from "@/components/dashboard/backup-storage-card";
import { EnrollmentTokensCard, PasswordCard, PlatformCards, RecoveryKitCard, VersionCard } from "@/components/dashboard/platform-settings";
import { NotificationSettingsCard } from "@/components/dashboard/notification-settings";
import { TeamCard } from "@/components/dashboard/team-card";
import { WeeklyReportCard } from "@/components/dashboard/weekly-report-card";
import { GitHubCard } from "@/components/github/github-card";
import { Container, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Settings" };

const sections = [
  { id: "general", label: "General" },
  { id: "security", label: "Security" },
  { id: "sessions", label: "Sessions" },
  { id: "team", label: "Team" },
  { id: "enrollment", label: "Enrollment Tokens" },
  { id: "git", label: "Git" },
  { id: "notifications", label: "Notifications" },
  { id: "storage", label: "Backup Storage" },
  { id: "advanced", label: "Advanced" },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <Container className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Settings sections" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-20 lg:mx-0 lg:h-fit lg:flex-col lg:px-0">
          {sections.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`shrink-0 rounded-md px-3 py-2 text-sm transition-colors hover:bg-black/[0.06] hover:text-fg ${i === 0 ? "bg-black/[0.06] text-fg" : "text-muted"}`}
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="min-w-0 space-y-8">
          <div id="general" className="scroll-mt-20 space-y-8">
            <PlatformCards />
          </div>

          <div id="security" className="scroll-mt-20 space-y-8">
            <TwoFactorCard />
            <PasswordCard />
            <RecoveryKitCard />
          </div>

          <div id="sessions" className="scroll-mt-20">
            <SessionsCard />
          </div>

          <div id="team" className="scroll-mt-20">
            <TeamCard />
          </div>

          <div id="enrollment" className="scroll-mt-20">
            <EnrollmentTokensCard />
          </div>

          <div id="git" className="scroll-mt-20">
            <GitHubCard />
          </div>

          <div id="notifications" className="scroll-mt-20 space-y-8">
            <NotificationSettingsCard />
            <AlertChannelsCard />
            <WeeklyReportCard />
          </div>

          <div id="storage" className="scroll-mt-20">
            <BackupStorageCard />
          </div>

          <div id="advanced" className="scroll-mt-20 space-y-8">
            <VersionCard />
          </div>
        </div>
      </Container>
    </>
  );
}
