// Docs navigation and page metadata. Shared by the server page, the sidebar
// and the ⌘K search, so it holds no JSX: page bodies live in lib/docs/pages.

export type DocMeta = {
  slug: string; // "" is /docs
  title: string;
  description: string;
  keywords?: string;
};

export type DocSection = { title: string; pages: DocMeta[] };

export const sections: DocSection[] = [
  {
    title: "Start here",
    pages: [
      {
        slug: "",
        title: "Introduction",
        description: "What VPSPilot is, what it manages, and how the pieces fit together.",
        keywords: "overview about control plane",
      },
      {
        slug: "getting-started/install",
        title: "Install VPSPilot",
        description: "Install the dashboard, API and database on your server with one command, behind HTTPS.",
        keywords: "setup requirements install.sh domain https docker vpspilot upgrade backup nginx apache self-host",
      },
      {
        slug: "getting-started/first-run",
        title: "First-run Setup",
        description: "Create the owner account, verify your email and turn on two-factor authentication.",
        keywords: "onboarding owner 2fa totp recovery codes setup wizard",
      },
      {
        slug: "getting-started/connect-server",
        title: "Connect a Server",
        description: "Enroll an Ubuntu or Debian host with a one-line agent install.",
        keywords: "agent enroll install.sh token ept curl sudo",
      },
      {
        slug: "getting-started/first-deploy",
        title: "First Deployment",
        description: "Deploy an application from a Git repository and put it behind a domain.",
        keywords: "quickstart tutorial deploy app domain",
      },
    ],
  },
  {
    title: "Core concepts",
    pages: [
      {
        slug: "concepts/architecture",
        title: "Architecture",
        description: "The control plane, the agent and the privileged helper, and how they talk.",
        keywords: "design outbound heartbeat helper socket",
      },
      {
        slug: "concepts/jobs",
        title: "Jobs and Operations",
        description: "Every change on a server is a typed, audited job from a fixed allowlist.",
        keywords: "job queue claim allowlist payload events",
      },
      {
        slug: "concepts/security",
        title: "Security Model",
        description: "What runs as root, how secrets are stored, and what VPSPilot will refuse to do.",
        keywords: "threat model encryption secrets root least privilege",
      },
    ],
  },
  {
    title: "Deployments",
    pages: [
      {
        slug: "deployments/applications",
        title: "Applications",
        description: "Docker, systemd and Compose apps: sources, ports, health checks and resource limits.",
        keywords: "app source image git port health check cpu memory runtime systemd native compose node python",
      },
      {
        slug: "deployments/builds",
        title: "Builds and Buildpacks",
        description: "How repositories without a Dockerfile are detected and built.",
        keywords: "dockerfile buildpack node python go rust bun static procfile",
      },
      {
        slug: "deployments/environment",
        title: "Environment Variables",
        description: "Plain and secret variables, and the values VPSPilot sets for you.",
        keywords: "env secret PORT DATABASE_URL",
      },
      {
        slug: "deployments/lifecycle",
        title: "Deployment Lifecycle",
        description: "Candidates, health-checked releases, rollbacks and clean-up, for every runtime.",
        keywords: "rollback candidate release health swap",
      },
      {
        slug: "deployments/github",
        title: "GitHub Integration",
        description: "Connect a GitHub App, pick repositories and deploy on every push.",
        keywords: "github app manifest webhook auto deploy push",
      },
    ],
  },
  {
    title: "Databases",
    pages: [
      {
        slug: "databases/overview",
        title: "Database Overview",
        description: "Managed and external instances for PostgreSQL, MySQL, MariaDB and Redis, TLS and history.",
        keywords: "postgres mysql mariadb redis managed external engine tls ssl ca localhost metrics history",
      },
      {
        slug: "databases/data-browser",
        title: "Data Browser and Queries",
        description: "Explore schemas, run SQL, inspect Redis keys, and import or export whole databases.",
        keywords: "sql query explore tables columns redis scan readonly import export dump migrate",
      },
      {
        slug: "databases/users",
        title: "Users and Attaching",
        description: "Create databases and logins (Redis too), rotate passwords and wire a database into an app.",
        keywords: "user role credential rotate attach DATABASE_URL redis acl login",
      },
    ],
  },
  {
    title: "Storage and backups",
    pages: [
      {
        slug: "backups/database-backups",
        title: "Database Backups",
        description: "Schedules, retention and what a backup contains.",
        keywords: "backup schedule retention dump encrypt aes",
      },
      {
        slug: "backups/restore",
        title: "Restore and Verify",
        description: "Restore over a database or into a new one, and prove a backup restores.",
        keywords: "restore verify replace new",
      },
      {
        slug: "backups/s3-storage",
        title: "Off-server Storage",
        description: "Copy encrypted backups to Cloudflare R2, S3-compatible storage or Google Drive, and keep the recovery kit.",
        keywords: "s3 r2 cloudflare backblaze b2 wasabi spaces minio bucket google drive offsite storage recovery kit decrypt",
      },
    ],
  },
  {
    title: "Operations",
    pages: [
      {
        slug: "operations/domains",
        title: "Domains and TLS",
        description: "Route hostnames to apps through Caddy with automatic certificates.",
        keywords: "domain caddy tls https certificate lets encrypt dns redirect www",
      },
      {
        slug: "operations/monitoring",
        title: "Monitoring and Alerts",
        description: "Host metrics up to 90 days, app traffic, alert rules and incidents.",
        keywords: "metrics cpu memory disk alert rule incident threshold traffic requests latency rollup",
      },
      {
        slug: "operations/logs",
        title: "Logs",
        description: "Read the systemd journal and container output from any server.",
        keywords: "journal journalctl container logs follow",
      },
      {
        slug: "operations/notifications",
        title: "Notifications and Audit",
        description: "Inbox, email, Slack, Telegram and webhook alerts, and the audit trail of every action.",
        keywords: "email notification audit log trail slack telegram webhook channel hmac signature",
      },
      {
        slug: "operations/troubleshooting",
        title: "Troubleshooting",
        description: "Fixes for offline agents, failed deploys, certificates and email.",
        keywords: "debug offline error failed help faq",
      },
    ],
  },
  {
    title: "Reference",
    pages: [
      {
        slug: "reference/configuration",
        title: "Configuration",
        description: "Every control-plane environment variable.",
        keywords: "env .env settings SECRET_KEY ENCRYPTION_KEY AGENT_API_URL",
      },
      {
        slug: "reference/agent",
        title: "Agent CLI",
        description: "Agent commands, files, services and upgrades.",
        keywords: "vpspilot_agent enroll run status systemd journalctl upgrade",
      },
      {
        slug: "reference/api",
        title: "API Access",
        description: "Authentication, conventions and asynchronous jobs.",
        keywords: "rest bearer token 202 accepted openapi",
      },
      {
        slug: "reference/servers-api",
        title: "Servers API",
        description: "Enrollment, server detail, metrics, actions and jobs.",
        keywords: "servers enrollments metrics actions jobs endpoint",
      },
      {
        slug: "reference/applications-api",
        title: "Applications API",
        description: "Applications, deployments, rollbacks and logs.",
        keywords: "applications deployments rollback endpoint",
      },
      {
        slug: "reference/databases-api",
        title: "Databases API",
        description: "Instances, queries, users and backups.",
        keywords: "databases query users backups endpoint",
      },
      {
        slug: "reference/domains-api",
        title: "Domains and Monitoring API",
        description: "Domains, alert rules, alerts, logs and notifications.",
        keywords: "domains monitoring alerts rules logs endpoint",
      },
    ],
  },
];

export const allDocs: (DocMeta & { section: string })[] = sections.flatMap((s) =>
  s.pages.map((p) => ({ ...p, section: s.title })),
);

export const docHref = (slug: string) => (slug ? `/docs/${slug}` : "/docs");

export function findDoc(slug: string) {
  const i = allDocs.findIndex((d) => d.slug === slug);
  if (i === -1) return null;
  return { doc: allDocs[i], prev: allDocs[i - 1] ?? null, next: allDocs[i + 1] ?? null };
}
