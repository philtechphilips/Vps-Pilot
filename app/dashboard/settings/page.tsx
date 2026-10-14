import type { Metadata } from "next";
import { SessionsCard } from "@/components/auth/sessions-card";
import { TwoFactorCard } from "@/components/auth/two-factor-card";
import { BackupStorageCard } from "@/components/dashboard/backup-storage-card";
import { NotificationSettingsCard } from "@/components/dashboard/notification-settings";
import { GitHubCard } from "@/components/github/github-card";
import { Icon } from "@/components/icons";
import { Badge, Button, Card, Container, FormCard, Input, Label, Mono, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Settings" };

const sections = [
  { id: "general", label: "General" },
  { id: "security", label: "Security" },
  { id: "sessions", label: "Sessions" },
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
              className={`shrink-0 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/[0.06] hover:text-fg ${i === 0 ? "bg-white/[0.06] text-fg" : "text-muted"}`}
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="min-w-0 space-y-8">
          <div id="general" className="scroll-mt-20 space-y-8">
            <FormCard
              title="Control Plane Name"
              description="Shown in the browser title, emails and agent installer output."
              footer="Please use 32 characters at maximum."
              action={
                <Button variant="primary" size="sm">
                  Save
                </Button>
              }
            >
              <Input defaultValue="Personal" className="max-w-sm" />
            </FormCard>
            <FormCard
              title="Control Plane URL"
              description="Agents connect to this address over HTTPS. Changing it requires agents to be re-pointed."
              footer={
                <span className="flex items-center gap-1.5">
                  <Icon name="lock" size={13} /> Certificate valid until Dec 21, 2026
                </span>
              }
              action={
                <Button variant="primary" size="sm">
                  Save
                </Button>
              }
            >
              <div className="flex max-w-md overflow-hidden rounded-md border border-line-strong">
                <span className="flex items-center border-r border-line-strong bg-bg-200 px-3 text-sm text-subtle">https://</span>
                <input defaultValue="pilot.example.com" className="h-10 flex-1 bg-bg px-3 font-mono text-sm outline-none" aria-label="Control plane host" />
              </div>
            </FormCard>
          </div>

          <div id="security" className="scroll-mt-20 space-y-8">
            <TwoFactorCard />
            <FormCard
              title="Password"
              description="Changing your password signs out every other session."
              action={
                <Button variant="primary" size="sm">
                  Update Password
                </Button>
              }
            >
              <div className="grid max-w-xl gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cur">Current password</Label>
                  <Input id="cur" type="password" autoComplete="current-password" />
                </div>
                <div>
                  <Label htmlFor="new">New password</Label>
                  <Input id="new" type="password" autoComplete="new-password" />
                </div>
              </div>
            </FormCard>
          </div>

          <div id="sessions" className="scroll-mt-20">
            <SessionsCard />
          </div>

          <div id="enrollment" className="scroll-mt-20">
            <FormCard
              title="Enrollment Tokens"
              description="Single-use tokens for connecting new servers. Stored hashed; the value is shown only once when created."
              footer="Default lifetime: 15 minutes."
              action={
                <Button variant="primary" size="sm" icon="plus">
                  Create Token
                </Button>
              }
            >
              <div className="overflow-hidden rounded-md border border-line">
                {[
                  { id: "ept_5Kq9…3f9a", name: "web-prod-03", state: "Pending · expires in 12m", tone: "blue" as const },
                  { id: "ept_aP4r…Kk1z", name: "edge-jnb-01", state: "Redeemed Oct 3", tone: "ok" as const },
                  { id: "ept_Zz81…0qLe", name: "scratch-box", state: "Expired unused", tone: "neutral" as const },
                  { id: "ept_Lr0e…3Vtm", name: "staging-01", state: "Redeemed Sep 14", tone: "ok" as const },
                ].map((t) => (
                  <div key={t.id} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                    <Mono className="text-fg">{t.id}</Mono>
                    <span className="text-sm text-muted">{t.name}</span>
                    <Badge tone={t.tone} className="ml-auto">
                      {t.state}
                    </Badge>
                  </div>
                ))}
              </div>
            </FormCard>
          </div>

          <div id="git" className="scroll-mt-20">
            <GitHubCard />
          </div>

          <div id="notifications" className="scroll-mt-20">
            <NotificationSettingsCard />
          </div>

          <div id="storage" className="scroll-mt-20">
            <BackupStorageCard />
          </div>

          <div id="advanced" className="scroll-mt-20 space-y-8">
            <Card className="p-6">
              <h3 className="text-xl font-semibold tracking-tight">Version</h3>
              <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
                <span>
                  <span className="text-muted">Control plane</span> <Mono className="ml-2 text-fg">1.1.0</Mono>
                </span>
                <span>
                  <span className="text-muted">Latest agent</span> <Mono className="ml-2 text-fg">0.4.2</Mono>
                </span>
                <span>
                  <span className="text-muted">Schema</span> <Mono className="ml-2 text-fg">alembic 0b7f3c21</Mono>
                </span>
                <Badge tone="ok">Up to date</Badge>
              </div>
            </Card>
            <FormCard
              danger
              title="Reset Control Plane"
              description="Revokes every agent, deletes all metadata and encrypted credentials, and returns to first-run setup. Managed servers and their applications keep running."
              action={
                <Button variant="danger" size="sm">
                  Reset
                </Button>
              }
            />
          </div>
        </div>
      </Container>
    </>
  );
}
