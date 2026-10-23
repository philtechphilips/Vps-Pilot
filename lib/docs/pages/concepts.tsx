import { JobStatesDiagram } from "@/components/docs/diagrams";
import { A, C, Callout, CodeBlock, H2, H3, Ol, P, Table, Ul } from "@/components/docs/prose";

export function Architecture() {
  return (
    <>
      <P>
        VPSPilot is split into a central control plane that holds the desired state and an agent on every server that carries it out. They
        are deliberately asymmetric: the control plane never connects to a server, and a server can only ask for work it is allowed to do.
      </P>

      <H2>Control plane</H2>
      <P>
        A FastAPI application backed by PostgreSQL. It owns users and sessions, servers and their metrics, applications and deployments,
        databases, domains, alert rules, backups and the audit log. It also runs a background loop, inside the API process, that evaluates
        alert rules every 30 seconds and starts scheduled backups.
      </P>
      <P>
        The Next.js dashboard is a client of the same API. It proxies <C>/api/*</C> to the API, so everything the dashboard does is also
        available to scripts. See <A href="/docs/reference/api">API Access</A>.
      </P>

      <H2>Agent</H2>
      <P>
        A small Python program, standard library plus <C>psutil</C>, that runs as the unprivileged <C>vpspilot</C> user. On its own schedule
        it:
      </P>
      <Table
        head={["Loop", "Every", "What it sends"]}
        rows={[
          ["Heartbeat", "10 s", "Liveness and agent version. The reply carries configuration such as intervals."],
          ["Metrics", "15 s", "CPU, memory, swap, disk, inodes, load and network counters."],
          ["Inventory", "60 s", "systemd services, Docker containers and listening ports."],
          ["Job claim", "3 s", "Asks for the next queued job for this server."],
        ]}
      />
      <P>
        If the control plane is unreachable, the agent backs off and buffers up to 120 metric samples (about 30 minutes) to send when it
        reconnects. A server with no heartbeat for 35 seconds is shown as offline.
      </P>

      <H2>Privileged helper</H2>
      <P>
        Some work needs root: restarting a service, running Docker, reading the journal. That is the job of <C>vpspilot-helper</C>, the only
        part of VPSPilot that runs as root. It listens on <C>/run/vpspilot/helper.sock</C>, readable only by the <C>vpspilot</C> group, checks
        the caller’s credentials on every connection, and performs exactly one operation from a fixed list per request.
      </P>
      <Callout type="security">
        <p>
          The helper has no “run this command” operation. Every operation builds an argument list in code from validated inputs; nothing goes
          through a shell.
        </p>
      </Callout>

      <H2>How a change reaches a server</H2>
      <Ol>
        <li>You act in the dashboard, for example by deploying an app. The API validates the request and records a job for that server.</li>
        <li>Within a few seconds the server’s agent claims the job.</li>
        <li>The agent checks the job type and payload again and passes it to the helper.</li>
        <li>The helper validates the arguments a third time and runs the operation, streaming progress events back.</li>
        <li>The agent reports the outcome. The control plane updates the deployment, database or domain and notifies you.</li>
      </Ol>
      <P>
        Secrets a job needs, such as environment variables or database passwords, are not stored in the job. The agent fetches them through a
        separate channel just before running it. See <A href="/docs/concepts/jobs">Jobs and Operations</A>.
      </P>

      <H2>Docker on the server</H2>
      <P>
        Applications, managed databases and the reverse proxy are all Docker containers on a private bridge network called <C>vpspilot</C>.
        Containers reach each other by name:
      </P>
      <Table
        head={["Container", "Name pattern"]}
        rows={[
          ["Application", <C key="a">vp-&lt;app&gt;</C>],
          ["Compose app", <><C key="c">vp-&lt;app&gt;-&lt;service&gt;-1</C>, the public service also as <C key="c2">vp-&lt;app&gt;</C></>],
          ["Managed database", <C key="d">vpdb-&lt;name&gt;</C>],
          ["Reverse proxy (Caddy)", <C key="p">vpspilot-proxy</C>],
          ["Self-hosted control plane", <C key="cp">vpspilot-api, vpspilot-web, vpspilot-db</C>],
        ]}
      />
      <P>
        Containers whose names start with <C>vpspilot-</C> can&apos;t be stopped from the dashboard, so you can&apos;t cut yourself off.
        Native (systemd) apps run outside Docker as <C>vp-&lt;app&gt;.service</C>.
      </P>
    </>
  );
}

export function Jobs() {
  return (
    <>
      <P>
        A job is one operation on one server: restart a service, deploy an app, run a query, apply the proxy config. Jobs are the only way the
        control plane changes anything on a host, which keeps every change typed, queued, observable and audited.
      </P>

      <H2>Job lifecycle</H2>
      <JobStatesDiagram />
      <Ul>
        <li>An agent runs one job at a time, in a worker thread, so heartbeats keep flowing during long builds.</li>
        <li>Progress is streamed as events (steps, info, warnings, errors) that the dashboard shows live.</li>
        <li>Job output is encrypted at rest. Log reads are disposable and deleted after an hour.</li>
        <li>
          A job can be canceled while it is still queued. Actions accept an <C>idempotency_key</C> so a retried request doesn’t queue the same
          work twice.
        </li>
      </Ul>

      <H2>The operation allowlist</H2>
      <P>Every job type has a strict payload schema with no extra fields allowed. The same list is enforced by the API, the agent and the helper.</P>
      <Table
        head={["Group", "Job types"]}
        rows={[
          ["Services", <C key="s">service.start · service.stop · service.restart · service.logs</C>],
          ["Containers", <C key="c">container.start · container.stop · container.restart · container.logs</C>],
          ["Applications", <C key="a">app.deploy · app.remove · app.logs · app.exec</C>],
          ["Databases", <C key="d">db.create · db.remove · db.control · db.query · db.explore · db.admin · db.redis · db.export · db.import</C>],
          ["Backups", <C key="b">backup.create · backup.restore · backup.files · backup.files_restore · backup.delete · backup.storage_test</C>],
          ["System", <C key="o">os.upgrade · os.reboot</C>],
          ["Proxy", <C key="p">proxy.apply · proxy.status</C>],
          ["Logs", <C key="l">logs.read</C>],
        ]}
      />

      <H3>Protected services</H3>
      <P>
        Some actions are refused even with valid input, because they would cut VPSPilot or you off from the server:
      </P>
      <Ul>
        <li>
          <C>vpspilot-agent.service</C> and <C>vpspilot-helper.service</C> can’t be stopped or restarted from the dashboard.
        </li>
        <li>
          <C>ssh.service</C> and <C>sshd.service</C> can be restarted but never stopped.
        </li>
      </Ul>

      <H2>Job secrets</H2>
      <P>
        Passwords, environment values, SQL text and backup keys never appear in a job payload. When the agent starts a job that needs them, it
        requests them from <C>/agent/v1/jobs/&#123;id&#125;/secrets</C> with its own credential. The helper passes them to child processes
        through stdin or environment variables, never as command-line arguments that other users could read in the process list.
      </P>
    </>
  );
}

export function Security() {
  return (
    <>
      <P>
        VPSPilot holds the keys to your servers, so it is designed so that a compromise of any one part gives as little as possible. This page
        describes what each part can do and how secrets are handled.
      </P>

      <H2>Network exposure</H2>
      <Ul>
        <li>Agents connect out over HTTPS. Nothing listens on your servers for VPSPilot.</li>
        <li>The API only needs to be reachable by browsers (through the dashboard) and by agents.</li>
        <li>The helper’s Unix socket is local and restricted to the <C>vpspilot</C> group.</li>
      </Ul>

      <H2>Least privilege on the server</H2>
      <Table
        head={["Component", "Privileges"]}
        rows={[
          [
            "Agent",
            "Unprivileged user, NoNewPrivileges, ProtectSystem=strict, read-only home, write access only to /var/lib/vpspilot and /etc/vpspilot.",
          ],
          ["Helper", "Root, but only a fixed set of operations with validated arguments. No shell, no arbitrary commands. Job secrets never reach its log."],
          ["Native (systemd) apps", "Each app runs, and builds, as its own system user in a hardened unit: read-only system, private /tmp, no new privileges, no capabilities."],
          ["Scheduled jobs", "Run inside the app: its container, or its own user and sandbox. Never on the server as root."],
          ["Compose apps", "Privileged mode, host namespaces, devices, binds outside the repository, the Docker socket and external volumes are refused."],
          ["Repository content", "Treated as untrusted. Files are read with size limits; anything copied into a generated Dockerfile must match strict patterns."],
        ]}
      />

      <H2>Credentials and tokens</H2>
      <Table
        head={["Credential", "Lifetime", "Stored as"]}
        rows={[
          [<C key="e">ept_…</C>, "Single use, 15 minutes", "Hash"],
          [<C key="a">agt_…</C>, "Until revoked", "Hash on the control plane, 0600 file on the server"],
          ["Access token", "15 minutes", "Memory only in the browser"],
          ["Refresh token", "30 days, rotates on use", "Hash; httpOnly SameSite=Lax cookie scoped to /api/v1/auth"],
          ["Recovery codes", "Single use", "Hash"],
          ["GitHub repo token", "One deployment", "Not stored; minted per deploy, read-only, single repository"],
          ["Google Drive", "Refresh token until disconnected", "Encrypted; backup jobs get an access token valid about an hour"],
        ]}
      />

      <H2>Secrets at rest</H2>
      <P>
        Environment variables, database passwords, authenticator secrets, GitHub App keys, storage keys and Google tokens, alert channel
        destinations, backup keys and job output are encrypted with <C>ENCRYPTION_KEY</C> before they reach the database. Database exports and
        imports in transit are encrypted with AES-GCM and deleted within a day. Secret values are write-only in the dashboard: once saved,
        they are never sent back to the browser.
      </P>
      <H3>Rotating the encryption key</H3>
      <CodeBlock
        code={`
# 1. Generate a new key
uv run python -m app.encryption generate-key

# 2. Set ENCRYPTION_KEY to the new key and move the old one
#    into ENCRYPTION_KEYS_PREVIOUS, then restart the API

# 3. Re-encrypt every stored secret with the new key
uv run python -m app.encryption rotate`}
      />
      <P>
        On a self-hosted install, edit <C>/opt/vpspilot/api/deploy/.env</C>, run <C>sudo vpspilot restart</C>, then{" "}
        <C>sudo docker exec vpspilot-api python -m app.encryption rotate</C>. Download a new recovery kit afterwards.
      </P>

      <H2>Backups</H2>
      <P>
        Each backup is encrypted with AES-256 on the server before it is written to disk or uploaded. The key is held by the control plane,
        encrypted at rest, and handed to the agent only for the job that needs it. A copy of your bucket alone can’t be read, so keep the{" "}
        <A href="/docs/backups/s3-storage#the-recovery-kit">recovery kit</A> offline: without it, neither can you if the control plane is lost.
      </P>

      <H2>Roles</H2>
      <Table
        head={["Role", "Can"]}
        rows={[
          ["Admin", "Everything."],
          ["Viewer", "See everything except secrets: database passwords, exports, query results and the list of users. Read logs. Change nothing."],
        ]}
      />

      <H2>Audit trail</H2>
      <P>
        Every change, from deployments and database actions to domain edits, server revocations and settings changes, is written to the audit
        log with who did it, from which IP, and when. See <A href="/docs/operations/notifications">Notifications and Audit</A>.
      </P>
    </>
  );
}
