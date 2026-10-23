import { TopologyDiagram } from "@/components/docs/diagrams";
import { A, C, Callout, CardLink, Cards, CodeBlock, H2, H3, Ol, P, Step, Steps, Table, Ul } from "@/components/docs/prose";

export function Introduction() {
  return (
    <>
      <P>
        VPSPilot is a self-hosted control plane for the Linux servers you already own. You run one dashboard, install a small agent on each
        Ubuntu or Debian server, and from then on deploy applications, run databases, route domains, read logs, watch health and take
        encrypted backups without opening an SSH session for routine work.
      </P>
      <P>
        It is built for a single team operating a handful to a few dozen hosts: no Kubernetes, no proprietary runtime, and no inbound port
        on your servers. Every change is a typed, audited operation, and nothing ever runs an arbitrary shell command on your behalf.
      </P>

      <H2>What it manages</H2>
      <Table
        head={["Area", "What you get"]}
        rows={[
          ["Servers", "Enrollment with a one-line install, live CPU, memory, disk and network metrics, service and container inventory."],
          ["Applications", "Deploys from Git or a container image as Docker containers, native systemd services (Node.js, Python) or Compose projects, with health-checked releases, rollback and per-app traffic metrics."],
          ["Databases", "Managed PostgreSQL, MySQL, MariaDB and Redis containers, or connections to databases you already run, with a data browser, import/export and history charts."],
          ["Backups", "Scheduled, AES-256 encrypted dumps with retention and restore verification, copied to S3-compatible storage (R2, S3, B2…) or Google Drive."],
          ["Domains", "A Caddy reverse proxy per server with automatic Let's Encrypt certificates and DNS checks."],
          ["Operations", "Alert rules, notifications by inbox, email, Slack, Telegram or webhook, journal and container logs, and a full audit trail."],
        ]}
      />

      <H2>How it fits together</H2>
      <P>
        The <strong>control plane</strong> is a FastAPI service with a PostgreSQL database and a Next.js dashboard. Each server runs the{" "}
        <strong>agent</strong>, an unprivileged process that connects out to the control plane over HTTPS, and a small{" "}
        <strong>privileged helper</strong> that performs a fixed list of operations for it. The agent asks for work; the control plane never
        connects in.
      </P>
      <TopologyDiagram />
      <P>
        Read <A href="/docs/concepts/architecture">Architecture</A> for the full picture and{" "}
        <A href="/docs/concepts/security">Security Model</A> for what each part is allowed to do.
      </P>

      <H2>Start here</H2>
      <Cards>
        <CardLink href="/docs/getting-started/install" icon="download" title="Install VPSPilot">
          One command: dashboard, API, database and HTTPS.
        </CardLink>
        <CardLink href="/docs/getting-started/connect-server" icon="server" title="Connect a server">
          Enroll your first host with one command.
        </CardLink>
        <CardLink href="/docs/getting-started/first-deploy" icon="rocket" title="First deployment">
          Ship an app from Git and give it a domain.
        </CardLink>
        <CardLink href="/docs/reference/api" icon="terminal" title="API access">
          Automate anything the dashboard does.
        </CardLink>
      </Cards>
    </>
  );
}

