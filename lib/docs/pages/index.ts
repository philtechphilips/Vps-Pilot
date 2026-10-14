import type { ComponentType } from "react";
import { Restore, S3Storage, DatabaseBackups } from "./backups";
import { Architecture, Jobs, Security } from "./concepts";
import { DataBrowser, DatabaseOverview, DatabaseUsers } from "./databases";
import { Applications, Builds, Environment, GitHub, Lifecycle } from "./deployments";
import { Domains, Logs, Monitoring, Notifications, Troubleshooting } from "./operations";
import { AgentCli, ApiAccess, ApplicationsApi, Configuration, DatabasesApi, DomainsApi, ServersApi } from "./reference";
import { ConnectServer, FirstDeploy, FirstRun, Install, Introduction } from "./start";

/** Page bodies by slug; titles and order live in lib/docs/nav.ts. */
export const pages: Record<string, ComponentType> = {
  "": Introduction,
  "getting-started/install": Install,
  "getting-started/first-run": FirstRun,
  "getting-started/connect-server": ConnectServer,
  "getting-started/first-deploy": FirstDeploy,
  "concepts/architecture": Architecture,
  "concepts/jobs": Jobs,
  "concepts/security": Security,
  "deployments/applications": Applications,
  "deployments/builds": Builds,
  "deployments/environment": Environment,
  "deployments/lifecycle": Lifecycle,
  "deployments/github": GitHub,
  "databases/overview": DatabaseOverview,
  "databases/data-browser": DataBrowser,
  "databases/users": DatabaseUsers,
  "backups/database-backups": DatabaseBackups,
  "backups/restore": Restore,
  "backups/s3-storage": S3Storage,
  "operations/domains": Domains,
  "operations/monitoring": Monitoring,
  "operations/logs": Logs,
  "operations/notifications": Notifications,
  "operations/troubleshooting": Troubleshooting,
  "reference/configuration": Configuration,
  "reference/agent": AgentCli,
  "reference/api": ApiAccess,
  "reference/servers-api": ServersApi,
  "reference/applications-api": ApplicationsApi,
  "reference/databases-api": DatabasesApi,
  "reference/domains-api": DomainsApi,
};
