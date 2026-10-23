import { A, C, Callout, CodeBlock, Endpoints, Fields, H2, H3, P, Table } from "@/components/docs/prose";

export function Configuration() {
  return (
    <>
      <P>
        The API reads its settings from environment variables, or from <C>.env</C>: <C>/opt/vpspilot/api/deploy/.env</C> on a self-hosted
        install (apply changes with <C>sudo vpspilot restart</C>), <C>be/.env</C> on a manual one. Names are case-insensitive. The
        dashboard only needs <C>API_URL</C>. The installer fills in everything you need.
      </P>

      <H2>Database</H2>
      <Fields
        rows={[
          ["DATABASE_HOSTNAME", "required", "PostgreSQL host."],
          ["DATABASE_PORT", "5432", "PostgreSQL port."],
          ["DATABASE_USERNAME", "required", "Login for the VPSPilot database."],
          ["DATABASE_PASSWORD", "required", "Password. Special characters are escaped for you."],
          ["DATABASE_NAME", "required", "Database name, for example vpspilot."],
        ]}
      />

      <H2>Keys</H2>
      <Fields
        rows={[
          ["SECRET_KEY", "required", <>Signs access tokens and keys the hashes of emailed codes. <C>openssl rand -hex 32</C>.</>],
          [
            "ENCRYPTION_KEY",
            "recommended",
            <>
              Encrypts stored secrets. Generate with <C>python -m app.encryption generate-key</C>. When empty, a key derived from{" "}
              <C>SECRET_KEY</C> is used.
            </>,
          ],
          ["ENCRYPTION_KEYS_PREVIOUS", "empty", "Comma-separated old keys, still accepted for decryption during a rotation."],
          ["ALGORITHM", "HS256", "JWT signing algorithm."],
        ]}
      />
      <Callout type="warning" title="Back up your keys">
        <p>
          Without <C>ENCRYPTION_KEY</C> (or <C>SECRET_KEY</C> if you rely on the derived key) the stored secrets, including the backup key, can’t
          be decrypted. Download the recovery kit from <strong>Settings → Security</strong> and keep it offline.
        </p>
      </Callout>

      <H2>Sessions and sign-in</H2>
      <Fields
        rows={[
          ["ACCESS_TOKEN_EXPIRE_MINUTES", "15", "Lifetime of bearer tokens."],
          ["REFRESH_TOKEN_EXPIRE_DAYS", "30", "Lifetime of the refresh cookie."],
          ["REFRESH_COOKIE_NAME", "vp_refresh", "Name of the refresh cookie."],
          ["COOKIE_SECURE", "false", "Set to true in production so the cookie is HTTPS-only."],
          ["PASSWORD_RESET_TOKEN_EXPIRE_MINUTES", "30", "Lifetime of reset links."],
          ["TWO_FACTOR_CODE_EXPIRE_MINUTES", "10", "Lifetime of emailed codes."],
          ["TWO_FACTOR_MAX_ATTEMPTS", "5", "Attempts per code."],
          ["TWO_FACTOR_RESEND_COOLDOWN_SECONDS", "30", "Wait before another code can be sent."],
          ["LOGIN_MAX_FAILED_ATTEMPTS", "5", "Wrong passwords before lockout."],
          ["LOGIN_LOCKOUT_MINUTES", "15", "Lockout duration."],
        ]}
      />

      <H2>Email</H2>
      <Fields
        rows={[
          ["RESEND_API_KEY", "empty", "Resend API key. When empty, emails are written to the log instead."],
          ["EMAIL_FROM", "VPSPilot <onboarding@resend.dev>", "Sender. Use an address on a domain verified with Resend."],
          ["EMAIL_OVERRIDE_TO", "empty", "Send every email to this address instead, with the real recipient in the subject. For testing."],
        ]}
      />

      <H2>Agents and monitoring</H2>
      <Fields
        rows={[
          ["AGENT_API_URL", "http://localhost:8000", "The URL agents use to reach the API. It is baked into install commands."],
          ["AGENT_HEARTBEAT_SECONDS", "10", "Heartbeat interval sent to agents."],
          ["AGENT_METRICS_SECONDS", "15", "Metrics interval sent to agents."],
          ["AGENT_OFFLINE_AFTER_SECONDS", "35", "Silence before a server is shown offline."],
          ["ENROLLMENT_TOKEN_EXPIRE_MINUTES", "15", "Lifetime of enrollment tokens."],
          ["METRICS_RETENTION_DAYS", "7", "How long raw metric samples (and database samples) are kept."],
          ["METRICS_ROLLUP_DAYS", "90", "How long hourly metric averages are kept, for 30- and 90-day charts."],
          ["ALERTS_EVALUATE_SECONDS", "30", "How often alert rules run. 0 disables the background loop, and with it scheduled backups."],
        ]}
      />

      <H2>Database transfers</H2>
      <Fields
        rows={[
          ["ARTIFACTS_DIR", "data/artifacts", "Where encrypted export and import files wait (a volume in the self-hosted install). Deleted after a day."],
          ["MAX_TRANSFER_MB", "1024", "Largest export or import file."],
        ]}
      />

      <H2>URLs</H2>
      <Fields
        rows={[
          ["FRONTEND_URL", "http://localhost:3000", "Dashboard URL, used in email links and as the Google Drive sign-in redirect."],
          ["PUBLIC_API_URL", "empty", "Public https URL for GitHub webhooks. Falls back to AGENT_API_URL when that is https."],
          ["CORS_ORIGINS", '["http://localhost:3000"]', "JSON list of browser origins allowed to call the API directly."],
        ]}
      />

      <H2>Dashboard</H2>
      <Fields rows={[["API_URL", "http://localhost:8000", <>Where the dashboard proxies <C>/api/*</C>. Read at build and start time.</>]]} />
    </>
  );
}

export function AgentCli() {
  return (
    <>
      <P>
        The agent is a Python package at <C>/opt/vpspilot-agent</C>. You rarely need to run it by hand, but these commands help when
        diagnosing a server.
      </P>

      <H2>Commands</H2>
      <H3>status</H3>
      <P>Prints the enrollment (control plane URL, server id and name) and the host facts the agent reports.</P>
      <CodeBlock code={`sudo -u vpspilot env PYTHONPATH=/opt/vpspilot-agent python3 -m vpspilot_agent status`} />
      <H3>enroll</H3>
      <P>Redeems an enrollment token and writes the config file. The installer runs this for you.</P>
      <CodeBlock
        code={`
sudo -u vpspilot env PYTHONPATH=/opt/vpspilot-agent python3 -m vpspilot_agent enroll \\
  --url https://pilot.example.com --token ept_... --config /etc/vpspilot/agent.json`}
      />
      <H3>run</H3>
      <P>The main loop: heartbeats, metrics, inventory and jobs. systemd runs it as the <C>vpspilot-agent</C> service.</P>

      <H2>Services</H2>
      <Table
        head={["Unit", "User", "Command"]}
        rows={[
          [<C key="a">vpspilot-agent</C>, "vpspilot", <C key="c">python3 -m vpspilot_agent run</C>],
          [<C key="h">vpspilot-helper</C>, "root", <C key="c">python3 -m vpspilot_agent.helper --socket /run/vpspilot/helper.sock</C>],
        ]}
      />
      <P>
        The agent exits with status <C>78</C> when its credential is revoked, and systemd is configured not to restart it in that case.
      </P>

      <H2>Config file</H2>
      <CodeBlock
        lang="json"
        title="/etc/vpspilot/agent.json (mode 0600)"
        code={`
{
  "api_url": "https://pilot.example.com",
  "server_id": "c1f04d…",
  "server_name": "web-1",
  "agent_token": "agt_…",
  "heartbeat_seconds": 10,
  "metrics_seconds": 15
}`}
      />

      <H2>Agent protocol</H2>
      <P>Agents authenticate with their <C>agt_</C> token as a bearer token. All calls are outbound from the server.</P>
      <Endpoints
        routes={[
          ["GET", "/agent/install.sh", "The installer script, with this control plane's URL filled in."],
          ["GET", "/agent/package.tar.gz", "The agent package the installer downloads."],
          ["POST", "/agent/v1/enroll", "Redeem an enrollment token for an agent token."],
          ["POST", "/agent/v1/heartbeat", "Liveness; the reply carries the agent's configuration."],
          ["POST", "/agent/v1/metrics", "A batch of metric samples."],
          ["POST", "/agent/v1/inventory", "Services, containers and listening ports."],
          ["POST", "/agent/v1/jobs/claim", "Claim the next queued job, if any."],
          ["GET", "/agent/v1/jobs/{id}/secrets", "Secrets for a claimed job."],
          ["PUT", "/agent/v1/jobs/{id}/artifact", "Upload a database export (streamed, encrypted on arrival)."],
          ["GET", "/agent/v1/jobs/{id}/artifact", "Download the file a database import loads."],
          ["POST", "/agent/v1/requests", "Per-site request counts from the proxy's access log."],
          ["POST", "/agent/v1/jobs/{id}/events", "Progress events."],
          ["POST", "/agent/v1/jobs/{id}/complete", "The job's result."],
        ]}
      />
    </>
  );
}

export function ApiAccess() {
  return (
    <>
      <P>
        Everything in the dashboard goes through the same JSON API under <C>/api/v1</C>. The interactive OpenAPI reference is served by the API
        at <C>/docs</C>.
      </P>

      <H2>Authentication</H2>
      <P>
        Requests carry a short-lived access token as a bearer token. Sign-in always takes two steps, because a second factor is required:
      </P>
      <CodeBlock
        code={`
# 1. Password: returns a challenge
curl -s -X POST https://pilot.example.com/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"…"}'
# → {"status":"two_factor_required","challenge_id":"8f1c…","method":"totp", …}

# 2. Code: returns an access token (and sets the refresh cookie)
curl -s -X POST https://pilot.example.com/api/v1/auth/2fa/verify \\
  -H "Content-Type: application/json" -c cookies.txt \\
  -d '{"challenge_id":"8f1c…","code":"123456"}'
# → {"status":"authenticated","access_token":"eyJ…","expires_in":900, …}

# 3. Call the API
curl -s https://pilot.example.com/api/v1/servers -H "Authorization: Bearer $TOKEN"`}
      />
      <P>
        Access tokens last 15 minutes. Exchange the refresh cookie for a new one with <C>POST /api/v1/auth/refresh</C>; the cookie rotates on
        every refresh. Management endpoints require an admin account.
      </P>

      <H2>Conventions</H2>
      <Table
        head={["Topic", "Behaviour"]}
        rows={[
          ["Format", "JSON requests and responses. Timestamps are ISO 8601 in UTC."],
          ["IDs", "32-character hexadecimal strings."],
          ["Errors", <>An HTTP status with <C key="d">{`{"detail": "…"}`}</C>. Validation errors (422) list each invalid field.</>],
          ["Pagination", <>Lists that can grow take <C key="l">limit</C> and <C key="b">before</C> (the last id you saw).</>],
          ["Secrets", "Write-only. Responses never include stored secret values."],
        ]}
      />

      <H2>Asynchronous operations</H2>
      <P>
        Anything that happens on a server returns <C>202 Accepted</C> with a job, because the work is done by the agent. Poll the job until it
        finishes:
      </P>
      <CodeBlock
        lang="http"
        code={`
POST /api/v1/databases/{id}/query          → 202 {"job_id": "a91e…"}
GET  /api/v1/databases/{id}/jobs/a91e…     → {"status": "running", "error": null, "data": null}
GET  /api/v1/databases/{id}/jobs/a91e…     → {"status": "succeeded", "error": null, "data": {…}}`}
      />
      <Table
        head={["Job status", "Meaning"]}
        rows={[
          ["queued", "Waiting for the agent."],
          ["running", "Claimed and in progress."],
          ["succeeded / failed", "Finished. Failed jobs carry an error."],
          ["canceled", "Canceled while queued."],
          ["expired", "Never claimed, usually because the server is offline."],
        ]}
      />

      <H2>Endpoint groups</H2>
      <Table
        head={["Prefix", "Reference"]}
        rows={[
          [<C key="a">/api/v1/auth</C>, "Sign-in, sessions, two-factor and password reset."],
          [<C key="s">/api/v1/servers, /api/v1/jobs</C>, <A key="l" href="/docs/reference/servers-api">Servers API</A>],
          [<C key="p">/api/v1/applications, /api/v1/deployments, /api/v1/github</C>, <A key="l" href="/docs/reference/applications-api">Applications API</A>],
          [<C key="d">/api/v1/databases, /api/v1/backups</C>, <A key="l" href="/docs/reference/databases-api">Databases API</A>],
          [<C key="m">/api/v1/domains, /api/v1/monitoring, /api/v1/logs, /api/v1/notifications, /api/v1/audit-logs</C>, <A key="l" href="/docs/reference/domains-api">Domains and Monitoring API</A>],
        ]}
      />
    </>
  );
}

export function ServersApi() {
  return (
    <>
      <H2>Servers</H2>
      <Endpoints
        routes={[
          ["GET", "/api/v1/servers", "List servers with status, facts and latest metrics."],
          ["POST", "/api/v1/servers/enrollments", <>Create a server and an enrollment token. Returns <C>install_command</C>.</>],
          ["GET", "/api/v1/servers/{id}", "Server detail with inventory."],
          ["GET", "/api/v1/servers/{id}/metrics?range=1h", <>Metric series for <C>1h</C>, <C>24h</C>, <C>7d</C>, <C>30d</C> or <C>90d</C> (hourly averages from 7d up).</>],
          ["POST", "/api/v1/servers/{id}/enrollments", "Issue a new enrollment token for a server that isn't enrolled yet."],
          ["POST", "/api/v1/servers/{id}/revoke", "Invalidate the agent credential immediately."],
          ["DELETE", "/api/v1/servers/{id}", "Delete a server record."],
        ]}
      />
      <H3>Create an enrollment</H3>
      <CodeBlock
        lang="http"
        code={`
POST /api/v1/servers/enrollments
{ "name": "web-1", "tags": ["prod", "eu"] }

201 Created
{
  "server": { "id": "c1f0…", "name": "web-1", "status": "pending", … },
  "token": "ept_…",
  "install_command": "curl -fsSL https://pilot.example.com/agent/install.sh | sudo bash -s -- --token ept_…",
  "expires_at": "2026-10-14T09:30:00Z"
}`}
      />

      <H2>Actions</H2>
      <P>Run a service or container operation on a server. The response is the queued job.</P>
      <Endpoints routes={[["POST", "/api/v1/servers/{id}/actions", "Queue an action."]]} />
      <CodeBlock
        lang="http"
        code={`
POST /api/v1/servers/{id}/actions
{
  "type": "service.restart",
  "payload": { "unit": "nginx.service" },
  "idempotency_key": "restart-nginx-2026-10-14"
}`}
      />
      <Fields
        rows={[
          ["service.start · service.stop · service.restart", "{ unit }", <>A systemd unit ending in <C>.service</C>.</>],
          ["service.logs", "{ unit, lines? }", "Last 1–500 lines, 200 by default."],
          ["container.start · container.stop · container.restart", "{ container }", "A container name."],
          ["container.logs", "{ container, lines? }", "Last 1–500 lines, 200 by default."],
          ["os.upgrade", "{ mode }", <><C>security</C> (unattended-upgrades) or <C>all</C> (apt-get upgrade). Agent 1.1.4+.</>],
          ["os.reboot", "{}", "Reboot the server in 10 seconds. Agent 1.1.4+."],
        ]}
      />

      <H2>Jobs</H2>
      <Endpoints
        routes={[
          ["GET", "/api/v1/jobs?server_id=&limit=30", "Recent jobs, newest first (up to 100)."],
          ["GET", "/api/v1/jobs/{id}", "A job with its events and output."],
          ["POST", "/api/v1/jobs/{id}/cancel", "Cancel a queued job."],
        ]}
      />
    </>
  );
}

export function ApplicationsApi() {
  return (
    <>
      <H2>Applications</H2>
      <Endpoints
        routes={[
          ["GET", "/api/v1/applications", "List applications."],
          ["POST", "/api/v1/applications", "Create an application, and deploy it unless deploy is false."],
          ["GET", "/api/v1/applications/{id}", "Application detail with current and latest deployment."],
          ["PATCH", "/api/v1/applications/{id}", "Update settings or environment. Applies on the next deploy."],
          ["DELETE", "/api/v1/applications/{id}", "Remove the container and the application."],
        ]}
      />
      <H3>Create from Git</H3>
      <CodeBlock
        lang="http"
        code={`
POST /api/v1/applications
{
  "name": "web",
  "server_id": "c1f0…",
  "source": { "type": "git", "installation_id": 5512, "repo_id": 81723, "branch": "main" },
  "container_port": 3000,
  "health_path": "/api/health",
  "env": [{ "key": "NODE_ENV", "value": "production" }],
  "auto_deploy": true
}`}
      />
      <H3>Create from an image</H3>
      <CodeBlock
        lang="http"
        code={`
POST /api/v1/applications
{
  "name": "umami",
  "server_id": "c1f0…",
  "source": { "type": "image", "image": "ghcr.io/umami-software/umami:postgresql-latest" },
  "container_port": 3000,
  "memory_limit": "512m"
}`}
      />
      <P>
        Every field is described in <A href="/docs/deployments/applications">Applications</A>.
      </P>

      <H2>Deployments</H2>
      <Endpoints
        routes={[
          ["POST", "/api/v1/applications/{id}/deployments", <>Deploy. Optional <C>ref</C>: a branch, tag or commit, or an image reference.</>],
          ["GET", "/api/v1/applications/{id}/deployments", "Deployments of one application."],
          ["GET", "/api/v1/deployments", "Recent deployments across all applications."],
          ["GET", "/api/v1/deployments/{id}", "Deployment detail with spec, events and output."],
          ["POST", "/api/v1/deployments/{id}/rollback", "Re-release this deployment's image (or kept release, for systemd and Compose apps)."],
        ]}
      />

      <H2>Logs</H2>
      <Endpoints
        routes={[
          ["POST", "/api/v1/applications/{id}/logs", <>Request container logs: <C>lines</C> (1–1000), optional <C>since</C> to follow.</>],
          ["GET", "/api/v1/applications/{id}/logs/{job_id}", "Read the result: lines, container state, start time and restarts."],
          ["GET", "/api/v1/applications/{id}/requests?range=", <>Traffic through the app&apos;s domains: <C>1h</C>, <C>24h</C> or <C>7d</C>.</>],
        ]}
      />
      <H2>Scheduled jobs</H2>
      <Endpoints
        routes={[
          ["GET", "/api/v1/applications/{id}/cron", "The app's scheduled jobs."],
          ["POST", "/api/v1/applications/{id}/cron", <><C>name</C>, <C>schedule</C> (cron or @daily…), <C>timezone</C>, <C>command</C>, <C>timeout_minutes</C>, <C>enabled</C>.</>],
          ["PATCH", "/api/v1/applications/{id}/cron/{cron_id}", "Change any of those."],
          ["POST", "/api/v1/applications/{id}/cron/{cron_id}/run", "Run now; returns the job."],
          ["DELETE", "/api/v1/applications/{id}/cron/{cron_id}", "Delete it."],
        ]}
      />

      <H2>GitHub</H2>
      <Endpoints
        routes={[
          ["GET", "/api/v1/github/status", "Whether an app is connected, and its installations."],
          ["POST", "/api/v1/github/manifest", "Start the app manifest flow."],
          ["POST", "/api/v1/github/manifest/complete", "Finish it with the code GitHub returned."],
          ["POST", "/api/v1/github/installations", "Record an installation after GitHub redirects back."],
          ["GET", "/api/v1/github/repositories", "Repositories the app can access."],
          ["GET", "/api/v1/github/repositories/{installation_id}/{repo_id}/branches", "Branches of a repository."],
          ["DELETE", "/api/v1/github/app", "Disconnect the GitHub App."],
        ]}
      />
    </>
  );
}

export function DatabasesApi() {
  return (
    <>
      <H2>Instances</H2>
      <Endpoints
        routes={[
          ["GET", "/api/v1/databases/engines", "Engines, versions and default ports."],
          ["GET", "/api/v1/databases", "List instances."],
          ["POST", "/api/v1/databases", "Create a managed instance."],
          ["POST", "/api/v1/databases/external", "Register an external instance."],
          ["GET", "/api/v1/databases/{id}", "Instance detail."],
          ["DELETE", "/api/v1/databases/{id}", "Remove an instance."],
          ["POST", "/api/v1/databases/{id}/control", <>Body <C>{`{"action": "start" | "stop" | "restart"}`}</C>.</>],
          ["GET", "/api/v1/databases/{id}/connection", "Logins with passwords and connection URLs. Audited."],
          ["GET", "/api/v1/databases/{id}/jobs/{job_id}", "Result of any asynchronous call below."],
        ]}
      />
      <CodeBlock
        lang="http"
        code={`
POST /api/v1/databases
{ "name": "main", "server_id": "c1f0…", "engine": "postgres", "version": "17", "database": "app" }`}
      />

      <H2>Data</H2>
      <Endpoints
        routes={[
          ["POST", "/api/v1/databases/{id}/query", <><C>sql</C>, <C>database</C>, <C>readonly</C> (default true), <C>max_rows</C> (1–1000).</>],
          ["POST", "/api/v1/databases/{id}/explore", <><C>what</C>: databases, users, stats, tables or columns.</>],
          ["POST", "/api/v1/databases/{id}/redis", <><C>action</C>: info, scan, get, delete or acl_list.</>],
          ["GET", "/api/v1/databases/{id}/metrics?hours=", "History samples: connections, size, memory, keys, ops/s."],
          ["POST", "/api/v1/databases/{id}/export", <>Dump one <C>database</C> as .sql.gz. Returns a job id.</>],
          ["GET", "/api/v1/databases/{id}/exports/{job_id}", "Download a finished export. Audited."],
          ["POST", "/api/v1/databases/{id}/import?database=", "Upload a .sql, .sql.gz or pg_dump file as the request body."],
          ["PUT", "/api/v1/databases/{id}/tls", <>External databases: <C>tls_mode</C> and optional <C>ca</C>.</>],
        ]}
      />

      <H2>Databases and users</H2>
      <Endpoints
        routes={[
          ["POST", "/api/v1/databases/{id}/databases", <>Create a database: <C>name</C>, optional <C>owner</C>.</>],
          ["DELETE", "/api/v1/databases/{id}/databases/{name}", "Drop a database."],
          ["POST", "/api/v1/databases/{id}/users", <>Create a login: <C>username</C>, <C>database</C>, <C>access</C> (Redis: <C>key_pattern</C>).</>],
          ["POST", "/api/v1/databases/{id}/users/{credential_id}/rotate", "Set a new random password."],
          ["DELETE", "/api/v1/databases/{id}/users/{username}", "Drop a login."],
          ["POST", "/api/v1/databases/{id}/attach", <>Attach to an app: <C>application_id</C>, <C>env_key</C>.</>],
        ]}
      />

      <H2>Backups</H2>
      <Endpoints
        routes={[
          ["GET", "/api/v1/backups", "Backup runs, newest first."],
          ["GET", "/api/v1/backups/summary", "Totals: backup count and size, recent failures and verified backups."],
          ["GET", "/api/v1/backups/policies", "Every instance's policy."],
          ["PUT", "/api/v1/backups/policies/{instance_id}", <><C>enabled</C>, <C>every_hours</C>, <C>keep</C>, <C>databases</C>.</>],
          ["POST", "/api/v1/backups/run", <>Back up now: <C>instance_id</C>, optional <C>database</C>.</>],
          ["POST", "/api/v1/backups/{run_id}/verify", "Test-restore into a throwaway database."],
          ["POST", "/api/v1/backups/{run_id}/restore", <><C>mode</C>: replace or new, with <C>into</C>.</>],
          ["DELETE", "/api/v1/backups/{run_id}", "Delete the backup locally and in storage."],
          ["GET", "/api/v1/backups/jobs/{job_id}", "Status of a backup job."],
          ["GET", "/api/v1/backups/settings", "Storage settings, without secrets."],
          ["PUT", "/api/v1/backups/settings", "Update storage settings."],
          ["POST", "/api/v1/backups/settings/test?server_id=", "Test storage from a server."],
          ["POST", "/api/v1/backups/gdrive/connect", "Start Google sign-in; returns the consent URL."],
          ["DELETE", "/api/v1/backups/gdrive/connection", "Disconnect Google Drive and revoke access."],
          ["GET", "/api/v1/backups/apps/{app_id}/policy", "An app's file backup schedule."],
          ["PUT", "/api/v1/backups/apps/{app_id}/policy", <><C>enabled</C>, <C>every_hours</C>, <C>keep</C>.</>],
          ["POST", "/api/v1/backups/apps/{app_id}/run", "Back up the app's files now."],
        ]}
      />
    </>
  );
}

export function DomainsApi() {
  return (
    <>
      <H2>Domains</H2>
      <Endpoints
        routes={[
          ["GET", "/api/v1/domains?application_id=", "List domains, optionally for one application."],
          ["POST", "/api/v1/domains", <><C>hostname</C>, <C>application_id</C>, <C>tls_mode</C>, <C>redirect_www</C>.</>],
          ["PATCH", "/api/v1/domains/{id}", <>Change <C>tls_mode</C>.</>],
          ["DELETE", "/api/v1/domains/{id}", "Remove a domain and re-apply the proxy."],
          ["POST", "/api/v1/domains/{id}/check", "Re-check DNS and refresh certificate status."],
          ["GET", "/api/v1/domains/{id}/uptime?range=", <>Uptime checks: availability, response times and recent failures for <C>24h</C>, <C>7d</C> or <C>30d</C>.</>],
          ["POST", "/api/v1/domains/servers/{server_id}/apply", "Re-apply the whole proxy config on a server."],
        ]}
      />
      <CodeBlock lang="http" code={`POST /api/v1/domains\n{ "hostname": "app.example.com", "application_id": "9ab2…", "tls_mode": "auto", "redirect_www": true }`} />

      <H2>Monitoring</H2>
      <Endpoints
        routes={[
          ["GET", "/api/v1/monitoring/fleet?range=1h", <>Metric series for every server, plus a summary. <C>range</C>: 1h, 24h, 7d, 30d or 90d.</>],
          ["GET", "/api/v1/monitoring/alerts?state=open", <>Alerts: <C>open</C>, <C>resolved</C> or <C>all</C>.</>],
          ["POST", "/api/v1/monitoring/alerts/{id}/acknowledge", "Acknowledge an open alert."],
          ["POST", "/api/v1/monitoring/alerts/{id}/snooze", <><C>{`{"minutes": 60}`}</C> holds back its notifications; <C>null</C> wakes it.</>],
          ["GET", "/api/v1/monitoring/maintenance", "Maintenance windows on now or coming up."],
          ["POST", "/api/v1/monitoring/maintenance", <><C>minutes</C>, optional <C>server_id</C> or <C>application_id</C>, <C>reason</C>.</>],
          ["DELETE", "/api/v1/monitoring/maintenance/{id}", "End a window now."],
          ["POST", "/api/v1/monitoring/evaluate", "Evaluate all rules now."],
          ["GET", "/api/v1/monitoring/rules", "Alert rules."],
          ["POST", "/api/v1/monitoring/rules", <>Create a rule of a given <C>kind</C>.</>],
          ["PATCH", "/api/v1/monitoring/rules/{id}", "Change threshold, duration, severity or enabled."],
          ["DELETE", "/api/v1/monitoring/rules/{id}", "Delete a rule."],
        ]}
      />
      <P>
        Rule kinds: <C>agent_offline</C>, <C>cpu_high</C>, <C>memory_high</C>, <C>disk_high</C>, <C>inode_high</C>, <C>swap_high</C>,{" "}
        <C>updates_pending</C>, <C>app_down</C>, <C>app_errors</C>, <C>error_rate</C>, <C>site_down</C>, <C>tls_expiring</C>,{" "}
        <C>backup_stale</C>. App rules take an optional <C>application_id</C>.
      </P>

      <H2>Logs</H2>
      <Endpoints
        routes={[
          ["GET", "/api/v1/logs/sources?server_id=", "Units and containers that can be read on a server."],
          ["POST", "/api/v1/logs", "Request a read; returns a job."],
          ["GET", "/api/v1/logs/{job_id}", "The lines, and a cursor to follow from."],
        ]}
      />
      <CodeBlock
        lang="http"
        code={`
POST /api/v1/logs
{ "server_id": "c1f0…", "source": "journal", "unit": "nginx.service", "lines": 200, "priority": 4 }`}
      />

      <H2>Notifications and audit</H2>
      <Endpoints
        routes={[
          ["GET", "/api/v1/notifications", "Your inbox, with the unread count."],
          ["POST", "/api/v1/notifications/read", "Mark notifications as read."],
          ["GET", "/api/v1/notifications/settings", "Your email preferences."],
          ["PUT", "/api/v1/notifications/settings", <><C>email_deploy_success</C>, <C>email_deploy_failure</C>, <C>email_alerts</C>.</>],
          ["GET", "/api/v1/notifications/channels", "Alert channels (destinations are never returned)."],
          ["POST", "/api/v1/notifications/channels", <><C>kind</C> (slack, telegram, webhook), <C>name</C>, <C>config</C>, <C>events</C>. Webhooks return their signing secret once.</>],
          ["PATCH", "/api/v1/notifications/channels/{id}", "Change name, events, enabled or destination."],
          ["POST", "/api/v1/notifications/channels/{id}/test", "Send a test message now."],
          ["DELETE", "/api/v1/notifications/channels/{id}", "Delete a channel."],
          ["GET", "/api/v1/platform", "Control plane name, public URL, versions and schema."],
          ["POST", "/api/v1/platform/recovery-kit", <>Download the recovery kit; body <C>{`{"password": "…"}`}</C>. Audited.</>],
          ["GET", "/api/v1/audit-logs?limit=50&before=&action=", "Audit entries, newest first."],
        ]}
      />
    </>
  );
}