export function Install() {
  return (
    <>
      <P>
        The control plane is the dashboard, the API and a PostgreSQL database for VPSPilot&apos;s own state. One command installs all of it on
        an Ubuntu or Debian server, behind HTTPS on a domain of your choice. It can be a small VPS of its own or one of the servers you want to
        manage: the same machine can run the control plane and your apps.
      </P>

      <H2>Requirements</H2>
      <Ul>
        <li>
          <strong>Ubuntu</strong> 22.04 or later, or <strong>Debian</strong> 12 or later, on x86_64 or arm64, with root access.
        </li>
        <li>
          <strong>2 GB of memory</strong> (building the dashboard needs it) and about <strong>20 GB of disk</strong>.
        </li>
        <li>
          <strong>Ports 80 and 443 free.</strong> VPSPilot&apos;s proxy (Caddy) answers on them for the dashboard and, later, your apps&apos;
          domains. If nginx or Apache already serves sites there, see <A href="#nginx-or-apache-already-running">below</A>.
        </li>
        <li>
          A <strong>domain name</strong> for the dashboard, such as <C>pilot.example.com</C>.
        </li>
        <li>
          Optional: a <A href="https://resend.com">Resend</A> API key for email. Without one, sign-in codes are written to the API log.
        </li>
      </Ul>

      <H2>Install</H2>
      <Steps>
        <Step title="Point the domain at the server">
          <P>
            Add an <C>A</C> record for the dashboard&apos;s hostname with the server&apos;s public IP (and an <C>AAAA</C> record if it has
            IPv6). On Cloudflare, leave the record as <strong>DNS only</strong> so the certificate can be issued. Wait until it resolves:
          </P>
          <CodeBlock code={`dig +short pilot.example.com`} />
        </Step>
        <Step title="Run the installer">
          <CodeBlock
            code={`
curl -fsSL https://raw.githubusercontent.com/philtechphilips/VPS-PIlot-BE/main/deploy/install.sh \\
  | sudo bash -s -- --domain pilot.example.com --email you@example.com`}
          />
          <P>
            It takes five to ten minutes the first time. Add <C>--resend-key re_…</C> to send email. Running it again later is safe: it keeps
            the existing keys and data.
          </P>
        </Step>
        <Step title="Create the owner account right away">
          <P>
            Open <C>https://pilot.example.com/setup</C>. Whoever opens it first becomes the owner, so do this before sharing the address.
            Continue with <A href="/docs/getting-started/first-run">First-run Setup</A>.
          </P>
        </Step>
      </Steps>

      <H3>Installer options</H3>
      <Table
        head={["Option", "Meaning"]}
        rows={[
          [<C key="d">--domain HOST</C>, "Hostname for the dashboard (required)."],
          [<C key="e">--email ADDRESS</C>, "Contact address for Let's Encrypt certificate notices."],
          [<C key="r">--resend-key KEY</C>, "Resend API key, so sign-in codes, alerts and deployment results are emailed."],
          [<C key="b">--branch NAME</C>, <>Branch to install (default <C>main</C>).</>],
          [<C key="i">--internal-tls</C>, "Use Caddy's own certificate authority instead of Let's Encrypt (for testing without public DNS)."],
        ]}
      />

      <H2>What the installer does</H2>
      <Ol>
        <li>Installs Docker, if it isn&apos;t there yet.</li>
        <li>
          Clones the API and the dashboard into <C>/opt/vpspilot/api</C> and <C>/opt/vpspilot/web</C>.
        </li>
        <li>
          Generates the database password, <C>SECRET_KEY</C> and <C>ENCRYPTION_KEY</C> into <C>/opt/vpspilot/api/deploy/.env</C> (mode
          0600).
        </li>
        <li>Builds and starts the containers below. Database migrations run every time the API starts.</li>
        <li>Starts the proxy and obtains a certificate for your domain.</li>
        <li>
          Installs the <C>vpspilot</C> command.
        </li>
      </Ol>
      <Table
        head={["Container", "What it is"]}
        rows={[
          [<C key="w">vpspilot-web</C>, "The dashboard (Next.js)."],
          [<C key="a">vpspilot-api</C>, "The API (FastAPI), including the scheduler for alerts, backups and metrics."],
          [<C key="db">vpspilot-db</C>, "PostgreSQL for VPSPilot's own data. Not exposed on any port, so it doesn't clash with a PostgreSQL you already run."],
          [<C key="p">vpspilot-proxy</C>, <>Caddy on ports 80 and 443. <C>/api/*</C> and <C>/agent/*</C> go to the API, everything else to the dashboard.</>],
        ]}
      />
      <P>
        The proxy is the same one the agent manages for your apps&apos; domains, so the control plane and your apps share ports 80 and 443 on
        one server. The dashboard&apos;s own site lives in <C>/var/lib/vpspilot-proxy/extra/control-plane.caddy</C>; the agent never rewrites
        it.
      </P>

      <H2>After installing</H2>
      <Ul>
        <li>
          <strong>Manage this server too:</strong> in <strong>Servers → Enroll Server</strong>, run the command it shows on the same server.
          See <A href="/docs/getting-started/connect-server">Connect a Server</A>.
        </li>
        <li>
          <strong>Download the recovery kit</strong> from <strong>Settings → Security</strong> and keep it offline. It holds the keys that
          decrypt your stored secrets and backups.
        </li>
        <li>
          <strong>Add off-server backup storage</strong> (Cloudflare R2, S3, Google Drive…) in <strong>Settings → Backup Storage</strong>.
          See <A href="/docs/backups/s3-storage">Off-server Storage</A>.
        </li>
      </Ul>

      <H2>Manage the control plane</H2>
      <Table
        head={["Command", "What it does"]}
        rows={[
          [<C key="s">sudo vpspilot status</C>, "Container state and API health."],
          [<C key="l">sudo vpspilot logs [api|web|db|proxy]</C>, "Follow one component's logs (sign-in codes appear in the API log when email isn't set up)."],
          [<C key="u">sudo vpspilot upgrade</C>, "Back up, pull the latest code, rebuild and restart, and upgrade the agent on this server. Upgrade agents on other servers afterwards."],
          [<C key="b">sudo vpspilot backup [DIR]</C>, <>Save the database and <C>.env</C> (with its keys) to <C>DIR</C>, default <C>/var/backups/vpspilot</C>.</>],
          [<C key="r">sudo vpspilot restore FILE</C>, <>Restore a file made by <C>vpspilot backup</C>.</>],
          [<C key="rs">sudo vpspilot restart</C>, <>Apply edits to <C>.env</C>, such as adding <C>RESEND_API_KEY</C>.</>],
          [<C key="ad">sudo vpspilot admin EMAIL</C>, "Add another administrator, or promote an existing user."],
        ]}
      />
      <P>
        Settings live in <C>/opt/vpspilot/api/deploy/.env</C>; every variable is listed in{" "}
        <A href="/docs/reference/configuration">Configuration</A>.
      </P>

      <H2 id="nginx-or-apache-already-running">nginx or Apache already running</H2>
      <P>Only one program can own ports 80 and 443. Check what the existing web server serves before stopping it:</P>
      <CodeBlock
        code={`
sudo nginx -T 2>/dev/null | grep -E "server_name|proxy_pass|root "
sudo apache2ctl -S`}
      />
      <Ul>
        <li>
          If it only serves the default page, stop it with <C>sudo systemctl disable --now nginx apache2</C> and run the installer.
        </li>
        <li>
          If it serves real sites, move each one into VPSPilot as an application with a domain, then retire the old server. Until then you
          can move the old server to another port (say 8080) and route its domain through VPSPilot&apos;s proxy with a file in{" "}
          <C>/var/lib/vpspilot-proxy/extra/</C>.
        </li>
      </Ul>
      <P>
        PostgreSQL, MySQL or Redis already on the server keep running untouched; connect them in <strong>Databases → Connect an existing
        one</strong> (host <C>127.0.0.1</C>). See <A href="/docs/databases/overview">Database Overview</A>.
      </P>

      <H2>Manual install (advanced)</H2>
      <P>
        For development, or a server that will never host apps&apos; domains, you can run the pieces yourself: Python 3.12 with{" "}
        <A href="https://docs.astral.sh/uv/">uv</A> for the API, Node.js 20.9+ for the dashboard, and PostgreSQL 14+.
      </P>
      <CodeBlock
        code={`
# API
cd be && uv sync && cp .env.example .env    # fill in the database, SECRET_KEY, ENCRYPTION_KEY
uv run poe migrate
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000

# Dashboard (proxies /api/* to the API)
cd frontend && npm ci
API_URL=http://127.0.0.1:8000 npm run build
npm run start -- -p 3000`}
      />
      <Callout type="warning" title="Don't put your own proxy on ports 80 and 443">
        <p>
          When you add a domain to an app, the agent starts VPSPilot&apos;s proxy on ports 80 and 443. A separate Caddy or nginx there makes
          that fail. Either use the installer, or put the dashboard&apos;s site in <C>/var/lib/vpspilot-proxy/extra/</C> and let VPSPilot&apos;s
          proxy serve it. Expose <C>/agent/*</C> on the same hostname so agents can reach the API, and keep port 8000 bound to localhost.
        </p>
      </Callout>
    </>
  );
}

export function FirstRun() {
  return (
    <>
      <P>
        VPSPilot has no public sign-up. The first visit to <C>/setup</C> creates the owner, and the setup wizard keeps sending you back until
        it is finished. Closing the tab midway is fine: signing in again resumes where you left off.
      </P>

      <Steps>
        <Step title="Create the owner account">
          <P>Open the dashboard, choose a name, email and strong password. The setup endpoint only works while no owner exists.</P>
        </Step>
        <Step title="Verify your email">
          <P>
            A 6-digit code is emailed to you. Codes are valid for 10 minutes, allow 5 attempts and can be resent after 30 seconds. Without
            Resend configured, look for the code in the API log.
          </P>
        </Step>
        <Step title="Choose a second factor">
          <P>
            Pick an <strong>authenticator app</strong> (TOTP, recommended) or <strong>email codes</strong>. With an authenticator you get 10
            single-use recovery codes. Save them somewhere safe: they are shown once and stored only as hashes.
          </P>
        </Step>
        <Step title="Manage this server too?">
          <P>
            If the dashboard runs on a server you also want to manage, enable self-management and the wizard gives you an install command for
            it. You can always do this later from <strong>Servers → Enroll a server</strong>.
          </P>
        </Step>
      </Steps>

      <H2>How sign-in is protected</H2>
      <Table
        head={["Control", "Behaviour"]}
        rows={[
          ["Second factor", "Every sign-in needs an authenticator code, a recovery code or an emailed code."],
          ["Lockout", "5 wrong passwords lock the account for 15 minutes. Unknown emails get the same response and timing."],
          ["Sessions", "Access tokens last 15 minutes. The refresh token is an httpOnly cookie that rotates on every use and lasts 30 days."],
          ["Revocation", <>Revoke any device from <strong>Settings → Sessions</strong>; its access token stops working immediately.</>],
          ["Password reset", "Reset links expire after 30 minutes and sign out every device."],
        ]}
      />

      <H2>More administrators</H2>
      <P>
        There is no public sign-up. Add administrators on the control plane&apos;s server; you&apos;re asked for their password. Everyone with
        an account can manage every enrolled server.
      </P>
      <CodeBlock code={`sudo vpspilot admin teammate@example.com`} />
      <P>
        On a manual install, run <C>uv run poe createadmin teammate@example.com</C> in the API directory instead.
      </P>
    </>
  );
}

export function ConnectServer() {
  return (
    <>
      <P>
        A server joins VPSPilot by running the agent installer with a single-use enrollment token. The agent then reports in every few
        seconds, and the server shows as online in the dashboard.
      </P>

      <H2>Requirements</H2>
      <Ul>
        <li>
          <strong>Ubuntu</strong> (22.04 or later) or <strong>Debian</strong> (12 or later), on x86_64 or arm64.
        </li>
        <li>Root access, through <C>sudo</C>.</li>
        <li>Outbound HTTPS to the control plane URL. No inbound port is opened for VPSPilot.</li>
        <li>
          <strong>Docker</strong> for container and Compose apps, managed databases and domains. Native (systemd) apps, monitoring, logs
          and service control work without it.
        </li>
      </Ul>

      <H2>Install the agent</H2>
      <Steps>
        <Step title="Create an enrollment">
          <P>
            In the dashboard, go to <strong>Servers → Enroll a server</strong>, name the server (lowercase letters, digits and dashes) and add
            optional tags. VPSPilot creates an <C>ept_</C> token valid for 15 minutes and shows the install command.
          </P>
        </Step>
        <Step title="Run the installer on the server">
          <CodeBlock code={`curl -fsSL https://pilot.example.com/agent/install.sh | sudo bash -s -- --token ept_...`} />
          <P>
            The installer is a short, readable script; you can download and read it first. It refuses to run on anything other than Ubuntu or
            Debian.
          </P>
        </Step>
        <Step title="Watch it come online">
          <P>
            The server moves from <strong>pending</strong> to <strong>online</strong> within a few seconds. Host facts, metrics and the
            service and container inventory start filling in.
          </P>
        </Step>
      </Steps>

      <H2>What the installer does</H2>
      <Ol>
        <li>
          Installs <C>python3</C>, <C>python3-psutil</C>, <C>git</C> and <C>curl</C> from apt.
        </li>
        <li>
          Creates a system user <C>vpspilot</C> with no login shell.
        </li>
        <li>
          Downloads the agent package from the control plane into <C>/opt/vpspilot-agent</C>.
        </li>
        <li>
          Redeems the token for a long-lived <C>agt_</C> agent credential, stored in <C>/etc/vpspilot/agent.json</C> with mode 0600.
        </li>
        <li>
          Installs and starts two systemd services: <C>vpspilot-agent</C> and <C>vpspilot-helper</C>.
        </li>
      </Ol>

      <H3>What gets started</H3>
      <Table
        head={["Service", "Runs as", "Purpose"]}
        rows={[
          [<C key="a">vpspilot-agent</C>, "vpspilot", "Heartbeats, metrics, inventory and job polling. Sandboxed with ProtectSystem=strict."],
          [<C key="h">vpspilot-helper</C>, "root", "Performs allowlisted operations on a local Unix socket only the vpspilot group can use."],
        ]}
      />

      <H3>What gets stored</H3>
      <Table
        head={["Path", "Contents"]}
        rows={[
          [<C key="1">/opt/vpspilot-agent</C>, "Agent code"],
          [<C key="2">/etc/vpspilot/agent.json</C>, "Control plane URL, server id and agent credential"],
          [<C key="3">/var/lib/vpspilot-apps</C>, "Application checkouts, build contexts and Compose releases"],
          [<C key="3b">/srv/vpspilot</C>, "Native (systemd) apps: one release folder per deployment, plus a shared folder"],
          [<C key="4">/var/lib/vpspilot-db</C>, "Managed database configuration (data lives in Docker volumes named vpdb-<name>)"],
          [<C key="5">/var/lib/vpspilot-backups</C>, "Encrypted local backups"],
          [<C key="6">/var/lib/vpspilot-proxy</C>, "Generated Caddyfile and certificates"],
        ]}
      />

      <H2>Upgrade the agent</H2>
      <P>Run the installer again without a token. It replaces the code in place and restarts both services; the enrollment is kept.</P>
      <CodeBlock code={`curl -fsSL https://pilot.example.com/agent/install.sh | sudo bash`} />

      <H2>Remove a server</H2>
      <P>
        <strong>Revoke</strong> invalidates the agent credential immediately; the agent exits and systemd does not restart it. To clean up
        the host afterwards:
      </P>
      <CodeBlock
        code={`
sudo systemctl disable --now vpspilot-agent vpspilot-helper
sudo rm -rf /opt/vpspilot-agent /etc/vpspilot /etc/systemd/system/vpspilot-*.service
sudo systemctl daemon-reload`}
      />
      <Callout type="note">
        <p>Removing the agent leaves your containers, databases and backups in place. Delete them from the dashboard first if you want them gone.</p>
      </Callout>
    </>
  );
}

export function FirstDeploy() {
  return (
    <>
      <P>
        This walkthrough takes a web app from a Git repository to a live HTTPS URL. It assumes you have an online server with Docker installed
        and a domain whose DNS you control.
      </P>

      <Steps>
        <Step title="Connect GitHub (optional)">
          <P>
            For private repositories and deploy-on-push, open <strong>Settings → GitHub</strong> and connect. VPSPilot creates a GitHub App that
            belongs to you. Public repositories can be deployed by URL without this. See{" "}
            <A href="/docs/deployments/github">GitHub Integration</A>.
          </P>
        </Step>
        <Step title="Create the application">
          <P>
            Go to <strong>Applications → New application</strong>, pick the server, then the repository and branch. Choose how it runs:{" "}
            <strong>Docker</strong> (the default), <strong>systemd</strong> for a Node.js or Python app without Docker, or{" "}
            <strong>Compose</strong> for a repository with a <C>compose.yaml</C>. See{" "}
            <A href="/docs/deployments/applications">Applications</A>.
          </P>
          <P>
            For Docker, set the <strong>container port</strong> your app listens on. VPSPilot also sets <C>PORT</C> to that value, so apps
            that read it work unchanged.
          </P>
        </Step>
        <Step title="Review the build">
          <P>
            With a <C>Dockerfile</C> in the repository, VPSPilot builds it. Without one, it detects Node.js, Bun, Python, Go, Rust or a static
            site and writes a Dockerfile for you. Override the build or start command if detection guesses wrong.
          </P>
        </Step>
        <Step title="Add environment variables">
          <P>Mark credentials as secret: they are encrypted at rest and never shown again in the dashboard.</P>
        </Step>
        <Step title="Deploy">
          <P>
            The deployment log streams the checkout, build, health check and release. The new container only replaces the old one after it
            answers on the health check path.
          </P>
        </Step>
        <Step title="Add a domain">
          <P>
            In <strong>Domains</strong>, add <C>app.example.com</C> and point an <C>A</C> record at the server’s public IP.
            Caddy obtains a certificate on the first request.
          </P>
          <CodeBlock lang="text" title="DNS" code={`app.example.com.  300  IN  A  203.0.113.10`} />
        </Step>
      </Steps>

      <Callout type="tip" title="Need a database?">
        <p>
          Create a managed PostgreSQL instance on the same server and attach it to the app. VPSPilot creates a dedicated login
          and adds <C>DATABASE_URL</C> to the app’s environment. See <A href="/docs/databases/users">Users and Attaching</A>.
        </p>
      </Callout>
    </>
  );
}
